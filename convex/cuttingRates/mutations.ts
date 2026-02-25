import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../helpers/auth";

export const createLaserRate = mutation({
  args: {
    minThickness: v.number(),
    maxThickness: v.number(),
    ratePerMeter: v.number(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    if (args.minThickness >= args.maxThickness) {
      throw new Error("الحد الأدنى للسماكة يجب أن يكون أقل من الحد الأقصى");
    }
    if (args.ratePerMeter < 0) {
      throw new Error("السعر لا يمكن أن يكون سالباً");
    }

    // Check for overlapping thickness ranges
    const existing = await ctx.db
      .query("laserRates")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    const overlap = existing.find(
      (r) => !(args.maxThickness < r.minThickness || args.minThickness > r.maxThickness)
    );
    if (overlap) {
      throw new Error("يوجد تداخل في نطاق السماكة مع سعر موجود");
    }

    return await ctx.db.insert("laserRates", {
      minThickness: args.minThickness,
      maxThickness: args.maxThickness,
      ratePerMeter: args.ratePerMeter,
      active: true,
    });
  },
});

export const updateLaserRate = mutation({
  args: {
    rateId: v.id("laserRates"),
    minThickness: v.optional(v.number()),
    maxThickness: v.optional(v.number()),
    ratePerMeter: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    const existing = await ctx.db.get(args.rateId);
    if (!existing) throw new Error("السعر غير موجود");

    const { rateId, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(rateId, patch);
  },
});

export const deleteLaserRate = mutation({
  args: { rateId: v.id("laserRates") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);
    const rate = await ctx.db.get(args.rateId);
    if (!rate) throw new Error("السعر غير موجود");
    await ctx.db.delete(args.rateId);
  },
});
