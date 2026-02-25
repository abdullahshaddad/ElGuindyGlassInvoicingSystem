import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Migration helper mutations for importing PostgreSQL data into Convex.
 *
 * These mutations accept a table name and raw record data, inserting them
 * directly into the specified Convex table. They are intended to be called
 * from the Node.js migration script (scripts/migrate-to-convex.mjs).
 *
 * IMPORTANT: Remove or disable these mutations after migration is complete,
 * as they bypass all business-logic validation.
 */

/**
 * Insert a single record into the specified table.
 * Returns the new Convex document ID.
 */
export const insertRecord = mutation({
  args: {
    table: v.string(),
    data: v.any(),
  },
  handler: async (ctx, { table, data }) => {
    return await ctx.db.insert(table as any, data);
  },
});

/**
 * Insert a batch of records into the specified table.
 * Returns an array of new Convex document IDs (in the same order as input).
 *
 * Convex mutations have a ~20 s wall-clock limit, so keep batches small
 * (the migration script defaults to 50 records per batch).
 */
export const insertBatch = mutation({
  args: {
    table: v.string(),
    records: v.array(v.any()),
  },
  handler: async (ctx, { table, records }) => {
    const ids: string[] = [];
    for (const record of records) {
      const id = await ctx.db.insert(table as any, record);
      ids.push(id);
    }
    return ids;
  },
});
