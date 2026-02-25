import { query } from "../_generated/server";

export const getCompanyProfile = query({
  args: {},
  handler: async (ctx) => {
    // Company profile is a singleton — return the first (and only) record
    return await ctx.db.query("companyProfile").first();
  },
});
