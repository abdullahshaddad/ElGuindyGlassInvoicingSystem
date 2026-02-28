import { v } from "convex/values";
import { tenantMutation, verifyTenantOwnership } from "../helpers/multitenancy";
import { checkPermission } from "../helpers/permissions";
import { logAuditEvent, computeDiff } from "../helpers/auditLog";
import { operationCategory } from "../schema";

export const createOperationPrice = tenantMutation({
  args: {
    category: operationCategory,
    subtype: v.string(),
    arabicName: v.string(),
    englishName: v.optional(v.string()),
    basePrice: v.number(),
    unit: v.optional(v.string()),
    description: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "settings", "update");

    if (args.basePrice < 0) {
      throw new Error("السعر يجب أن يكون صفر أو أكبر");
    }

    const id = await ctx.db.insert("operationPrices", {
      tenantId: tenant.tenantId,
      ...args,
      active: true,
    });

    await logAuditEvent(ctx, tenant, {
      action: "settings.updated",
      entityType: "operationPrice",
      entityId: id,
    });

    return id;
  },
});

export const updateOperationPrice = tenantMutation({
  args: {
    priceId: v.id("operationPrices"),
    category: v.optional(operationCategory),
    subtype: v.optional(v.string()),
    arabicName: v.optional(v.string()),
    englishName: v.optional(v.string()),
    basePrice: v.optional(v.number()),
    unit: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "settings", "update");

    const existing = await ctx.db.get(args.priceId);
    verifyTenantOwnership(existing, tenant.tenantId);

    const { priceId, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(priceId, patch);

    const changes = computeDiff(existing, { ...existing, ...patch });
    await logAuditEvent(ctx, tenant, {
      action: "settings.updated",
      entityType: "operationPrice",
      entityId: args.priceId,
      changes,
    });
  },
});

export const deleteOperationPrice = tenantMutation({
  args: { priceId: v.id("operationPrices") },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "settings", "update");

    const price = await ctx.db.get(args.priceId);
    verifyTenantOwnership(price, tenant.tenantId);
    await ctx.db.delete(args.priceId);

    await logAuditEvent(ctx, tenant, {
      action: "settings.updated",
      entityType: "operationPrice",
      entityId: args.priceId,
    });
  },
});
