import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../helpers/auth";
import { bevelingType } from "../schema";

/**
 * List all beveling rates, optionally filtered to active-only.
 */
export const listBevelingRates = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const rates = await ctx.db.query("bevelingRates").collect();
    if (args.activeOnly) {
      return rates.filter((r) => r.active);
    }
    return rates;
  },
});

/**
 * Get all active beveling rates for a specific beveling type.
 */
export const getRatesByType = query({
  args: { bevelingType: bevelingType },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("bevelingRates")
      .withIndex("by_bevelingType_active", (q) =>
        q.eq("bevelingType", args.bevelingType).eq("active", true)
      )
      .collect();
  },
});

/**
 * Get the rate per metre for a specific beveling type and glass thickness.
 * Used by operation calculation to price beveling work.
 */
export const getRateForThickness = query({
  args: { bevelingType: bevelingType, thickness: v.number() },
  handler: async (ctx, args) => {
    const rates = await ctx.db
      .query("bevelingRates")
      .withIndex("by_bevelingType_active", (q) =>
        q.eq("bevelingType", args.bevelingType).eq("active", true)
      )
      .collect();

    const match = rates.find(
      (r) => args.thickness >= r.minThickness && args.thickness <= r.maxThickness
    );

    if (match) return match.ratePerMeter;

    // Fallback default rates
    const defaults: Record<string, number> = {
      KHARZAN:      12.0,
      CHAMBOURLIEH: 15.0,
      BEVEL_1_CM:    8.0,
      BEVEL_2_CM:   10.0,
      BEVEL_3_CM:   12.0,
      JULIA:        18.0,
      SANDING:      20.0,
    };
    return defaults[args.bevelingType] ?? 10.0;
  },
});
