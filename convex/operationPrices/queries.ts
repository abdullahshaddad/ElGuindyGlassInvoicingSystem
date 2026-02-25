import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../helpers/auth";
import { operationCategory } from "../schema";

export const listOperationPrices = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const prices = await ctx.db.query("operationPrices").collect();
    if (args.activeOnly) {
      return prices.filter((p) => p.active);
    }
    return prices;
  },
});

export const getByCategoryAndSubtype = query({
  args: { category: operationCategory, subtype: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("operationPrices")
      .withIndex("by_category_subtype", (q) =>
        q.eq("category", args.category).eq("subtype", args.subtype)
      )
      .unique();
  },
});
