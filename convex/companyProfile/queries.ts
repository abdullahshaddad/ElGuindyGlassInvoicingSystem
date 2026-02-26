import { query } from "../_generated/server";

export const getCompanyProfile = query({
  args: {},
  handler: async (ctx) => {
    // Company profile is a singleton — return the first (and only) record
    const profile = await ctx.db.query("companyProfile").first();
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
