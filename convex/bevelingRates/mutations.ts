import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../helpers/auth";
import { bevelingType } from "../schema";
import { BEVELING_TYPE_CONFIG } from "../helpers/enums";

/**
 * Create a new beveling rate for a specific beveling type and thickness range.
 * Manual-input beveling types do not use the rate table.
 */
export const createBevelingRate = mutation({
  args: {
    bevelingType: bevelingType,
    minThickness: v.number(),
    maxThickness: v.number(),
    ratePerMeter: v.number(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

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

    // Check for overlapping rates
    const existing = await ctx.db
      .query("bevelingRates")
      .withIndex("by_bevelingType_active", (q) =>
        q.eq("bevelingType", args.bevelingType).eq("active", true)
      )
      .collect();

    const overlap = existing.find(
      (r) => !(args.maxThickness < r.minThickness || args.minThickness > r.maxThickness)
    );
    if (overlap) {
      throw new Error(`يوجد تداخل في نطاق السماكة مع سعر موجود للنوع ${config.arabicName}`);
    }

    return await ctx.db.insert("bevelingRates", {
      bevelingType: args.bevelingType,
      minThickness: args.minThickness,
      maxThickness: args.maxThickness,
      ratePerMeter: args.ratePerMeter,
      active: true,
      createdAt: Date.now(),
    });
  },
});

/**
 * Update an existing beveling rate.
 */
export const updateBevelingRate = mutation({
  args: {
    rateId: v.id("bevelingRates"),
    bevelingType: v.optional(bevelingType),
    minThickness: v.optional(v.number()),
    maxThickness: v.optional(v.number()),
    ratePerMeter: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    const existing = await ctx.db.get(args.rateId);
    if (!existing) throw new Error("السعر غير موجود");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.bevelingType  !== undefined) patch.bevelingType  = args.bevelingType;
    if (args.minThickness  !== undefined) patch.minThickness  = args.minThickness;
    if (args.maxThickness  !== undefined) patch.maxThickness  = args.maxThickness;
    if (args.ratePerMeter  !== undefined) patch.ratePerMeter  = args.ratePerMeter;
    if (args.active        !== undefined) patch.active        = args.active;

    await ctx.db.patch(args.rateId, patch);
  },
});

/**
 * Delete a beveling rate entry.
 */
export const deleteBevelingRate = mutation({
  args: { rateId: v.id("bevelingRates") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);
    const rate = await ctx.db.get(args.rateId);
    if (!rate) throw new Error("السعر غير موجود");
    await ctx.db.delete(args.rateId);
  },
});
