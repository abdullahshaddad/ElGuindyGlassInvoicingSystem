import { query } from "../_generated/server";
import { v } from "convex/values";
import { tenantQuery } from "../helpers/multitenancy";

/**
 * getCurrentUser — no tenant scope needed.
 * This is the bootstrap query that resolves the Clerk identity to a user record.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    return user;
  },
});

/**
 * listUsers — scoped via tenantMemberships join.
 * Returns users who are members of the caller's tenant.
 */
export const listUsers = tenantQuery({
  args: {},
  handler: async (ctx, _args, tenant) => {
    // Get all memberships for this tenant
    const memberships = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    // Fetch user records for each membership
    const users = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        if (!user) return null;
        return {
          ...user,
          tenantRole: m.role,
          membershipIsActive: m.isActive,
        };
      })
    );

    // Hide SUPERADMIN users from non-SUPERADMIN callers
    const callerIsSuperAdmin = tenant.user.role === "SUPERADMIN";
    return users.filter((u) => u !== null && (callerIsSuperAdmin || u.role !== "SUPERADMIN"));
  },
});

/**
 * getUser — verify the target user is a member of the caller's tenant.
 */
export const getUser = tenantQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args, tenant) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("المستخدم غير موجود");

    // Verify user is a member of this tenant
    const membership = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId_userId", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("userId", args.userId)
      )
      .unique();

    if (!membership) throw new Error("المستخدم غير موجود");

    return { ...user, tenantRole: membership.role };
  },
});
