import { query } from "../_generated/server";
import { getTenantFromAuth } from "../helpers/multitenancy";

/**
 * getCompanyProfile — returns null when the user is not yet authenticated
 * (e.g. Sidebar renders before login). Once authenticated, scopes to tenant.
 */
export const getCompanyProfile = query({
  args: {},
  handler: async (ctx) => {
    let tenant;
    try {
      tenant = await getTenantFromAuth(ctx);
    } catch {
      // Not authenticated yet — return null instead of crashing
      return null;
    }

    const profile = await ctx.db
      .query("companyProfile")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .first();
    if (!profile) return null;

    // Resolve logoStorageId to a URL
    let logoUrl = profile.logoUrl || null;
    if (profile.logoStorageId) {
      const url = await ctx.storage.getUrl(profile.logoStorageId);
      if (url) logoUrl = url;
    }

    return { ...profile, logoUrl };
  },
});
