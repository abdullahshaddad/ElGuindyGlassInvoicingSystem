import { internalMutation } from "../_generated/server";

/**
 * Renames `calculationMethod` → `pricingMethod` on all existing glassTypes documents.
 *
 * Run with:
 *   npx convex run migrations/renameGlassTypeField:run
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("glassTypes").collect();
    let updated = 0;

    for (const doc of docs) {
      const raw = doc as Record<string, unknown>;
      if ("calculationMethod" in raw && !("pricingMethod" in raw)) {
        await ctx.db.patch(doc._id, {
          pricingMethod: (raw.calculationMethod as string) as any,
        });
        // Remove the old field by setting it to undefined
        await ctx.db.patch(doc._id, { calculationMethod: undefined } as any);
        updated++;
      }
    }

    return { total: docs.length, updated };
  },
});
