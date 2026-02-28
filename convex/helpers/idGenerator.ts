import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Generate a numeric invoice number with atomic counter increment.
 *
 * Returns the next sequential number (1, 2, 3, ...).
 * Uses tenant-scoped counters via the `by_tenantId_prefix` index.
 */
export async function generateInvoiceNumber(
  ctx: MutationCtx,
  prefix: string,
  tenantId: Id<"tenants">
): Promise<number> {
  const counterKey = prefix;

  const existing = await ctx.db
    .query("idCounters")
    .withIndex("by_tenantId_prefix", (q) =>
      q.eq("tenantId", tenantId).eq("prefix", counterKey)
    )
    .unique();

  let nextValue: number;
  if (existing) {
    nextValue = existing.currentValue + 1;
    await ctx.db.patch(existing._id, { currentValue: nextValue });
  } else {
    nextValue = 1;
    await ctx.db.insert("idCounters", {
      tenantId,
      prefix: counterKey,
      currentValue: nextValue,
    });
  }

  return nextValue;
}
