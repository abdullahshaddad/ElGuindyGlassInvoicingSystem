import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../helpers/auth";

export const listGlassTypes = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    if (args.activeOnly) {
      return await ctx.db
        .query("glassTypes")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
    }
    return await ctx.db.query("glassTypes").collect();
  },
});

export const getGlassType = query({
  args: { glassTypeId: v.id("glassTypes") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.glassTypeId);
  },
});
