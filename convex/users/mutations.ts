import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { tenantMutation } from "../helpers/multitenancy";
import { checkPermission } from "../helpers/permissions";
import { logAuditEvent, computeDiff } from "../helpers/auditLog";
import { userRole } from "../schema";
import { canManageRole, USER_ROLE_TO_TENANT_ROLE, TENANT_ROLE_PERMISSIONS } from "../helpers/enums";
import type { UserRole, TenantRole } from "../helpers/enums";

export const createUser = tenantMutation({
  args: {
    clerkUserId: v.string(),
    username: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: userRole,
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "users", "manage");

    // Check if current user can create this role
    if (!canManageRole(tenant.user.role as UserRole, args.role as UserRole)) {
      throw new Error("لا يمكنك إنشاء مستخدم بهذا الدور");
    }

    // Check username uniqueness
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (existing) {
      throw new Error("اسم المستخدم مسجل بالفعل");
    }

    // Check clerkUserId uniqueness
    const existingClerk = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();
    if (existingClerk) {
      throw new Error("حساب Clerk مرتبط بالفعل بمستخدم آخر");
    }

    const userId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      username: args.username,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      isActive: true,
      defaultTenantId: tenant.tenantId,
    });

    // Create tenant membership for the new user
    const mappedTenantRole = USER_ROLE_TO_TENANT_ROLE[args.role as UserRole] ?? "operator";
    const permissions = TENANT_ROLE_PERMISSIONS[mappedTenantRole as TenantRole] ?? [];
    await ctx.db.insert("tenantMemberships", {
      userId,
      tenantId: tenant.tenantId,
      role: mappedTenantRole,
      permissions,
      isActive: true,
      joinedAt: Date.now(),
      invitedBy: tenant.userId,
    });

    await logAuditEvent(ctx, tenant, {
      action: "user.created",
      entityType: "user",
      entityId: userId,
    });

    return userId;
  },
});

export const updateUser = tenantMutation({
  args: {
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.optional(userRole),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "users", "manage");

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("المستخدم غير موجود");

    // Verify target user is in this tenant
    const membership = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId_userId", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("userId", args.userId)
      )
      .unique();
    if (!membership) throw new Error("المستخدم غير موجود");

    // Check hierarchy
    if (!canManageRole(tenant.user.role as UserRole, targetUser.role as UserRole)) {
      throw new Error("لا يمكنك تعديل هذا المستخدم");
    }

    const { userId, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(userId, patch);

    // Also update tenant membership role and permissions if role changed
    if (args.role) {
      const mappedTenantRole = USER_ROLE_TO_TENANT_ROLE[args.role as UserRole] ?? "operator";
      const rolePermissions = TENANT_ROLE_PERMISSIONS[mappedTenantRole as TenantRole] ?? [];
      await ctx.db.patch(membership._id, { role: mappedTenantRole, permissions: rolePermissions });
    }

    // Also update membership isActive if isActive changed
    if (args.isActive !== undefined) {
      await ctx.db.patch(membership._id, { isActive: args.isActive });
    }

    const action = args.role ? "user.role_changed" : args.isActive === false ? "user.deactivated" : "user.updated";
    const changes = computeDiff(targetUser, { ...targetUser, ...patch });
    await logAuditEvent(ctx, tenant, {
      action,
      entityType: "user",
      entityId: args.userId,
      changes,
      severity: args.role ? "critical" : undefined,
    });
  },
});

/**
 * Internal mutation called by the createUserWithClerk action.
 * Inserts a user record without auth checks (the action handles auth).
 * Now also sets defaultTenantId and creates a tenant membership.
 */
export const insertUser = internalMutation({
  args: {
    clerkUserId: v.string(),
    username: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: userRole,
    defaultTenantId: v.optional(v.id("tenants")),
  },
  handler: async (ctx, args) => {
    // Check username uniqueness
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (existing) {
      throw new Error("اسم المستخدم مسجل بالفعل");
    }

    // Check clerkUserId uniqueness
    const existingClerk = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();
    if (existingClerk) {
      throw new Error("حساب Clerk مرتبط بالفعل بمستخدم آخر");
    }

    const userId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      username: args.username,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      isActive: true,
      defaultTenantId: args.defaultTenantId,
    });

    // If a tenant is specified, create membership
    if (args.defaultTenantId) {
      const mappedTenantRole = USER_ROLE_TO_TENANT_ROLE[args.role as UserRole] ?? "operator";
      const permissions = TENANT_ROLE_PERMISSIONS[mappedTenantRole as TenantRole] ?? [];
      await ctx.db.insert("tenantMemberships", {
        userId,
        tenantId: args.defaultTenantId,
        role: mappedTenantRole,
        permissions,
        isActive: true,
        joinedAt: Date.now(),
      });
    }

    return userId;
  },
});

export const upsertFromClerk = mutation({
  args: {
    clerkUserId: v.string(),
    username: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        firstName: args.firstName,
        lastName: args.lastName,
      });

      // If user has no defaultTenantId, try to assign one from their memberships
      if (!existing.defaultTenantId) {
        const membership = await ctx.db
          .query("tenantMemberships")
          .withIndex("by_userId", (q) => q.eq("userId", existing._id))
          .first();
        if (membership?.isActive) {
          await ctx.db.patch(existing._id, { defaultTenantId: membership.tenantId });
        }
      }

      return existing._id;
    }

    // New user — default to WORKER role
    // Try to find the first active tenant to assign as default
    const firstTenant = await ctx.db
      .query("tenants")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .first();

    const userId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      username: args.username,
      firstName: args.firstName,
      lastName: args.lastName,
      role: "WORKER",
      isActive: true,
      defaultTenantId: firstTenant?._id,
    });

    // Create a tenant membership so the user can access tenant-scoped data
    if (firstTenant) {
      await ctx.db.insert("tenantMemberships", {
        userId,
        tenantId: firstTenant._id,
        role: "operator",
        permissions: TENANT_ROLE_PERMISSIONS.operator,
        isActive: true,
        joinedAt: Date.now(),
      });
    }

    return userId;
  },
});
