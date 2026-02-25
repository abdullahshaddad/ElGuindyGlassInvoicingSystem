import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../helpers/auth";
import { generateInvoiceNumber } from "../helpers/idGenerator";
import { printType, printStatus } from "../schema";

export const createPrintJob = mutation({
  args: {
    invoiceId: v.id("invoices"),
    type: printType,
    invoiceLineId: v.optional(v.id("invoiceLines")),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("الفاتورة غير موجودة");

    const printJobNumber = await generateInvoiceNumber(ctx, "PJ");

    return await ctx.db.insert("printJobs", {
      invoiceId: args.invoiceId,
      invoiceReadableId: invoice.readableId || String(invoice.invoiceNumber ?? ""),
      readableId: "PJ-" + String(printJobNumber),
      type: args.type,
      status: "QUEUED",
      createdAt: Date.now(),
      invoiceLineId: args.invoiceLineId,
    });
  },
});

export const updatePrintJobStatus = mutation({
  args: {
    printJobId: v.id("printJobs"),
    status: printStatus,
    errorMessage: v.optional(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.printJobId);
    if (!job) throw new Error("مهمة الطباعة غير موجودة");

    const updates: Record<string, unknown> = { status: args.status };
    if (args.errorMessage !== undefined) updates.errorMessage = args.errorMessage;
    if (args.pdfStorageId !== undefined) updates.pdfStorageId = args.pdfStorageId;
    if (args.status === "PRINTED") updates.printedAt = Date.now();

    await ctx.db.patch(args.printJobId, updates);
  },
});

export const deletePrintJob = mutation({
  args: { printJobId: v.id("printJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.printJobId);
    if (!job) return;

    // Delete stored PDF if exists
    if (job.pdfStorageId) {
      await ctx.storage.delete(job.pdfStorageId);
    }

    await ctx.db.delete(args.printJobId);
  },
});
