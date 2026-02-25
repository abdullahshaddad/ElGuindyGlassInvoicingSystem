import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../helpers/auth";

export const getInvoicePrintJobs = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const jobs = await ctx.db
      .query("printJobs")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    // Backfill invoiceReadableId for old jobs that don't have it
    return await Promise.all(
      jobs.map(async (job) => {
        if (job.invoiceReadableId) return job;
        const invoice = await ctx.db.get(job.invoiceId);
        return {
          ...job,
          invoiceReadableId: invoice?.readableId || String(invoice?.invoiceNumber ?? ""),
        };
      })
    );
  },
});

export const getPrintJob = query({
  args: { printJobId: v.id("printJobs") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const job = await ctx.db.get(args.printJobId);
    if (!job) throw new Error("مهمة الطباعة غير موجودة");

    // Get download URL if PDF exists
    let pdfUrl: string | null = null;
    if (job.pdfStorageId) {
      pdfUrl = await ctx.storage.getUrl(job.pdfStorageId);
    }

    // Backfill invoiceReadableId for old jobs
    let invoiceReadableId = job.invoiceReadableId;
    if (!invoiceReadableId) {
      const invoice = await ctx.db.get(job.invoiceId);
      invoiceReadableId = invoice?.readableId || String(invoice?.invoiceNumber ?? "");
    }

    return { ...job, pdfUrl, invoiceReadableId };
  },
});

export const getPendingPrintJobs = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const jobs = await ctx.db
      .query("printJobs")
      .withIndex("by_status", (q) => q.eq("status", "QUEUED"))
      .collect();

    return await Promise.all(
      jobs.map(async (job) => {
        if (job.invoiceReadableId) return job;
        const invoice = await ctx.db.get(job.invoiceId);
        return {
          ...job,
          invoiceReadableId: invoice?.readableId || String(invoice?.invoiceNumber ?? ""),
        };
      })
    );
  },
});
