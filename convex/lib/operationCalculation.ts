import { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import {
  BevelingType,
  isBevelingFormulaBased,
  isBevelingManualInput,
  isBevelingAreaBased,
  isBevelingCalcManual,
} from "../helpers/enums";
import { calculateBevelingMeters } from "./bevelingFormulas";
import type { BevelingCalcType } from "../helpers/enums";

// ============================================================
// Interfaces
// ============================================================

export interface OperationInput {
  /** Code from operationTypeCode validator (e.g. "KHARZAN", "LASER", "SANDING") */
  operationTypeCode: string;
  /** Code from calculationMethodCode validator (e.g. "STRAIGHT", "CIRCLE") */
  calculationMethodCode?: string;
  /** Manually entered edge length in metres (CURVE_ARCH / PANELS calculation methods) */
  manualMeters?: number;
  /** Manual price override — used for LASER and manual-input beveling types */
  manualPrice?: number;
  /** Diameter in metres — required for CIRCLE calculation method */
  diameterM?: number;
}

export interface OperationResult {
  /** Beveling edge length in metres (when formula-derived) */
  bevelingMeters?: number;
  /** Rate per metre used in pricing */
  ratePerMeter?: number;
  /** Final price for this operation (EGP) */
  price: number;
}

// ============================================================
// Default beveling rates (fallback when no DB row is found)
// ============================================================

const DEFAULT_BEVELING_RATES: Record<BevelingType, number> = {
  KHARZAN:      12.0,
  CHAMBOURLIEH: 15.0,
  BEVEL_1_CM:    8.0,
  BEVEL_2_CM:   10.0,
  BEVEL_3_CM:   12.0,
  JULIA:        18.0,
  SANDING:      20.0,
  LASER:         0.0,
  CURVE_ARCH:    0.0,
  PANELS:        0.0,
};

// ============================================================
// Rate lookup (tenant-scoped)
// ============================================================

async function getRateForThickness(
  ctx: QueryCtx,
  bevelingType: BevelingType,
  thickness: number,
  tenantId?: Id<"tenants">
): Promise<number> {
  let rates;
  if (tenantId) {
    rates = await ctx.db
      .query("bevelingRates")
      .withIndex("by_tenantId_bevelingType_active", (q) =>
        q.eq("tenantId", tenantId).eq("bevelingType", bevelingType).eq("active", true)
      )
      .collect();
  } else {
    rates = await ctx.db
      .query("bevelingRates")
      .withIndex("by_bevelingType_active", (q) =>
        q.eq("bevelingType", bevelingType).eq("active", true)
      )
      .collect();
  }

  const match = rates.find(
    (r) => thickness >= r.minThickness && thickness <= r.maxThickness
  );

  return match?.ratePerMeter ?? DEFAULT_BEVELING_RATES[bevelingType] ?? 0;
}

// ============================================================
// Main entry point
// ============================================================

/**
 * Calculate the price for a single operation on a glass line.
 *
 * Decision tree:
 *  LASER          → manualPrice (always manual)
 *  SANDING        → area (widthM × heightM) × rate
 *  Other beveling → depends on calculationMethod:
 *    CURVE_ARCH / PANELS → manualPrice (manual total)
 *    CIRCLE              → 6 × diameterM × rate
 *    formula method      → calculateBevelingMeters() × rate
 */
export async function calculateOperation(
  ctx: QueryCtx,
  input: OperationInput,
  widthM: number,
  heightM: number,
  thickness: number,
  tenantId?: Id<"tenants">
): Promise<OperationResult> {
  const opCode = input.operationTypeCode;

  // ── LASER ────────────────────────────────────────────────────────────────
  if (opCode === "LASER") {
    return { price: input.manualPrice ?? 0 };
  }

  // ── SANDING (area-based) ─────────────────────────────────────────────────
  if (opCode === "SANDING") {
    const areaM2 = widthM * heightM;
    const rate = await getRateForThickness(ctx, "SANDING", thickness, tenantId);
    return { ratePerMeter: rate, price: areaM2 * rate };
  }

  // ── Beveling types (KHARZAN, CHAMBOURLIEH, BEVEL_x_CM, JULIA) ───────────
  const bevelingType = opCode as BevelingType;

  // Manual-input beveling types (CURVE_ARCH, PANELS as the *operation* type)
  if (isBevelingManualInput(bevelingType)) {
    return { price: input.manualPrice ?? 0 };
  }

  // For formula-based and area-based types, calculationMethod is required
  if (!input.calculationMethodCode) {
    throw new Error(`طريقة الحساب مطلوبة لنوع العملية ${opCode}`);
  }

  const calcCode = input.calculationMethodCode as BevelingCalcType;

  // CURVE_ARCH / PANELS as the *calculation method* → manual meters × rate
  if (isBevelingCalcManual(calcCode)) {
    const bevelingMeters = input.manualMeters ?? 0;
    const rate = await getRateForThickness(ctx, bevelingType, thickness, tenantId);
    return { bevelingMeters, ratePerMeter: rate, price: bevelingMeters * rate };
  }

  // CIRCLE → 6 × diameter × rate
  if (calcCode === "CIRCLE") {
    if (!input.diameterM || input.diameterM <= 0) {
      throw new Error("القطر مطلوب لحساب قطع العجلة");
    }
    const bevelingMeters = 6 * input.diameterM;
    const rate = await getRateForThickness(ctx, bevelingType, thickness, tenantId);
    return { bevelingMeters, ratePerMeter: rate, price: bevelingMeters * rate };
  }

  // Formula-based → calculateBevelingMeters() × rate
  const bevelingMeters = calculateBevelingMeters(calcCode, widthM, heightM, input.diameterM);
  const rate = await getRateForThickness(ctx, bevelingType, thickness, tenantId);
  return { bevelingMeters, ratePerMeter: rate, price: bevelingMeters * rate };
}
