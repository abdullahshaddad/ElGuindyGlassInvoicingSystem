import { internalMutation } from "../_generated/server";

/**
 * Monitor stuck print jobs — mark QUEUED jobs older than 10 min as FAILED.
 */
export const monitorPrintJobs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    const queuedJobs = await ctx.db
      .query("printJobs")
      .withIndex("by_status", (q) => q.eq("status", "QUEUED"))
      .collect();

    const stuckJobs = queuedJobs.filter((j) => j.createdAt < tenMinutesAgo);

    for (const job of stuckJobs) {
      await ctx.db.patch(job._id, {
        status: "FAILED",
        errorMessage: "تجاوز المهلة الزمنية - مهمة الطباعة عالقة",
      });
    }
  },
});

/**
 * Clean up old completed/failed print jobs (older than 30 days).
 * Deletes the stored PDF and the job record.
 */
export const cleanupOldPrintJobs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const allJobs = await ctx.db.query("printJobs").collect();
    const oldJobs = allJobs.filter(
      (j) =>
        (j.status === "PRINTED" || j.status === "FAILED") &&
        j.createdAt < thirtyDaysAgo
    );

    for (const job of oldJobs) {
      if (job.pdfStorageId) {
        await ctx.storage.delete(job.pdfStorageId);
      }
      await ctx.db.delete(job._id);
    }
  },
});
