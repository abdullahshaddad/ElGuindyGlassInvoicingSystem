import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * Check if a specific print job has timed out.
 * Scheduled per-job via ctx.scheduler.runAfter when a print job is created.
 * If the job is still QUEUED after 10 minutes, marks it as FAILED and
 * inserts a broadcast notification for the tenant.
 */
export const checkPrintJobTimeout = internalMutation({
  args: {
    printJobId: v.id("printJobs"),
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.printJobId);
    if (!job || job.status !== "QUEUED") return;

    await ctx.db.patch(args.printJobId, {
      status: "FAILED",
      errorMessage: "تجاوز المهلة الزمنية - مهمة الطباعة عالقة",
    });

    const readableId = job.invoiceReadableId || job.readableId || "";

    await ctx.db.insert("notifications", {
      tenantId: args.tenantId,
      title: `انتهت مهلة مهمة الطباعة ${readableId}`,
      message: "تجاوزت مهمة الطباعة المهلة الزمنية وتم تحديدها كفاشلة",
      type: "ERROR",
      targetUserId: undefined,
      actionUrl: undefined,
      relatedEntity: args.printJobId,
      readByUserIds: [],
      hiddenByUserIds: [],
      createdAt: Date.now(),
    });
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
