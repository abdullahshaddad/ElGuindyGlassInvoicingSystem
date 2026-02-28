import { v } from "convex/values";
import { tenantMutation, verifyTenantOwnership } from "../helpers/multitenancy";
import { checkPermission } from "../helpers/permissions";
import { logAuditEvent } from "../helpers/auditLog";
import { generateInvoiceNumber } from "../helpers/idGenerator";
import { printType, printStatus } from "../schema";

export const createPrintJob = tenantMutation({
  args: {
    invoiceId: v.id("invoices"),
    type: printType,
    invoiceLineId: v.optional(v.id("invoiceLines")),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "stickers", "generate");

    const invoice = await ctx.db.get(args.invoiceId);
    verifyTenantOwnership(invoice, tenant.tenantId);

    const printJobNumber = await generateInvoiceNumber(ctx, "PJ", tenant.tenantId);

    const id = await ctx.db.insert("printJobs", {
      tenantId: tenant.tenantId,
      invoiceId: args.invoiceId,
      invoiceReadableId: invoice.readableId || String(invoice.invoiceNumber ?? ""),
      readableId: "PJ-" + String(printJobNumber),
      type: args.type,
      status: "QUEUED",
      createdAt: Date.now(),
      invoiceLineId: args.invoiceLineId,
    });

    await logAuditEvent(ctx, tenant, {
      action: "sticker.generated",
      entityType: "printJob",
      entityId: id,
    });

    return id;
  },
});

export const updatePrintJobStatus = tenantMutation({
  args: {
    printJobId: v.id("printJobs"),
    status: printStatus,
    errorMessage: v.optional(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "stickers", "print");

    const job = await ctx.db.get(args.printJobId);
    verifyTenantOwnership(job, tenant.tenantId);

    const updates: Record<string, unknown> = { status: args.status };
    if (args.errorMessage !== undefined) updates.errorMessage = args.errorMessage;
    if (args.pdfStorageId !== undefined) updates.pdfStorageId = args.pdfStorageId;
    if (args.status === "PRINTED") updates.printedAt = Date.now();

    await ctx.db.patch(args.printJobId, updates);

    await logAuditEvent(ctx, tenant, {
      action: "sticker.printed",
      entityType: "printJob",
      entityId: args.printJobId,
    });
  },
});

export const deletePrintJob = tenantMutation({
  args: { printJobId: v.id("printJobs") },
  handler: async (ctx, args, tenant) => {
    const job = await ctx.db.get(args.printJobId);
    if (!job || job.tenantId !== tenant.tenantId) return;

    if (job.pdfStorageId) {
      await ctx.storage.delete(job.pdfStorageId);
    }

    await ctx.db.delete(args.printJobId);
  },
});
