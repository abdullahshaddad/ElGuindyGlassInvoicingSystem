import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../helpers/auth";

export const upsertCompanyProfile = mutation({
  args: {
    companyName: v.string(),
    companyNameArabic: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    taxId: v.optional(v.string()),
    commercialRegister: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    logoBase64: v.optional(v.string()),
    logoContentType: v.optional(v.string()),
    footerText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER"]);

    const existing = await ctx.db.query("companyProfile").first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("companyProfile", {
      ...args,
    });
  },
});

export const uploadLogo = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER"]);

    const existing = await ctx.db.query("companyProfile").first();
    if (!existing) throw new Error("يجب إنشاء ملف الشركة أولاً");

    await ctx.db.patch(existing._id, {
      logoStorageId: args.storageId,
    });
  },
});
