import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../helpers/auth";
import { operationCategory } from "../schema";

export const createOperationPrice = mutation({
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
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    if (args.basePrice < 0) {
      throw new Error("السعر يجب أن يكون صفر أو أكبر");
    }

    return await ctx.db.insert("operationPrices", {
      ...args,
      active: true,
    });
  },
});

export const updateOperationPrice = mutation({
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
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    const existing = await ctx.db.get(args.priceId);
    if (!existing) throw new Error("السعر غير موجود");

    const { priceId, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(priceId, patch);
  },
});

export const deleteOperationPrice = mutation({
  args: { priceId: v.id("operationPrices") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER"]);
    const price = await ctx.db.get(args.priceId);
    if (!price) throw new Error("السعر غير موجود");
    await ctx.db.delete(args.priceId);
  },
});
