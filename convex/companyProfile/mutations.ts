import { v } from "convex/values";
import { tenantMutation } from "../helpers/multitenancy";
import { checkPermission } from "../helpers/permissions";
import { logAuditEvent } from "../helpers/auditLog";

export const upsertCompanyProfile = tenantMutation({
  args: {
    companyName: v.string(),
    companyNameArabic: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    taxId: v.optional(v.string()),
    commercialRegister: v.optional(v.string()),
    footerText: v.optional(v.string()),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "settings", "update");

    const existing = await ctx.db
      .query("companyProfile")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .first();

    let profileId;
    if (existing) {
      await ctx.db.patch(existing._id, args);
      profileId = existing._id;
    } else {
      profileId = await ctx.db.insert("companyProfile", {
        tenantId: tenant.tenantId,
        ...args,
      });
    }

    await logAuditEvent(ctx, tenant, {
      action: "settings.updated",
      entityType: "companyProfile",
      entityId: profileId,
    });

    return profileId;
  },
});

/**
 * Generate a short-lived upload URL for Convex file storage.
 */
export const generateUploadUrl = tenantMutation({
  args: {},
  handler: async (ctx, _args, _tenant) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save the uploaded logo's storageId on the company profile.
 * Deletes the previous logo from storage if one existed.
 */
export const uploadLogo = tenantMutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "settings", "update");

    const existing = await ctx.db
      .query("companyProfile")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .first();
    if (!existing) throw new Error("يجب إنشاء ملف الشركة أولاً");

    // Delete old logo from storage
    if (existing.logoStorageId) {
      await ctx.storage.delete(existing.logoStorageId);
    }

    await ctx.db.patch(existing._id, {
      logoStorageId: args.storageId,
      // Clear any old base64 data
      logoUrl: undefined,
      logoBase64: undefined,
      logoContentType: undefined,
    });

    await logAuditEvent(ctx, tenant, {
      action: "settings.branding_changed",
      entityType: "companyProfile",
      entityId: existing._id,
    });
  },
});
