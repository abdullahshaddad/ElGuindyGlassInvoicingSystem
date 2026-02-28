import { v } from "convex/values";
import { tenantQuery, verifyTenantOwnership } from "../helpers/multitenancy";
import { operationCategory } from "../schema";

export const listOperationPrices = tenantQuery({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args, tenant) => {
    const prices = await ctx.db
      .query("operationPrices")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();
    if (args.activeOnly) {
      return prices.filter((p) => p.active);
    }
    return prices;
  },
});

export const getByCategoryAndSubtype = tenantQuery({
  args: { category: operationCategory, subtype: v.string() },
  handler: async (ctx, args, tenant) => {
    return await ctx.db
      .query("operationPrices")
      .withIndex("by_tenantId_category_subtype", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("category", args.category).eq("subtype", args.subtype)
      )
      .unique();
  },
});
