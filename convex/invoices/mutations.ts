import { mutation } from "../_generated/server";
import { v, Infer } from "convex/values";
import { requireRole, requireAuth } from "../helpers/auth";
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
  invoiceStatus,
  workStatus,
  lineStatus,
  dimensionUnit,
  operationTypeLabel,
  calculationMethodLabel,
  invoiceLineOperationValidator,
  paymentMethod,
} from "../schema";

// ============================================================
// Arg validators
// ============================================================

/** What the frontend sends for a single operation on a line. */
const operationInputArg = v.object({
  /** Full bilingual label — stored as-is in the historical record. */
  operationType: operationTypeLabel,
  /** Perimeter formula — omit for area-based (SANDING) or manual-price operations. */
  calculationMethod: v.optional(calculationMethodLabel),
  /** Manually entered edge length in metres (CURVE_ARCH / PANELS calc method). */
  manualMeters: v.optional(v.number()),
  /** Manual price override (LASER, CURVE_ARCH, PANELS). */
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
  /** Diameter in the same unit as dimensions — for CIRCLE calculations. */
  diameter: v.optional(v.number()),
  quantity: v.optional(v.number()),
  notes: v.optional(v.string()),
  operations: v.optional(v.array(operationInputArg)),
});

// ============================================================
// createInvoice
// ============================================================

export const createInvoice = mutation({
  args: {
    customerId: v.id("customers"),
    lines: v.array(lineArg),
    amountPaidNow: v.optional(v.number()),
    notes: v.optional(v.string()),
    issueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["OWNER", "ADMIN", "CASHIER"]);

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("العميل غير موجود");

    if (args.lines.length === 0) throw new Error("يجب أن تحتوي الفاتورة على بند واحد على الأقل");

    const invoiceNumber = await generateInvoiceNumber(ctx, "INV");
    const readableId = `INV-${invoiceNumber}`;
    const now = Date.now();
    let invoiceTotalPrice = 0;

    // Create the invoice header first so we have its ID for line insertion
    const invoiceId = await ctx.db.insert("invoices", {
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

      // Validate glass type
      const glassType = await ctx.db.get(lineReq.glassTypeId);
      if (!glassType) throw new Error(`البند ${i + 1}: نوع الزجاج غير موجود`);
      if (!glassType.active) throw new Error(`البند ${i + 1}: نوع الزجاج غير نشط`);

      const { width, height, measuringUnit } = lineReq.dimensions;
      const widthM  = toMeters(width,  measuringUnit);
      const heightM = toMeters(height, measuringUnit);

      if (widthM < 0.001 || heightM < 0.001) {
        throw new Error(`البند ${i + 1}: الأبعاد صغيرة جداً`);
      }

      const areaM2  = calculateAreaM2(width, height, measuringUnit);
      const lengthM = calculateLengthM(width, height, measuringUnit);

      // Diameter converted to metres for CIRCLE calculations
      const diameterM = lineReq.diameter != null
        ? toMeters(lineReq.diameter, measuringUnit)
        : undefined;

      // Glass price
      const quantityForPricing = glassType.pricingMethod === "LENGTH" ? lengthM : areaM2;
      const glassPrice = roundTo2(quantityForPricing * glassType.pricePerMeter);

      const quantity = (lineReq.quantity != null && lineReq.quantity > 0) ? lineReq.quantity : 1;

      // ── Build embedded operations ──────────────────────────────────────────
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

        const result = await calculateOperation(ctx, opInput, widthM, heightM, glassType.thickness);

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

      // lineTotal = (glassPrice + operations) × quantity
      const lineTotal = roundTo2((glassPrice + totalOperationsPrice) * quantity);

      await ctx.db.insert("invoiceLines", {
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
      // Add invoice total to customer balance (debt)
      await ctx.db.patch(args.customerId, {
        balance:   (customer.balance ?? 0) + invoiceTotalPrice,
        updatedAt: now,
      });

      if (args.amountPaidNow != null && args.amountPaidNow > 0) {
        amountPaidNow    = args.amountPaidNow;
        remainingBalance = roundTo2(invoiceTotalPrice - amountPaidNow);

        await ctx.db.insert("payments", {
          customerId:    args.customerId,
          invoiceId,
          amount:        amountPaidNow,
          paymentMethod: "CASH",
          paymentDate:   now,
          notes:         "دفعة أولية عند إنشاء الفاتورة",
          createdAt:     now,
          createdBy:     user.username,
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

    // ── Invoice status ─────────────────────────────────────────────────────
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

    return invoiceId;
  },
});

// ============================================================
// markAsPaid
// ============================================================

export const markAsPaid = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN", "CASHIER"]);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("الفاتورة غير موجودة");

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
    }
  },
});

// ============================================================
// deleteInvoice
// ============================================================

export const deleteInvoice = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("الفاتورة غير موجودة");

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

    // 3. Delete invoice lines (operations are embedded — no separate delete needed)
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
  },
});

// ============================================================
// updateLineStatus
// ============================================================

export const updateLineStatus = mutation({
  args: {
    lineId: v.id("invoiceLines"),
    status: lineStatus,
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN", "WORKER"]);

    const line = await ctx.db.get(args.lineId);
    if (!line) throw new Error("البند غير موجود");

    await ctx.db.patch(args.lineId, { status: args.status });

    // Recalculate invoice workStatus from all lines
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
