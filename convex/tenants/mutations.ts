import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { tenantMutation } from "../helpers/multitenancy";
import { logAuditEvent, logSuperAdminEvent } from "../helpers/auditLog";
import { checkPermission, hasPermission } from "../helpers/permissions";
import {
  TENANT_ROLE_PERMISSIONS,
  deriveRoleFromPermissions,
  type TenantRole,
  type Permission,
} from "../helpers/enums";
import { tenantRole } from "../schema";

// Slug validation regex: lowercase alphanumeric + hyphens, min 3 chars
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

/**
 * createTenant — plain mutation, SUPERADMIN only.
 * Creates a new tenant and membership for the caller.
 */
export const createTenant = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح: يرجى تسجيل الدخول");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", identity.subject)
      )
      .unique();

    if (!user || !user.isActive) {
      throw new Error("غير مصرح: المستخدم غير موجود أو معطل");
    }

    // Only SUPERADMIN can create tenants
    if (user.role !== "SUPERADMIN") {
      throw new Error("غير مصرح: فقط مدير النظام يمكنه إنشاء مستأجر جديد");
    }

    // Validate slug
    const slug = args.slug.toLowerCase().trim();
    if (slug.length < 3) {
      throw new Error("الرابط يجب أن يكون 3 أحرف على الأقل");
    }
    if (!SLUG_REGEX.test(slug)) {
      throw new Error(
        "الرابط يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط"
      );
    }

    // Check uniqueness
    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existing) {
      throw new Error("هذا الرابط مستخدم بالفعل");
    }

    // Create tenant
    const tenantId = await ctx.db.insert("tenants", {
      name: args.name.trim(),
      slug,
      plan: "free",
      isActive: true,
      isSuspended: false,
      createdAt: Date.now(),
    });

    // SUPERADMIN is not linked to tenants — log the creation instead
    await logSuperAdminEvent(ctx, user._id, user.username, {
      action: "tenant.created",
      entityType: "tenant",
      entityId: tenantId,
      targetTenantId: tenantId,
    });

    return tenantId;
  },
});

/**
 * updateTenant — tenant-scoped, SUPERADMIN or tenant owner only.
 */
export const updateTenant = tenantMutation({
  args: {
    name: v.optional(v.string()),
    settings: v.optional(
      v.object({
        locale: v.optional(v.string()),
        currency: v.optional(v.string()),
        timezone: v.optional(v.string()),
        measurementUnit: v.optional(v.string()),
        invoicePrefix: v.optional(v.string()),
      })
    ),
    brandColors: v.optional(
      v.object({
        primary: v.optional(v.string()),
        secondary: v.optional(v.string()),
      })
    ),
    theme: v.optional(v.string()),
  },
  handler: async (ctx, args, tenant) => {
    const isSuperAdmin = tenant.user.role === "SUPERADMIN";
    if (!isSuperAdmin && !hasPermission(tenant, "settings", "update")) {
      throw new Error("غير مصرح: فقط مدير النظام أو مالك/مدير المستأجر يمكنه تعديل الإعدادات");
    }

    const updates: Record<string, any> = { updatedAt: Date.now() };

    if (args.name !== undefined) {
      updates.name = args.name.trim();
    }

    if (args.settings !== undefined) {
      // Merge with existing settings
      const tenantDoc = await ctx.db.get(tenant.tenantId);
      const existingSettings = tenantDoc?.settings || {};
      updates.settings = { ...existingSettings, ...args.settings };
    }

    if (args.brandColors !== undefined) {
      updates.brandColors = args.brandColors;
    }

    if (args.theme !== undefined) {
      updates.theme = args.theme;
    }

    await ctx.db.patch(tenant.tenantId, updates);
  },
});

/**
 * switchTenant — plain mutation.
 * Switches the user's defaultTenantId to a different tenant.
 */
export const switchTenant = mutation({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح: يرجى تسجيل الدخول");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", identity.subject)
      )
      .unique();

    if (!user || !user.isActive) {
      throw new Error("غير مصرح: المستخدم غير موجود أو معطل");
    }

    // Verify active membership
    const membership = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", user._id)
      )
      .unique();

    if (!membership || !membership.isActive) {
      throw new Error("غير مصرح: ليس لديك عضوية نشطة في هذا المستأجر");
    }

    // Verify tenant is active and not suspended
    const tenantDoc = await ctx.db.get(args.tenantId);
    if (!tenantDoc || !tenantDoc.isActive || tenantDoc.isSuspended) {
      throw new Error("المستأجر غير نشط أو معلق");
    }

    await ctx.db.patch(user._id, { defaultTenantId: args.tenantId });
  },
});

/**
 * addMember — tenant-scoped.
 * Adds a user to the current tenant with explicit permissions.
 */
export const addMember = tenantMutation({
  args: {
    userId: v.id("users"),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args, tenant) => {
    const isSuperAdmin = tenant.user.role === "SUPERADMIN";

    // Check caller has users:manage permission
    if (!isSuperAdmin) {
      checkPermission(tenant, "users", "manage");
    }

    // Caller cannot grant permissions they don't have (unless SUPERADMIN)
    if (!isSuperAdmin) {
      for (const perm of args.permissions) {
        if (!tenant.permissions.includes(perm as Permission)) {
          throw new Error(`غير مصرح: لا يمكنك منح صلاحية ${perm}`);
        }
      }
    }

    // Verify target user exists
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser || !targetUser.isActive) {
      throw new Error("المستخدم غير موجود أو معطل");
    }

    // Derive a backward-compatible role from the permissions
    const derivedRole = deriveRoleFromPermissions(args.permissions as Permission[]);

    // Check existing membership
    const existing = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId_userId", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("userId", args.userId)
      )
      .unique();

    if (existing) {
      if (existing.isActive) {
        throw new Error("المستخدم عضو بالفعل في هذا المستأجر");
      }
      // Reactivate inactive membership
      await ctx.db.patch(existing._id, {
        isActive: true,
        role: derivedRole,
        permissions: args.permissions,
        joinedAt: Date.now(),
        invitedBy: tenant.userId,
      });
    } else {
      await ctx.db.insert("tenantMemberships", {
        userId: args.userId,
        tenantId: tenant.tenantId,
        role: derivedRole,
        permissions: args.permissions,
        isActive: true,
        joinedAt: Date.now(),
        invitedBy: tenant.userId,
      });
    }

    // Set defaultTenantId on target user if they don't have one
    if (!targetUser.defaultTenantId) {
      await ctx.db.patch(args.userId, {
        defaultTenantId: tenant.tenantId,
      });
    }
  },
});

/**
 * updateMemberPermissions — tenant-scoped.
 * Updates the permissions of a member.
 */
export const updateMemberPermissions = tenantMutation({
  args: {
    membershipId: v.id("tenantMemberships"),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args, tenant) => {
    const isSuperAdmin = tenant.user.role === "SUPERADMIN";

    const membership = await ctx.db.get(args.membershipId);
    if (!membership || membership.tenantId !== tenant.tenantId) {
      throw new Error("العضوية غير موجودة");
    }

    // Cannot edit own permissions
    if (membership.userId === tenant.userId) {
      throw new Error("لا يمكنك تعديل صلاحياتك الخاصة");
    }

    // Cannot edit owner's permissions
    if (membership.role === "owner") {
      throw new Error("لا يمكنك تعديل صلاحيات المالك");
    }

    // Check caller has users:manage permission
    if (!isSuperAdmin) {
      checkPermission(tenant, "users", "manage");

      // Caller cannot grant permissions they don't have
      for (const perm of args.permissions) {
        if (!tenant.permissions.includes(perm as Permission)) {
          throw new Error(`غير مصرح: لا يمكنك منح صلاحية ${perm}`);
        }
      }
    }

    const derivedRole = deriveRoleFromPermissions(args.permissions as Permission[]);

    await ctx.db.patch(args.membershipId, {
      role: derivedRole,
      permissions: args.permissions,
    });
  },
});

/**
 * updateMemberRole — tenant-scoped, backward-compatible.
 * Changes the tenant role of a member (converts to permissions internally).
 */
export const updateMemberRole = tenantMutation({
  args: {
    membershipId: v.id("tenantMemberships"),
    newRole: tenantRole,
  },
  handler: async (ctx, args, tenant) => {
    const isSuperAdmin = tenant.user.role === "SUPERADMIN";

    const membership = await ctx.db.get(args.membershipId);
    if (!membership || membership.tenantId !== tenant.tenantId) {
      throw new Error("العضوية غير موجودة");
    }

    // Cannot change own role (even SUPERADMIN)
    if (membership.userId === tenant.userId) {
      throw new Error("لا يمكنك تغيير دورك الخاص");
    }

    if (!isSuperAdmin) {
      checkPermission(tenant, "users", "manage");
    }

    // Derive permissions from the new role
    const newPermissions = TENANT_ROLE_PERMISSIONS[args.newRole as TenantRole] ?? [];

    await ctx.db.patch(args.membershipId, {
      role: args.newRole,
      permissions: newPermissions,
    });
  },
});

/**
 * removeMember — tenant-scoped.
 * Soft-deactivates a membership (preserves audit trail).
 */
export const removeMember = tenantMutation({
  args: {
    membershipId: v.id("tenantMemberships"),
  },
  handler: async (ctx, args, tenant) => {
    const isSuperAdmin = tenant.user.role === "SUPERADMIN";

    const membership = await ctx.db.get(args.membershipId);
    if (!membership || membership.tenantId !== tenant.tenantId) {
      throw new Error("العضوية غير موجودة");
    }

    // Cannot remove self
    if (membership.userId === tenant.userId) {
      throw new Error("لا يمكنك إزالة نفسك من المستأجر");
    }

    // Cannot remove owners
    if (membership.role === "owner") {
      throw new Error("لا يمكنك إزالة مالك المستأجر");
    }

    // Check caller has users:manage permission
    if (!isSuperAdmin) {
      checkPermission(tenant, "users", "manage");
    }

    // Soft deactivate
    await ctx.db.patch(args.membershipId, { isActive: false });

    // If removed user's defaultTenantId was this tenant, reassign
    const removedUser = await ctx.db.get(membership.userId);
    if (removedUser && removedUser.defaultTenantId === tenant.tenantId) {
      // Find another active membership for the user
      const otherMemberships = await ctx.db
        .query("tenantMemberships")
        .withIndex("by_userId", (q) => q.eq("userId", membership.userId))
        .collect();

      const activeMembership = otherMemberships.find(
        (m) => m.isActive && m._id !== args.membershipId
      );

      await ctx.db.patch(membership.userId, {
        defaultTenantId: activeMembership?.tenantId,
      });
    }
  },
});

// ============================================================
// Invitation Flow
// ============================================================

/**
 * Generate a random invitation token.
 */
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * createInvitation — tenant-scoped.
 * Creates an invitation token with explicit permissions.
 */
export const createInvitation = tenantMutation({
  args: {
    email: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args, tenant) => {
    const isSuperAdmin = tenant.user.role === "SUPERADMIN";

    // Check caller has users:invite permission
    if (!isSuperAdmin) {
      checkPermission(tenant, "users", "invite");

      // Caller cannot grant permissions they don't have
      for (const perm of args.permissions) {
        if (!tenant.permissions.includes(perm as Permission)) {
          throw new Error(`غير مصرح: لا يمكنك منح صلاحية ${perm}`);
        }
      }
    }

    // Check if there's already a pending invitation for this email in this tenant
    const existingInvitations = await ctx.db
      .query("tenantInvitations")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    const pendingForEmail = existingInvitations.find(
      (inv) => inv.email === args.email.toLowerCase().trim() && inv.status === "pending"
    );

    if (pendingForEmail) {
      throw new Error("يوجد دعوة معلقة بالفعل لهذا البريد الإلكتروني");
    }

    // Check if user is already a member
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.email.toLowerCase().trim()))
      .first();

    if (existingUser) {
      const existingMembership = await ctx.db
        .query("tenantMemberships")
        .withIndex("by_tenantId_userId", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("userId", existingUser._id)
        )
        .unique();

      if (existingMembership?.isActive) {
        throw new Error("هذا المستخدم عضو بالفعل في هذا المستأجر");
      }
    }

    const token = generateToken();
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Derive a backward-compatible role from the permissions
    const derivedRole = deriveRoleFromPermissions(args.permissions as Permission[]);

    const invitationId = await ctx.db.insert("tenantInvitations", {
      email: args.email.toLowerCase().trim(),
      tenantId: tenant.tenantId,
      role: derivedRole,
      permissions: args.permissions,
      token,
      expiresAt,
      status: "pending",
      invitedBy: tenant.userId,
      createdAt: now,
    });

    await logAuditEvent(ctx, tenant, {
      action: "user.invited",
      entityType: "tenantInvitation",
      entityId: invitationId,
    });

    return { invitationId, token };
  },
});

/**
 * acceptInvitation — plain mutation (no tenant scope since user may not have one yet).
 * Accepts an invitation token and creates/reactivates membership.
 */
export const acceptInvitation = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح: يرجى تسجيل الدخول");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", identity.subject)
      )
      .unique();

    if (!user || !user.isActive) {
      throw new Error("غير مصرح: المستخدم غير موجود أو معطل");
    }

    // Find the invitation
    const invitation = await ctx.db
      .query("tenantInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation) {
      throw new Error("الدعوة غير موجودة");
    }

    if (invitation.status !== "pending") {
      throw new Error("هذه الدعوة تم استخدامها بالفعل أو منتهية الصلاحية");
    }

    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new Error("هذه الدعوة منتهية الصلاحية");
    }

    // Verify tenant is active
    const tenantDoc = await ctx.db.get(invitation.tenantId);
    if (!tenantDoc || !tenantDoc.isActive || tenantDoc.isSuspended) {
      throw new Error("المستأجر غير نشط أو معلق");
    }

    // Resolve permissions: use invitation's explicit permissions, or fall back to role-based
    const permissions = (invitation.permissions as string[] | undefined)
      ?? TENANT_ROLE_PERMISSIONS[invitation.role as TenantRole]
      ?? [];

    // Check for existing membership
    const existingMembership = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId_userId", (q) =>
        q.eq("tenantId", invitation.tenantId).eq("userId", user._id)
      )
      .unique();

    if (existingMembership) {
      if (existingMembership.isActive) {
        // Already a member — just mark invitation as accepted
        await ctx.db.patch(invitation._id, { status: "accepted" });
        return { tenantId: invitation.tenantId, alreadyMember: true };
      }
      // Reactivate inactive membership
      await ctx.db.patch(existingMembership._id, {
        isActive: true,
        role: invitation.role,
        permissions,
        joinedAt: Date.now(),
        invitedBy: invitation.invitedBy,
      });
    } else {
      await ctx.db.insert("tenantMemberships", {
        userId: user._id,
        tenantId: invitation.tenantId,
        role: invitation.role,
        permissions,
        isActive: true,
        joinedAt: Date.now(),
        invitedBy: invitation.invitedBy,
      });
    }

    // Mark invitation as accepted
    await ctx.db.patch(invitation._id, { status: "accepted" });

    // Set defaultTenantId if user doesn't have one
    if (!user.defaultTenantId) {
      await ctx.db.patch(user._id, { defaultTenantId: invitation.tenantId });
    }

    return { tenantId: invitation.tenantId, alreadyMember: false };
  },
});

/**
 * cancelInvitation — tenant-scoped.
 * Owner/admin can cancel a pending invitation.
 */
export const cancelInvitation = tenantMutation({
  args: {
    invitationId: v.id("tenantInvitations"),
  },
  handler: async (ctx, args, tenant) => {
    const isSuperAdmin = tenant.user.role === "SUPERADMIN";

    if (!isSuperAdmin) {
      checkPermission(tenant, "users", "invite");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation || invitation.tenantId !== tenant.tenantId) {
      throw new Error("الدعوة غير موجودة");
    }

    if (invitation.status !== "pending") {
      throw new Error("لا يمكن إلغاء دعوة غير معلقة");
    }

    await ctx.db.patch(args.invitationId, { status: "expired" });
  },
});
