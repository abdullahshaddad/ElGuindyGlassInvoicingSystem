import { v } from "convex/values";
import { tenantMutation, verifyTenantOwnership } from "../helpers/multitenancy";
import { checkPermission } from "../helpers/permissions";
import { logAuditEvent, computeDiff } from "../helpers/auditLog";

export const createGlassType = tenantMutation({
  args: {
    name: v.string(),
    thickness: v.number(),
    color: v.optional(v.string()),
    pricePerMeter: v.number(),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "products", "create");

    if (args.pricePerMeter < 0) {
      throw new Error("السعر لا يمكن أن يكون سالباً");
    }
    if (args.thickness <= 0) {
      throw new Error("السماكة يجب أن تكون أكبر من صفر");
    }

    const id = await ctx.db.insert("glassTypes", {
      tenantId: tenant.tenantId,
      name: args.name,
      thickness: args.thickness,
      color: args.color,
      pricePerMeter: args.pricePerMeter,
      pricingMethod: "AREA",
      active: true,
    });

    await logAuditEvent(ctx, tenant, {
      action: "product.created",
      entityType: "glassType",
      entityId: id,
    });

    return id;
  },
});

export const updateGlassType = tenantMutation({
  args: {
    glassTypeId: v.id("glassTypes"),
    name: v.optional(v.string()),
    thickness: v.optional(v.number()),
    color: v.optional(v.string()),
    pricePerMeter: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "products", "update");

    const existing = await ctx.db.get(args.glassTypeId);
    verifyTenantOwnership(existing, tenant.tenantId);

    const { glassTypeId, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(glassTypeId, patch);

    const changes = computeDiff(existing, { ...existing, ...patch });
    await logAuditEvent(ctx, tenant, {
      action: "product.updated",
      entityType: "glassType",
      entityId: args.glassTypeId,
      changes,
    });
  },
});

export const deleteGlassType = tenantMutation({
  args: { glassTypeId: v.id("glassTypes") },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "products", "delete");

    const existing = await ctx.db.get(args.glassTypeId);
    verifyTenantOwnership(existing, tenant.tenantId);

    // Check if used by any invoice lines within this tenant
    const usedLine = await ctx.db
      .query("invoiceLines")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .filter((q) => q.eq(q.field("glassTypeId"), args.glassTypeId))
      .first();

    if (usedLine) {
      throw new Error("لا يمكن حذف نوع زجاج مستخدم في فواتير. يمكنك تعطيله بدلاً من ذلك.");
    }

    await ctx.db.delete(args.glassTypeId);

    await logAuditEvent(ctx, tenant, {
      action: "product.deleted",
      entityType: "glassType",
      entityId: args.glassTypeId,
      severity: "critical",
    });
  },
});
