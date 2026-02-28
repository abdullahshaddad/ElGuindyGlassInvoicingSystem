import { v } from "convex/values";
import { tenantMutation, verifyTenantOwnership } from "../helpers/multitenancy";
import { checkPermission } from "../helpers/permissions";
import { logAuditEvent, computeDiff } from "../helpers/auditLog";
import { bevelingType } from "../schema";
import { BEVELING_TYPE_CONFIG } from "../helpers/enums";

/**
 * Create a new beveling rate for a specific beveling type and thickness range.
 * Manual-input beveling types do not use the rate table.
 */
export const createBevelingRate = tenantMutation({
  args: {
    bevelingType: bevelingType,
    minThickness: v.number(),
    maxThickness: v.number(),
    ratePerMeter: v.number(),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "settings", "update");

    const config = BEVELING_TYPE_CONFIG[args.bevelingType];
    if (config.manualInput) {
      throw new Error(`النوع ${config.arabicName} لا يستخدم جدول الأسعار`);
    }
    if (args.minThickness < 0 || args.maxThickness < 0) {
      throw new Error("السماكة لا يمكن أن تكون سالبة");
    }
    if (args.minThickness >= args.maxThickness) {
      throw new Error("الحد الأدنى للسماكة يجب أن يكون أقل من الحد الأقصى");
    }
    if (args.ratePerMeter < 0) {
      throw new Error("السعر لا يمكن أن يكون سالباً");
    }

    // Check for overlapping rates within this tenant
    const existing = await ctx.db
      .query("bevelingRates")
      .withIndex("by_tenantId_bevelingType_active", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("bevelingType", args.bevelingType).eq("active", true)
      )
      .collect();

    const overlap = existing.find(
      (r) => !(args.maxThickness < r.minThickness || args.minThickness > r.maxThickness)
    );
    if (overlap) {
      throw new Error(`يوجد تداخل في نطاق السماكة مع سعر موجود للنوع ${config.arabicName}`);
    }

    const id = await ctx.db.insert("bevelingRates", {
      tenantId: tenant.tenantId,
      bevelingType: args.bevelingType,
      minThickness: args.minThickness,
      maxThickness: args.maxThickness,
      ratePerMeter: args.ratePerMeter,
      active: true,
      createdAt: Date.now(),
    });

    await logAuditEvent(ctx, tenant, {
      action: "settings.updated",
      entityType: "bevelingRate",
      entityId: id,
    });

    return id;
  },
});

/**
 * Update an existing beveling rate.
 */
export const updateBevelingRate = tenantMutation({
  args: {
    rateId: v.id("bevelingRates"),
    bevelingType: v.optional(bevelingType),
    minThickness: v.optional(v.number()),
    maxThickness: v.optional(v.number()),
    ratePerMeter: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "settings", "update");

    const existing = await ctx.db.get(args.rateId);
    verifyTenantOwnership(existing, tenant.tenantId);

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.bevelingType  !== undefined) patch.bevelingType  = args.bevelingType;
    if (args.minThickness  !== undefined) patch.minThickness  = args.minThickness;
    if (args.maxThickness  !== undefined) patch.maxThickness  = args.maxThickness;
    if (args.ratePerMeter  !== undefined) patch.ratePerMeter  = args.ratePerMeter;
    if (args.active        !== undefined) patch.active        = args.active;

    await ctx.db.patch(args.rateId, patch);

    const changes = computeDiff(existing, { ...existing, ...patch });
    await logAuditEvent(ctx, tenant, {
      action: "settings.updated",
      entityType: "bevelingRate",
      entityId: args.rateId,
      changes,
    });
  },
});

/**
 * Delete a beveling rate entry.
 */
export const deleteBevelingRate = tenantMutation({
  args: { rateId: v.id("bevelingRates") },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "settings", "update");

    const rate = await ctx.db.get(args.rateId);
    verifyTenantOwnership(rate, tenant.tenantId);
    await ctx.db.delete(args.rateId);

    await logAuditEvent(ctx, tenant, {
      action: "settings.updated",
      entityType: "bevelingRate",
      entityId: args.rateId,
    });
  },
});
