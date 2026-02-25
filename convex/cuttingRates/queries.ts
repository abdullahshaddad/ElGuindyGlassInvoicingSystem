import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../helpers/auth";

export const listLaserRates = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const rates = await ctx.db.query("laserRates").collect();
    if (args.activeOnly) {
      return rates.filter((r) => r.active);
    }
    return rates;
  },
});

export const getLaserRateForThickness = query({
  args: { thickness: v.number() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const rates = await ctx.db
      .query("laserRates")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    const match = rates.find(
      (r) => args.thickness >= r.minThickness && args.thickness <= r.maxThickness
    );

    return match ?? null;
  },
});
