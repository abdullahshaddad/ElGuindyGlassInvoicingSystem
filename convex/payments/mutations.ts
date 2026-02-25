import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../helpers/auth";
import { paymentMethod } from "../schema";

/**
 * Record a payment for an invoice or general customer balance.
 * Port of PaymentService.recordPayment() from Java.
 */
export const recordPayment = mutation({
  args: {
    customerId: v.id("customers"),
    invoiceId: v.optional(v.id("invoices")),
    amount: v.number(),
    paymentMethod: paymentMethod,
    referenceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["OWNER", "ADMIN", "CASHIER"]);

    // Validate amount
    if (args.amount <= 0) {
      throw new Error("مبلغ الدفع يجب أن يكون أكبر من صفر");
    }

    // Get customer
    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("العميل غير موجود");

    // CASH customers cannot have payments recorded
    if (customer.customerType === "CASH") {
      throw new Error("العملاء النقديون يدفعون كامل المبلغ عند إنشاء الفاتورة");
    }

    let invoice = null;
    if (args.invoiceId) {
      invoice = await ctx.db.get(args.invoiceId);
      if (!invoice) throw new Error("الفاتورة غير موجودة");

      // Validate invoice belongs to customer
      if (invoice.customerId !== args.customerId) {
        throw new Error("الفاتورة لا تنتمي للعميل المحدد");
      }

      // Check if already fully paid
      if (invoice.remainingBalance <= 0.01) {
        throw new Error("الفاتورة مدفوعة بالكامل بالفعل");
      }

      // Validate amount doesn't exceed remaining
      if (args.amount > invoice.remainingBalance + 0.01) {
        throw new Error(
          `المبلغ المدفوع (${args.amount.toFixed(2)}) أكبر من الرصيد المتبقي (${invoice.remainingBalance.toFixed(2)})`
        );
      }
    }

    const now = Date.now();

    // Create payment record
    const paymentId = await ctx.db.insert("payments", {
      customerId: args.customerId,
      invoiceId: args.invoiceId,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      paymentDate: now,
      referenceNumber: args.referenceNumber,
      notes: args.notes,
      createdAt: now,
      createdBy: user.username,
    });

    // Update invoice if specified
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

    // Update customer balance (subtract payment)
    await ctx.db.patch(args.customerId, {
      balance: (customer.balance ?? 0) - args.amount,
      updatedAt: now,
    });

    return paymentId;
  },
});

/**
 * Delete a payment (admin only, reverses balance changes).
 * Port of PaymentService.deletePayment() from Java.
 */
export const deletePayment = mutation({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error("لم يتم العثور على الدفعة");

    const now = Date.now();

    // Reverse customer balance (add back the payment amount)
    const customer = await ctx.db.get(payment.customerId);
    if (customer) {
      await ctx.db.patch(payment.customerId, {
        balance: (customer.balance ?? 0) + payment.amount,
        updatedAt: now,
      });
    }

    // Reverse invoice if applicable
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
  },
});
