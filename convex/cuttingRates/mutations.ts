import { v } from "convex/values";
import { tenantMutation, verifyTenantOwnership } from "../helpers/multitenancy";
import { checkPermission } from "../helpers/permissions";
import { logAuditEvent, computeDiff } from "../helpers/auditLog";

export const createLaserRate = tenantMutation({
  args: {
    minThickness: v.number(),
    maxThickness: v.number(),
    ratePerMeter: v.number(),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "settings", "update");
    if (args.minThickness >= args.maxThickness) {
      throw new Error("الحد الأدنى للسماكة يجب أن يكون أقل من الحد الأقصى");
    }
    if (args.ratePerMeter < 0) {
      throw new Error("السعر لا يمكن أن يكون سالباً");
    }

    // Check for overlapping thickness ranges within this tenant
    const existing = await ctx.db
      .query("laserRates")
      .withIndex("by_tenantId_active", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("active", true)
      )
      .collect();

    const overlap = existing.find(
      (r) => !(args.maxThickness < r.minThickness || args.minThickness > r.maxThickness)
    );
    if (overlap) {
      throw new Error("يوجد تداخل في نطاق السماكة مع سعر موجود");
    }

    const id = await ctx.db.insert("laserRates", {
      tenantId: tenant.tenantId,
      minThickness: args.minThickness,
      maxThickness: args.maxThickness,
      ratePerMeter: args.ratePerMeter,
      active: true,
    });

    await logAuditEvent(ctx, tenant, {
      action: "settings.updated",
      entityType: "laserRate",
      entityId: id,
    });

    return id;
  },
});

export const updateLaserRate = tenantMutation({
  args: {
    rateId: v.id("laserRates"),
    minThickness: v.optional(v.number()),
    maxThickness: v.optional(v.number()),
    ratePerMeter: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "settings", "update");

    const existing = await ctx.db.get(args.rateId);
    verifyTenantOwnership(existing, tenant.tenantId);

    const { rateId, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(rateId, patch);

    const changes = computeDiff(existing, { ...existing, ...patch });
    await logAuditEvent(ctx, tenant, {
      action: "settings.updated",
      entityType: "laserRate",
      entityId: args.rateId,
      changes,
    });
  },
});

export const deleteLaserRate = tenantMutation({
  args: { rateId: v.id("laserRates") },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "settings", "update");

    const rate = await ctx.db.get(args.rateId);
    verifyTenantOwnership(rate, tenant.tenantId);
    await ctx.db.delete(args.rateId);

    await logAuditEvent(ctx, tenant, {
      action: "settings.updated",
      entityType: "laserRate",
      entityId: args.rateId,
    });
  },
});
