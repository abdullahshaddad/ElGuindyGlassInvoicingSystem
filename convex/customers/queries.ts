import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { tenantQuery, verifyTenantOwnership } from "../helpers/multitenancy";

export const getCustomer = tenantQuery({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args, tenant) => {
    const customer = await ctx.db.get(args.customerId);
    verifyTenantOwnership(customer, tenant.tenantId);
    return customer;
  },
});

export const listCustomers = tenantQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args, tenant) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const searchCustomers = tenantQuery({
  args: { searchTerm: v.string() },
  handler: async (ctx, args, tenant) => {
    if (!args.searchTerm.trim()) return [];
    return await ctx.db
      .query("customers")
      .withSearchIndex("search_name", (q) =>
        q.search("name", args.searchTerm).eq("tenantId", tenant.tenantId)
      )
      .take(20);
  },
});

export const getCustomerByPhone = tenantQuery({
  args: { phone: v.string() },
  handler: async (ctx, args, tenant) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_tenantId_phone", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("phone", args.phone)
      )
      .unique();
  },
});

export const getCustomerInvoices = tenantQuery({
  args: {
    customerId: v.id("customers"),
    customerName: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args, tenant) => {
    // Verify customer belongs to tenant
    const customer = await ctx.db.get(args.customerId);
    verifyTenantOwnership(customer, tenant.tenantId);

    const result = await ctx.db
      .query("invoices")
      .withIndex("by_tenantId_customerId", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("customerId", args.customerId)
      )
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
