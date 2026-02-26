import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../helpers/auth";
import { paginationOptsValidator } from "convex/server";

export const getCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.customerId);
  },
});

export const listCustomers = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("customers")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const searchCustomers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    if (!args.searchTerm.trim()) return [];
    return await ctx.db
      .query("customers")
      .withSearchIndex("search_name", (q) => q.search("name", args.searchTerm))
      .take(20);
  },
});

export const getCustomerByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("customers")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();
  },
});

export const getCustomerInvoices = query({
  args: {
    customerId: v.id("customers"),
    customerName: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const result = await ctx.db
      .query("invoices")
      .withIndex("by_customerId", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .paginate(args.paginationOpts);

    if (args.customerName) {
      return {
        ...result,
        page: result.page.map((invoice) => ({
          ...invoice,
          customerName: args.customerName,
        })),
      };
    }

    return result;
  },
});
