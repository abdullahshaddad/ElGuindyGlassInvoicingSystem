import { v } from "convex/values";
import { tenantQuery, verifyTenantOwnership } from "../helpers/multitenancy";

export const getPayment = tenantQuery({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args, tenant) => {
    const payment = await ctx.db.get(args.paymentId);
    verifyTenantOwnership(payment, tenant.tenantId);

    const customer = await ctx.db.get(payment.customerId);
    const invoice = payment.invoiceId
      ? await ctx.db.get(payment.invoiceId)
      : null;

    return { ...payment, customer, invoice };
  },
});

export const getCustomerPayments = tenantQuery({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args, tenant) => {
    // Verify customer belongs to tenant
    const customer = await ctx.db.get(args.customerId);
    verifyTenantOwnership(customer, tenant.tenantId);

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_tenantId_customerId", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("customerId", args.customerId)
      )
      .order("desc")
      .collect();

    return await Promise.all(
      payments.map(async (p) => {
        const invoice = p.invoiceId ? await ctx.db.get(p.invoiceId) : null;
        return { ...p, invoiceReadableId: invoice?.readableId ?? null };
      })
    );
  },
});

export const getInvoicePayments = tenantQuery({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args, tenant) => {
    // Verify invoice belongs to tenant
    const invoice = await ctx.db.get(args.invoiceId);
    verifyTenantOwnership(invoice, tenant.tenantId);

    return await ctx.db
      .query("payments")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .order("desc")
      .collect();
  },
});

export const getPaymentsBetweenDates = tenantQuery({
  args: { startDate: v.number(), endDate: v.number() },
  handler: async (ctx, args, tenant) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_tenantId_paymentDate", (q) =>
        q.eq("tenantId", tenant.tenantId)
          .gte("paymentDate", args.startDate)
          .lte("paymentDate", args.endDate)
      )
      .collect();

    return await Promise.all(
      payments.map(async (p) => {
        const customer = await ctx.db.get(p.customerId);
        const invoice = p.invoiceId ? await ctx.db.get(p.invoiceId) : null;
        return {
          ...p,
          customerName: customer?.name ?? "غير معروف",
          invoiceReadableId: invoice?.readableId ?? null,
        };
      })
    );
  },
});
