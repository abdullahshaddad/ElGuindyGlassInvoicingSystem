import { v } from "convex/values";
import { tenantQuery } from "../helpers/multitenancy";
import { bevelingType } from "../schema";

/**
 * List all beveling rates, optionally filtered to active-only.
 */
export const listBevelingRates = tenantQuery({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args, tenant) => {
    if (args.activeOnly) {
      // Collect all active rates for this tenant across all beveling types
      return await ctx.db
        .query("bevelingRates")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
        .filter((q) => q.eq(q.field("active"), true))
        .collect();
    }
    return await ctx.db
      .query("bevelingRates")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();
  },
});

/**
 * Get all active beveling rates for a specific beveling type.
 */
export const getRatesByType = tenantQuery({
  args: { bevelingType: bevelingType },
  handler: async (ctx, args, tenant) => {
    return await ctx.db
      .query("bevelingRates")
      .withIndex("by_tenantId_bevelingType_active", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("bevelingType", args.bevelingType).eq("active", true)
      )
      .collect();
  },
});

/**
 * Get the rate per metre for a specific beveling type and glass thickness.
 * Used by operation calculation to price beveling work.
 */
export const getRateForThickness = tenantQuery({
  args: { bevelingType: bevelingType, thickness: v.number() },
  handler: async (ctx, args, tenant) => {
    const rates = await ctx.db
      .query("bevelingRates")
      .withIndex("by_tenantId_bevelingType_active", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("bevelingType", args.bevelingType).eq("active", true)
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
