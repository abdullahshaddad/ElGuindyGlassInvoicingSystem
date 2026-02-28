import { v } from "convex/values";
import { tenantQuery, verifyTenantOwnership } from "../helpers/multitenancy";

export const getInvoicePrintJobs = tenantQuery({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args, tenant) => {
    // Verify invoice belongs to tenant
    const invoice = await ctx.db.get(args.invoiceId);
    verifyTenantOwnership(invoice, tenant.tenantId);

    const jobs = await ctx.db
      .query("printJobs")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    return await Promise.all(
      jobs.map(async (job) => {
        if (job.invoiceReadableId) return job;
        const inv = await ctx.db.get(job.invoiceId);
        return {
          ...job,
          invoiceReadableId: inv?.readableId || String(inv?.invoiceNumber ?? ""),
        };
      })
    );
  },
});

export const getPrintJob = tenantQuery({
  args: { printJobId: v.id("printJobs") },
  handler: async (ctx, args, tenant) => {
    const job = await ctx.db.get(args.printJobId);
    verifyTenantOwnership(job, tenant.tenantId);

    let pdfUrl: string | null = null;
    if (job.pdfStorageId) {
      pdfUrl = await ctx.storage.getUrl(job.pdfStorageId);
    }

    let invoiceReadableId = job.invoiceReadableId;
    if (!invoiceReadableId) {
      const invoice = await ctx.db.get(job.invoiceId);
      invoiceReadableId = invoice?.readableId || String(invoice?.invoiceNumber ?? "");
    }

    return { ...job, pdfUrl, invoiceReadableId };
  },
});

export const getPendingPrintJobs = tenantQuery({
  args: {},
  handler: async (ctx, _args, tenant) => {
    const jobs = await ctx.db
      .query("printJobs")
      .withIndex("by_tenantId_status", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("status", "QUEUED")
      )
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
