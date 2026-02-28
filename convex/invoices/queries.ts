import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { tenantQuery, verifyTenantOwnership } from "../helpers/multitenancy";
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
  dimensionUnit,
  operationTypeLabel,
  calculationMethodLabel,
} from "../schema";

// ============================================================
// getInvoice
// ============================================================

export const getInvoice = tenantQuery({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args, tenant) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.tenantId !== tenant.tenantId) return null;

    const customer = await ctx.db.get(invoice.customerId);

    const lines = await ctx.db
      .query("invoiceLines")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    const linesWithDetails = lines.map((line) => {
      const glassType = line.glassTypeSnapshot ?? { name: "—", thickness: 0 };
      return { ...line, glassType, operations: line.operations ?? [] };
    });

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .collect();

    return { ...invoice, customer, lines: linesWithDetails, payments };
  },
});

// ============================================================
// listInvoices
// ============================================================

export const listInvoices = tenantQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    status:     v.optional(invoiceStatus),
    customerId: v.optional(v.id("customers")),
    startDate:  v.optional(v.number()),
    endDate:    v.optional(v.number()),
    search:     v.optional(v.string()),
  },
  handler: async (ctx, args, tenant) => {
    // Primary query always scoped by tenant
    let baseQuery;

    if (args.status) {
      baseQuery = ctx.db
        .query("invoices")
        .withIndex("by_tenantId_status", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("status", args.status!)
        );
    } else if (args.customerId) {
      baseQuery = ctx.db
        .query("invoices")
        .withIndex("by_tenantId_customerId", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("customerId", args.customerId!)
        );
    } else if (args.startDate || args.endDate) {
      baseQuery = ctx.db
        .query("invoices")
        .withIndex("by_tenantId_issueDate", (q) => {
          const withTenant = q.eq("tenantId", tenant.tenantId);
          if (args.startDate && args.endDate) {
            return withTenant.gte("issueDate", args.startDate).lte("issueDate", args.endDate);
          } else if (args.startDate) {
            return withTenant.gte("issueDate", args.startDate);
          } else if (args.endDate) {
            return withTenant.lte("issueDate", args.endDate);
          }
          return withTenant;
        });
    } else {
      baseQuery = ctx.db
        .query("invoices")
        .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId));
    }

    const result = await baseQuery.order("desc").paginate(args.paginationOpts);
    let filteredPage = result.page;

    // Apply additional filters not covered by the index
    if (args.customerId && args.status) {
      filteredPage = filteredPage.filter((inv) => inv.customerId === args.customerId);
    }
    if (args.customerId && (args.startDate || args.endDate)) {
      filteredPage = filteredPage.filter((inv) => {
        if (args.startDate && inv.issueDate < args.startDate) return false;
        if (args.endDate   && inv.issueDate > args.endDate)   return false;
        return true;
      });
    }

    if (args.search?.trim()) {
      const searchLower  = args.search.trim().toLowerCase();
      const customerIds  = [...new Set(filteredPage.map((inv) => inv.customerId))];
      const customers    = await Promise.all(customerIds.map((id) => ctx.db.get(id)));
      const customerMap  = new Map(
        customers.filter((c) => c !== null).map((c) => [c!._id, c!])
      );

      filteredPage = filteredPage.filter((inv) => {
        if (String(inv.invoiceNumber ?? "").includes(searchLower)) return true;
        if (inv.readableId.toLowerCase().includes(searchLower))    return true;
        const cust = customerMap.get(inv.customerId);
        if (cust && cust.name.toLowerCase().includes(searchLower)) return true;
        return false;
      });
    }

    const enrichedPage = await Promise.all(
      filteredPage.map(async (inv) => {
        const customer = await ctx.db.get(inv.customerId);
        return {
          ...inv,
          customerName:  customer?.name         ?? "Unknown",
          customerPhone: customer?.phone        ?? undefined,
          customerType:  customer?.customerType ?? "REGULAR",
        };
      })
    );

    return { ...result, page: enrichedPage };
  },
});

// ============================================================
// getRevenue
// ============================================================

export const getRevenue = tenantQuery({
  args: { startDate: v.number(), endDate: v.number() },
  handler: async (ctx, args, tenant) => {
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenantId_issueDate", (q) =>
        q.eq("tenantId", tenant.tenantId)
          .gte("issueDate", args.startDate)
          .lte("issueDate", args.endDate)
      )
      .collect();

    let totalRevenue = 0;
    for (const inv of invoices) {
      if (inv.status === "PAID") totalRevenue += inv.totalPrice;
    }

    return roundTo2(totalRevenue);
  },
});

// ============================================================
// previewLineCalculation
// ============================================================

export const previewLineCalculation = tenantQuery({
  args: {
    glassTypeId: v.id("glassTypes"),
    dimensions: v.object({
      width:         v.number(),
      height:        v.number(),
      measuringUnit: dimensionUnit,
    }),
    diameter: v.optional(v.number()),
    operations: v.optional(
      v.array(
        v.object({
          operationType:    operationTypeLabel,
          calculationMethod: v.optional(calculationMethodLabel),
          manualMeters:     v.optional(v.number()),
          manualPrice:      v.optional(v.number()),
        })
      )
    ),
  },
  handler: async (ctx, args, tenant) => {
    const glassType = await ctx.db.get(args.glassTypeId);
    verifyTenantOwnership(glassType, tenant.tenantId);

    const { width, height, measuringUnit } = args.dimensions;
    const widthM  = toMeters(width,  measuringUnit);
    const heightM = toMeters(height, measuringUnit);

    const areaM2  = calculateAreaM2(width, height, measuringUnit);
    const lengthM = calculateLengthM(width, height, measuringUnit);

    const quantityForPricing = glassType.pricingMethod === "LENGTH" ? lengthM : areaM2;
    const glassPrice = roundTo2(quantityForPricing * glassType.pricePerMeter);

    const diameterM = args.diameter != null
      ? toMeters(args.diameter, measuringUnit)
      : undefined;

    const operationsPreviews: Array<{
      operationTypeCode:    string;
      calculationMethodCode?: string;
      bevelingMeters?: number;
      ratePerMeter?:  number;
      calculatedPrice: number;
    }> = [];

    let totalOperationsPrice = 0;

    for (const opReq of args.operations ?? []) {
      const opInput: OperationInput = {
        operationTypeCode:     opReq.operationType.code,
        calculationMethodCode: opReq.calculationMethod?.code,
        manualMeters:          opReq.manualMeters,
        manualPrice:           opReq.manualPrice,
        diameterM,
      };

      const result = await calculateOperation(ctx, opInput, widthM, heightM, glassType.thickness, tenant.tenantId);

      operationsPreviews.push({
        operationTypeCode:     opReq.operationType.code,
        calculationMethodCode: opReq.calculationMethod?.code,
        bevelingMeters:        result.bevelingMeters,
        ratePerMeter:          result.ratePerMeter,
        calculatedPrice:       roundTo2(result.price),
      });

      totalOperationsPrice += result.price;
    }

    totalOperationsPrice = roundTo2(totalOperationsPrice);
    const lineTotal       = roundTo2(glassPrice + totalOperationsPrice);

    return {
      glassTypeName:       glassType.name,
      thickness:           glassType.thickness,
      pricingMethod:       glassType.pricingMethod,
      areaM2:              roundTo2(areaM2),
      lengthM:             roundTo2(lengthM),
      quantityForPricing:  roundTo2(quantityForPricing),
      glassUnitPrice:      glassType.pricePerMeter,
      glassPrice,
      operationsPreviews,
      totalOperationsPrice,
      lineTotal,
    };
  },
});
