import { internalMutation } from "../_generated/server";

/**
 * Deletes every document in every table except `users`.
 *
 * Run with:
 *   npx convex run migrations/dropAllExceptUsers:run
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Helper: delete all docs in a table and return the count
    const clear = async (docs: { _id: any }[]) => {
      for (const doc of docs) await ctx.db.delete(doc._id);
      return docs.length;
    };

    // Delete children before parents to keep things tidy
    const invoiceLines    = await clear(await ctx.db.query("invoiceLines").collect());
    const printJobs       = await clear(await ctx.db.query("printJobs").collect());
    const payments        = await clear(await ctx.db.query("payments").collect());
    const invoices        = await clear(await ctx.db.query("invoices").collect());
    const notifications   = await clear(await ctx.db.query("notifications").collect());
    const idCounters      = await clear(await ctx.db.query("idCounters").collect());
    const bevelingRates   = await clear(await ctx.db.query("bevelingRates").collect());
    const laserRates      = await clear(await ctx.db.query("laserRates").collect());
    const operationPrices = await clear(await ctx.db.query("operationPrices").collect());
    const glassTypes      = await clear(await ctx.db.query("glassTypes").collect());
    const companyProfile  = await clear(await ctx.db.query("companyProfile").collect());
    const customers       = await clear(await ctx.db.query("customers").collect());

    return {
      invoiceLines,
      printJobs,
      payments,
      invoices,
      notifications,
      idCounters,
      bevelingRates,
      laserRates,
      operationPrices,
      glassTypes,
      companyProfile,
      customers,
      users: "untouched",
    };
  },
});
