import { MutationCtx } from "../_generated/server";

/**
 * Generate a numeric invoice number with atomic counter increment.
 *
 * Returns the next sequential number (1, 2, 3, ...).
 */
export async function generateInvoiceNumber(
  ctx: MutationCtx,
  prefix: string
): Promise<number> {
  const counterKey = prefix;

  // Find existing counter
  const existing = await ctx.db
    .query("idCounters")
    .withIndex("by_prefix", (q) => q.eq("prefix", counterKey))
    .unique();

  let nextValue: number;
  if (existing) {
    nextValue = existing.currentValue + 1;
    await ctx.db.patch(existing._id, { currentValue: nextValue });
  } else {
    nextValue = 1;
    await ctx.db.insert("idCounters", {
      prefix: counterKey,
      currentValue: nextValue,
    });
  }

  return nextValue;
}
