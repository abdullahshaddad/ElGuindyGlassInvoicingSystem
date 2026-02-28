import { internalMutation } from "../_generated/server";

/**
 * One-time migration: clean up SUPERADMIN users that were incorrectly
 * linked to tenants via defaultTenantId and tenantMemberships.
 *
 * - Clears defaultTenantId on SUPERADMIN users
 * - Deactivates any tenantMembership records for SUPERADMIN users
 *
 * Safe to run multiple times — idempotent.
 */
export const cleanupSuperAdminTenantLinks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const superAdmins = allUsers.filter((u) => u.role === "SUPERADMIN");

    let clearedDefault = 0;
    let deactivatedMemberships = 0;

    for (const sa of superAdmins) {
      // Clear defaultTenantId
      if (sa.defaultTenantId) {
        await ctx.db.patch(sa._id, { defaultTenantId: undefined });
        clearedDefault++;
      }

      // Clear viewingTenantId (in case it was set)
      if (sa.viewingTenantId) {
        await ctx.db.patch(sa._id, { viewingTenantId: undefined });
      }

      // Deactivate memberships
      const memberships = await ctx.db
        .query("tenantMemberships")
        .withIndex("by_userId", (q) => q.eq("userId", sa._id))
        .collect();

      for (const m of memberships) {
        if (m.isActive) {
          await ctx.db.patch(m._id, { isActive: false });
          deactivatedMemberships++;
        }
      }
    }

    return {
      superAdminCount: superAdmins.length,
      clearedDefault,
      deactivatedMemberships,
    };
  },
});
