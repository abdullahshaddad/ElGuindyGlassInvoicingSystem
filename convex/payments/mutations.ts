import { v } from "convex/values";
import { tenantMutation, verifyTenantOwnership } from "../helpers/multitenancy";
import { checkPermission } from "../helpers/permissions";
import { logAuditEvent } from "../helpers/auditLog";
import { paymentMethod } from "../schema";

/**
 * Record a payment for an invoice or general customer balance.
 */
export const recordPayment = tenantMutation({
  args: {
    customerId: v.id("customers"),
    invoiceId: v.optional(v.id("invoices")),
    amount: v.number(),
    paymentMethod: paymentMethod,
    referenceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "invoices", "update");

    if (args.amount <= 0) {
      throw new Error("مبلغ الدفع يجب أن يكون أكبر من صفر");
    }

    const customer = await ctx.db.get(args.customerId);
    verifyTenantOwnership(customer, tenant.tenantId);

    if (customer.customerType === "CASH") {
      throw new Error("العملاء النقديون يدفعون كامل المبلغ عند إنشاء الفاتورة");
    }

    let invoice = null;
    if (args.invoiceId) {
      invoice = await ctx.db.get(args.invoiceId);
      verifyTenantOwnership(invoice, tenant.tenantId);

      if (invoice.customerId !== args.customerId) {
        throw new Error("الفاتورة لا تنتمي للعميل المحدد");
      }

      if (invoice.remainingBalance <= 0.01) {
        throw new Error("الفاتورة مدفوعة بالكامل بالفعل");
      }

      if (args.amount > invoice.remainingBalance + 0.01) {
        throw new Error(
          `المبلغ المدفوع (${args.amount.toFixed(2)}) أكبر من الرصيد المتبقي (${invoice.remainingBalance.toFixed(2)})`
        );
      }
    }

    const now = Date.now();

    const paymentId = await ctx.db.insert("payments", {
      tenantId: tenant.tenantId,
      customerId: args.customerId,
      invoiceId: args.invoiceId,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      paymentDate: now,
      referenceNumber: args.referenceNumber,
      notes: args.notes,
      createdAt: now,
      createdBy: tenant.user.username,
    });

    if (invoice && args.invoiceId) {
      const newAmountPaid = (invoice.amountPaidNow ?? 0) + args.amount;
      const newRemaining = invoice.totalPrice - newAmountPaid;
      const isPaid = newRemaining <= 0.01;

      await ctx.db.patch(args.invoiceId, {
        amountPaidNow: newAmountPaid,
        remainingBalance: Math.max(0, newRemaining),
        status: isPaid ? "PAID" : invoice.status,
        paymentDate: isPaid ? now : invoice.paymentDate,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.customerId, {
      balance: (customer.balance ?? 0) - args.amount,
      updatedAt: now,
    });

    await logAuditEvent(ctx, tenant, {
      action: "payment.created",
      entityType: "payment",
      entityId: paymentId,
    });

    return paymentId;
  },
});

/**
 * Delete a payment (admin only, reverses balance changes).
 */
export const deletePayment = tenantMutation({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "invoices", "delete");

    const payment = await ctx.db.get(args.paymentId);
    verifyTenantOwnership(payment, tenant.tenantId);

    const now = Date.now();

    const customer = await ctx.db.get(payment.customerId);
    if (customer) {
      await ctx.db.patch(payment.customerId, {
        balance: (customer.balance ?? 0) + payment.amount,
        updatedAt: now,
      });
    }

    if (payment.invoiceId) {
      const invoice = await ctx.db.get(payment.invoiceId);
      if (invoice) {
        const newAmountPaid = Math.max(0, (invoice.amountPaidNow ?? 0) - payment.amount);
        const newRemaining = invoice.totalPrice - newAmountPaid;

        await ctx.db.patch(payment.invoiceId, {
          amountPaidNow: newAmountPaid,
          remainingBalance: newRemaining,
          status: invoice.status === "PAID" ? "PENDING" : invoice.status,
          updatedAt: now,
        });
      }
    }

    await ctx.db.delete(args.paymentId);

    await logAuditEvent(ctx, tenant, {
      action: "payment.deleted",
      entityType: "payment",
      entityId: args.paymentId,
      severity: "critical",
    });
  },
});
