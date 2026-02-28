import { v } from "convex/values";
import { tenantQuery, verifyTenantOwnership } from "../helpers/multitenancy";

export const listGlassTypes = tenantQuery({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args, tenant) => {
    if (args.activeOnly) {
      return await ctx.db
        .query("glassTypes")
        .withIndex("by_tenantId_active", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("active", true)
        )
        .collect();
    }
    return await ctx.db
      .query("glassTypes")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();
  },
});

export const getGlassType = tenantQuery({
  args: { glassTypeId: v.id("glassTypes") },
  handler: async (ctx, args, tenant) => {
    const glassType = await ctx.db.get(args.glassTypeId);
    verifyTenantOwnership(glassType, tenant.tenantId);
    return glassType;
  },
});
