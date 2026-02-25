import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../helpers/auth";

export const getPayment = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error("لم يتم العثور على الدفعة");

    const customer = await ctx.db.get(payment.customerId);
    const invoice = payment.invoiceId
      ? await ctx.db.get(payment.invoiceId)
      : null;

    return { ...payment, customer, invoice };
  },
});

export const getCustomerPayments = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_customerId", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();

    // Enrich with invoice readableId
    return await Promise.all(
      payments.map(async (p) => {
        const invoice = p.invoiceId ? await ctx.db.get(p.invoiceId) : null;
        return { ...p, invoiceReadableId: invoice?.readableId ?? null };
      })
    );
  },
});

export const getInvoicePayments = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("payments")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .order("desc")
      .collect();
  },
});

export const getPaymentsBetweenDates = query({
  args: { startDate: v.number(), endDate: v.number() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_paymentDate", (q) =>
        q.gte("paymentDate", args.startDate).lte("paymentDate", args.endDate)
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
