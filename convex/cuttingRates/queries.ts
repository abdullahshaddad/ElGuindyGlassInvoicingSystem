import { v } from "convex/values";
import { tenantQuery, verifyTenantOwnership } from "../helpers/multitenancy";

export const listLaserRates = tenantQuery({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args, tenant) => {
    if (args.activeOnly) {
      return await ctx.db
        .query("laserRates")
        .withIndex("by_tenantId_active", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("active", true)
        )
        .collect();
    }
    return await ctx.db
      .query("laserRates")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();
  },
});

export const getLaserRateForThickness = tenantQuery({
  args: { thickness: v.number() },
  handler: async (ctx, args, tenant) => {
    const rates = await ctx.db
      .query("laserRates")
      .withIndex("by_tenantId_active", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("active", true)
      )
      .collect();

    const match = rates.find(
      (r) => args.thickness >= r.minThickness && args.thickness <= r.maxThickness
    );

    return match ?? null;
  },
});
