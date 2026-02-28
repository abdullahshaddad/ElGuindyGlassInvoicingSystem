import { query, QueryCtx } from "../_generated/server";
import { v } from "convex/values";
import { tenantQuery } from "../helpers/multitenancy";
import { checkPermission } from "../helpers/permissions";
import { TENANT_ROLE_PERMISSIONS, type TenantRole, type Permission } from "../helpers/enums";
import { Id } from "../_generated/dataModel";

/**
 * listMyTenants — bootstrap query (no tenant scope).
 * Returns all active tenants the current user belongs to.
 */
export const listMyTenants = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user || !user.isActive) return [];

    // SUPERADMIN has no tenant memberships — return empty
    if (user.role === "SUPERADMIN") return [];

    // Get all active memberships for this user
    const memberships = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const activeMemberships = memberships.filter((m) => m.isActive);

    // Fetch tenant records
    const results = await Promise.all(
      activeMemberships.map(async (m) => {
        const tenant = await ctx.db.get(m.tenantId);
        if (!tenant || !tenant.isActive) return null;
        return {
          ...tenant,
          memberRole: m.role,
          joinedAt: m.joinedAt,
        };
      })
    );

    return results.filter((t) => t !== null);
  },
});

/**
 * getCurrentTenant — resolves the caller's default tenant.
 *
 * Unlike other tenant-scoped queries this is a plain `query` so that it
 * returns `null` instead of throwing when the membership or tenant is
 * missing.  This prevents the ErrorBoundary from firing on the login
 * screen for users whose tenant data is not yet set up.
 */
export const getCurrentTenant = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user || !user.isActive) return null;

    const isSuperAdmin = user.role === "SUPERADMIN";
    let isSuperAdminViewing = false;

    // Resolve tenantId
    let tenantId: Id<"tenants"> | undefined;

    if (isSuperAdmin && user.viewingTenantId) {
      // SUPERADMIN is actively viewing a tenant
      tenantId = user.viewingTenantId;
      isSuperAdminViewing = true;
    } else if (isSuperAdmin) {
      // SUPERADMIN not viewing any tenant → on admin panel, return null
      return null;
    } else {
      tenantId = user.defaultTenantId;
    }

    if (!tenantId) return null;

    // Resolve tenant role and permissions from membership (SUPERADMIN defaults to "owner")
    let tenantRole: string = "owner";
    let currentUserPermissions: string[] = TENANT_ROLE_PERMISSIONS.owner;
    if (!isSuperAdmin) {
      const membership = await ctx.db
        .query("tenantMemberships")
        .withIndex("by_tenantId_userId", (q) =>
          q.eq("tenantId", tenantId!).eq("userId", user._id)
        )
        .unique();

      if (!membership || !membership.isActive) return null;
      tenantRole = membership.role;
      // Use explicit permissions if set, otherwise fall back to role-based defaults
      currentUserPermissions = (membership.permissions as string[] | undefined)
        ?? TENANT_ROLE_PERMISSIONS[membership.role as TenantRole]
        ?? [];
    }

    const tenantDoc = await ctx.db.get(tenantId);
    if (!tenantDoc || !tenantDoc.isActive) return null;
    // SUPERADMIN can access suspended tenants
    if (!isSuperAdmin && tenantDoc.isSuspended) return null;

    return {
      ...tenantDoc,
      currentUserRole: tenantRole,
      currentUserPermissions,
      isSuperAdminViewing,
    };
  },
});

/**
 * listTenantMembers — tenant-scoped, requires users:read permission.
 * Returns members with user details and permissions.
 */
export const listTenantMembers = tenantQuery({
  args: {},
  handler: async (ctx, _args, tenant) => {
    // Permission-based gate
    const isSuperAdmin = tenant.user.role === "SUPERADMIN";
    if (!isSuperAdmin) {
      checkPermission(tenant, "users", "read");
    }

    const memberships = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        if (!user) return null;
        // Resolve permissions: explicit or role-based fallback
        const permissions = (m.permissions as string[] | undefined)
          ?? TENANT_ROLE_PERMISSIONS[m.role as TenantRole]
          ?? [];
        return {
          membershipId: m._id,
          userId: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantRole: m.role,
          permissions,
          isActive: m.isActive,
          joinedAt: m.joinedAt,
        };
      })
    );

    // Hide SUPERADMIN users from non-SUPERADMIN callers
    return members.filter((m) => m !== null && (isSuperAdmin || m.role !== "SUPERADMIN"));
  },
});

/**
 * listTenantInvitations — tenant-scoped, requires users:invite permission.
 * Returns pending and recent invitations for the current tenant.
 */
export const listTenantInvitations = tenantQuery({
  args: {},
  handler: async (ctx, _args, tenant) => {
    const isSuperAdmin = tenant.user.role === "SUPERADMIN";
    if (!isSuperAdmin) {
      checkPermission(tenant, "users", "invite");
    }

    const invitations = await ctx.db
      .query("tenantInvitations")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .order("desc")
      .collect();

    // Enrich with inviter info
    const enriched = await Promise.all(
      invitations.map(async (inv) => {
        const inviter = await ctx.db.get(inv.invitedBy);
        return {
          ...inv,
          inviterName: inviter
            ? `${inviter.firstName} ${inviter.lastName}`
            : "—",
        };
      })
    );

    return enriched;
  },
});
