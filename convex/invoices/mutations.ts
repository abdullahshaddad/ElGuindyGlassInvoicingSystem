import { v, Infer } from "convex/values";
import { tenantMutation, verifyTenantOwnership } from "../helpers/multitenancy";
import { checkPermission } from "../helpers/permissions";
import { logAuditEvent } from "../helpers/auditLog";
import { generateInvoiceNumber } from "../helpers/idGenerator";
import {
  toMeters,
  calculateAreaM2,
  calculateLengthM,
  roundTo2,
} from "../helpers/dimensionUtils";
import {
  calculateOperation,
  type OperationInput,
} from "../lib/operationCalculation";
import {
  lineStatus,
  dimensionUnit,
  operationTypeLabel,
  calculationMethodLabel,
  invoiceLineOperationValidator,
} from "../schema";

// ============================================================
// Arg validators
// ============================================================

/** What the frontend sends for a single operation on a line. */
const operationInputArg = v.object({
  operationType: operationTypeLabel,
  calculationMethod: v.optional(calculationMethodLabel),
  manualMeters: v.optional(v.number()),
  manualPrice: v.optional(v.number()),
});

/** What the frontend sends for a single glass line. */
const lineArg = v.object({
  glassTypeId: v.id("glassTypes"),
  dimensions: v.object({
    width:         v.number(),
    height:        v.number(),
    measuringUnit: dimensionUnit,
  }),
  diameter: v.optional(v.number()),
  quantity: v.optional(v.number()),
  notes: v.optional(v.string()),
  operations: v.optional(v.array(operationInputArg)),
});

// ============================================================
// createInvoice
// ============================================================

export const createInvoice = tenantMutation({
  args: {
    customerId: v.id("customers"),
    lines: v.array(lineArg),
    amountPaidNow: v.optional(v.number()),
    notes: v.optional(v.string()),
    issueDate: v.optional(v.number()),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "invoices", "create");

    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.tenantId !== tenant.tenantId) throw new Error("العميل غير موجود");

    if (args.lines.length === 0) throw new Error("يجب أن تحتوي الفاتورة على بند واحد على الأقل");

    const invoiceNumber = await generateInvoiceNumber(ctx, "INV", tenant.tenantId);
    const readableId = `INV-${invoiceNumber}`;
    const now = Date.now();
    let invoiceTotalPrice = 0;

    const invoiceId = await ctx.db.insert("invoices", {
      tenantId: tenant.tenantId,
      readableId,
      invoiceNumber,
      customerId: args.customerId,
      issueDate: args.issueDate ?? now,
      totalPrice: 0,
      amountPaidNow: 0,
      remainingBalance: 0,
      status: "PENDING",
      workStatus: "PENDING",
      notes: args.notes,
      createdAt: now,
    });

    for (let i = 0; i < args.lines.length; i++) {
      const lineReq = args.lines[i];

      const glassType = await ctx.db.get(lineReq.glassTypeId);
      if (!glassType || glassType.tenantId !== tenant.tenantId) throw new Error(`البند ${i + 1}: نوع الزجاج غير موجود`);
      if (!glassType.active) throw new Error(`البند ${i + 1}: نوع الزجاج غير نشط`);

      const { width, height, measuringUnit } = lineReq.dimensions;
      const widthM  = toMeters(width,  measuringUnit);
      const heightM = toMeters(height, measuringUnit);

      if (widthM < 0.001 || heightM < 0.001) {
        throw new Error(`البند ${i + 1}: الأبعاد صغيرة جداً`);
      }

      const areaM2  = calculateAreaM2(width, height, measuringUnit);
      const lengthM = calculateLengthM(width, height, measuringUnit);

      const diameterM = lineReq.diameter != null
        ? toMeters(lineReq.diameter, measuringUnit)
        : undefined;

      const quantityForPricing = glassType.pricingMethod === "LENGTH" ? lengthM : areaM2;
      const glassPrice = roundTo2(quantityForPricing * glassType.pricePerMeter);

      const quantity = (lineReq.quantity != null && lineReq.quantity > 0) ? lineReq.quantity : 1;

      const embeddedOperations: Infer<typeof invoiceLineOperationValidator>[] = [];
      let totalOperationsPrice = 0;
      let totalBevelingMeters  = 0;

      for (const opReq of lineReq.operations ?? []) {
        const opInput: OperationInput = {
          operationTypeCode:     opReq.operationType.code,
          calculationMethodCode: opReq.calculationMethod?.code,
          manualMeters:          opReq.manualMeters,
          manualPrice:           opReq.manualPrice,
          diameterM,
        };

        const result = await calculateOperation(ctx, opInput, widthM, heightM, glassType.thickness, tenant.tenantId);

        embeddedOperations.push({
          operationType:     opReq.operationType,
          calculationMethod: opReq.calculationMethod,
          manualMeters:      result.bevelingMeters ?? opReq.manualMeters,
          price:             roundTo2(result.price),
        });

        totalOperationsPrice += result.price;
        if (result.bevelingMeters) totalBevelingMeters += result.bevelingMeters;
      }

      totalOperationsPrice = roundTo2(totalOperationsPrice);
      const lineTotal = roundTo2((glassPrice + totalOperationsPrice) * quantity);

      await ctx.db.insert("invoiceLines", {
        tenantId: tenant.tenantId,
        invoiceId,
        glassTypeId: lineReq.glassTypeId,
        glassTypeSnapshot: {
          name:      glassType.name,
          thickness: glassType.thickness,
          color:     glassType.color,
        },
        dimensions: lineReq.dimensions,
        diameter:   lineReq.diameter,
        areaM2,
        lengthM,
        quantity,
        bevelingMeters: totalBevelingMeters > 0 ? totalBevelingMeters : undefined,
        glassPrice,
        lineTotal,
        operations: embeddedOperations,
        notes:  lineReq.notes,
        status: "PENDING",
      });

      invoiceTotalPrice += lineTotal;
    }

    invoiceTotalPrice = roundTo2(invoiceTotalPrice);

    // ── Payment logic ──────────────────────────────────────────────────────
    let amountPaidNow     = 0;
    let remainingBalance  = invoiceTotalPrice;

    if (customer.customerType === "CASH") {
      amountPaidNow    = args.amountPaidNow ?? 0;
      remainingBalance = roundTo2(invoiceTotalPrice - amountPaidNow);
    } else {
      await ctx.db.patch(args.customerId, {
        balance:   (customer.balance ?? 0) + invoiceTotalPrice,
        updatedAt: now,
      });

      if (args.amountPaidNow != null && args.amountPaidNow > 0) {
        amountPaidNow    = args.amountPaidNow;
        remainingBalance = roundTo2(invoiceTotalPrice - amountPaidNow);

        await ctx.db.insert("payments", {
          tenantId:      tenant.tenantId,
          customerId:    args.customerId,
          invoiceId,
          amount:        amountPaidNow,
          paymentMethod: "CASH",
          paymentDate:   now,
          notes:         "دفعة أولية عند إنشاء الفاتورة",
          createdAt:     now,
          createdBy:     tenant.user.username,
        });

        const updatedCustomer = await ctx.db.get(args.customerId);
        if (updatedCustomer) {
          await ctx.db.patch(args.customerId, {
            balance:   (updatedCustomer.balance ?? 0) - amountPaidNow,
            updatedAt: now,
          });
        }
      } else {
        remainingBalance = invoiceTotalPrice;
      }
    }

    let status: "PENDING" | "PAID" | "PARTIALLY_PAID" | "CANCELLED" = "PENDING";
    let paymentDate: number | undefined;

    if (remainingBalance <= 0.01) {
      status       = "PAID";
      paymentDate  = now;
      remainingBalance = 0;
    } else if (amountPaidNow > 0) {
      status = "PARTIALLY_PAID";
    }

    await ctx.db.patch(invoiceId, {
      totalPrice: invoiceTotalPrice,
      amountPaidNow,
      remainingBalance,
      status,
      paymentDate,
      updatedAt: now,
    });

    await logAuditEvent(ctx, tenant, {
      action: "invoice.created",
      entityType: "invoice",
      entityId: invoiceId,
    });

    return invoiceId;
  },
});

// ============================================================
// markAsPaid
// ============================================================

export const markAsPaid = tenantMutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "invoices", "update");

    const invoice = await ctx.db.get(args.invoiceId);
    verifyTenantOwnership(invoice, tenant.tenantId);

    if (invoice.status !== "PAID") {
      const remaining = invoice.remainingBalance;
      const now = Date.now();

      const customer = await ctx.db.get(invoice.customerId);
      if (customer && customer.customerType !== "CASH") {
        await ctx.db.patch(invoice.customerId, {
          balance:   (customer.balance ?? 0) - remaining,
          updatedAt: now,
        });
      }

      await ctx.db.patch(args.invoiceId, {
        status:           "PAID",
        remainingBalance: 0,
        paymentDate:      now,
        updatedAt:        now,
      });

      await logAuditEvent(ctx, tenant, {
        action: "invoice.status_changed",
        entityType: "invoice",
        entityId: args.invoiceId,
        changes: { status: { from: invoice.status, to: "PAID" } },
      });
    }
  },
});

// ============================================================
// deleteInvoice
// ============================================================

export const deleteInvoice = tenantMutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "invoices", "delete");

    const invoice = await ctx.db.get(args.invoiceId);
    verifyTenantOwnership(invoice, tenant.tenantId);

    const now = Date.now();

    // 1. Reverse payments
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    for (const payment of payments) {
      const customer = await ctx.db.get(payment.customerId);
      if (customer) {
        await ctx.db.patch(payment.customerId, {
          balance:   (customer.balance ?? 0) + payment.amount,
          updatedAt: now,
        });
      }
      await ctx.db.delete(payment._id);
    }

    // 2. Reverse invoice debt for non-CASH customers
    const customer = await ctx.db.get(invoice.customerId);
    if (customer && customer.customerType !== "CASH") {
      await ctx.db.patch(invoice.customerId, {
        balance:   (customer.balance ?? 0) - invoice.totalPrice,
        updatedAt: now,
      });
    }

    // 3. Delete invoice lines
    const lines = await ctx.db
      .query("invoiceLines")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    for (const line of lines) {
      await ctx.db.delete(line._id);
    }

    // 4. Delete associated print jobs
    const printJobs = await ctx.db
      .query("printJobs")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    for (const job of printJobs) {
      await ctx.db.delete(job._id);
    }

    // 5. Delete the invoice itself
    await ctx.db.delete(args.invoiceId);

    await logAuditEvent(ctx, tenant, {
      action: "invoice.deleted",
      entityType: "invoice",
      entityId: args.invoiceId,
      severity: "critical",
    });
  },
});

// ============================================================
// updateLineStatus
// ============================================================

export const updateLineStatus = tenantMutation({
  args: {
    lineId: v.id("invoiceLines"),
    status: lineStatus,
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "orders", "update");

    const line = await ctx.db.get(args.lineId);
    verifyTenantOwnership(line, tenant.tenantId);

    await ctx.db.patch(args.lineId, { status: args.status });

    const allLines = await ctx.db
      .query("invoiceLines")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", line.invoiceId))
      .collect();

    const lineStatuses = allLines.map((l) =>
      l._id === args.lineId ? args.status : l.status
    );

    let newWorkStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

    const allCompleted = lineStatuses.every((s) => s === "COMPLETED");
    const anyActive    = lineStatuses.some((s) => s === "IN_PROGRESS" || s === "COMPLETED");

    if (allCompleted) {
      newWorkStatus = "COMPLETED";
    } else if (anyActive) {
      newWorkStatus = "IN_PROGRESS";
    } else {
      newWorkStatus = "PENDING";
    }

    await ctx.db.patch(line.invoiceId, {
      workStatus: newWorkStatus,
      updatedAt:  Date.now(),
    });
  },
});
