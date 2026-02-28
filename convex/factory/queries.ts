import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { tenantQuery, verifyTenantOwnership } from "../helpers/multitenancy";

/**
 * Get invoices for the factory worker view.
 * Shows pending and in-progress invoices with line details.
 */
export const getFactoryInvoices = tenantQuery({
  args: {
    workStatus: v.optional(
      v.union(
        v.literal("PENDING"),
        v.literal("IN_PROGRESS"),
        v.literal("COMPLETED"),
        v.literal("CANCELLED")
      )
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args, tenant) => {
    const page = await ctx.db
      .query("invoices")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .order("desc")
      .paginate(args.paginationOpts);

    let filteredResults = page.page;
    if (args.workStatus) {
      filteredResults = filteredResults.filter(
        (i) => i.workStatus === args.workStatus
      );
    }

    const enriched = await Promise.all(
      filteredResults.map(async (inv) => {
        const customer = await ctx.db.get(inv.customerId);

        const lines = await ctx.db
          .query("invoiceLines")
          .withIndex("by_invoiceId", (q) => q.eq("invoiceId", inv._id))
          .collect();

        const linesWithDetails = lines.map((line) => {
          const snapshot = line.glassTypeSnapshot;
          return {
            ...line,
            glassTypeName:      snapshot?.name      ?? "غير معروف",
            glassTypeThickness: snapshot?.thickness,
            operations:         line.operations ?? [],
          };
        });

        return {
          ...inv,
          customerName: customer?.name ?? "غير معروف",
          lines: linesWithDetails,
        };
      })
    );

    return { ...page, page: enriched };
  },
});

/**
 * Get a single invoice with full details for factory view.
 */
export const getFactoryInvoiceDetail = tenantQuery({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args, tenant) => {
    const invoice = await ctx.db.get(args.invoiceId);
    verifyTenantOwnership(invoice, tenant.tenantId);

    const customer = await ctx.db.get(invoice.customerId);
    const lines = await ctx.db
      .query("invoiceLines")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    const linesWithDetails = lines.map((line) => {
      const glassType = line.glassTypeSnapshot ?? { name: "—", thickness: 0 };
      return {
        ...line,
        glassType,
        operations: line.operations ?? [],
      };
    });

    return { ...invoice, customer, lines: linesWithDetails };
  },
});
