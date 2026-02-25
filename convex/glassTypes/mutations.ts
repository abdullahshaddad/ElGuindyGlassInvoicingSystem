import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../helpers/auth";

export const createGlassType = mutation({
  args: {
    name: v.string(),
    thickness: v.number(),
    color: v.optional(v.string()),
    pricePerMeter: v.number(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    if (args.pricePerMeter < 0) {
      throw new Error("السعر لا يمكن أن يكون سالباً");
    }
    if (args.thickness <= 0) {
      throw new Error("السماكة يجب أن تكون أكبر من صفر");
    }

    return await ctx.db.insert("glassTypes", {
      name: args.name,
      thickness: args.thickness,
      color: args.color,
      pricePerMeter: args.pricePerMeter,
      pricingMethod: "AREA",
      active: true,
    });
  },
});

export const updateGlassType = mutation({
  args: {
    glassTypeId: v.id("glassTypes"),
    name: v.optional(v.string()),
    thickness: v.optional(v.number()),
    color: v.optional(v.string()),
    pricePerMeter: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    const existing = await ctx.db.get(args.glassTypeId);
    if (!existing) throw new Error("نوع الزجاج غير موجود");

    const { glassTypeId, ...updates } = args;
    // Filter out undefined values
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(glassTypeId, patch);
  },
});

export const deleteGlassType = mutation({
  args: { glassTypeId: v.id("glassTypes") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER"]);

    // Check if used by any invoice lines
    const usedLine = await ctx.db
      .query("invoiceLines")
      .filter((q) => q.eq(q.field("glassTypeId"), args.glassTypeId))
      .first();

    if (usedLine) {
      throw new Error("لا يمكن حذف نوع زجاج مستخدم في فواتير. يمكنك تعطيله بدلاً من ذلك.");
    }

    await ctx.db.delete(args.glassTypeId);
  },
});
