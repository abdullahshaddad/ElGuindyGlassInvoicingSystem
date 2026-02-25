import { DIMENSION_CONVERSION_TO_METERS } from "./enums";
import type { DimensionUnit } from "./enums";

/**
 * Convert a value from the given unit to meters.
 * Port of DimensionUnit.toMeters(value) from Java.
 */
export function toMeters(value: number, unit: DimensionUnit): number {
  return value * DIMENSION_CONVERSION_TO_METERS[unit];
}

/**
 * Convert a value in meters back to the specified unit.
 * Port of DimensionUnit.fromMeters(valueInMeters) from Java.
 */
export function fromMeters(valueInMeters: number, unit: DimensionUnit): number {
  return valueInMeters / DIMENSION_CONVERSION_TO_METERS[unit];
}

/**
 * Calculate area in square meters from width/height in given unit.
 */
export function calculateAreaM2(
  width: number,
  height: number,
  unit: DimensionUnit
): number {
  const widthM = toMeters(width, unit);
  const heightM = toMeters(height, unit);
  return widthM * heightM;
}

/**
 * Calculate length in meters (max of width/height).
 * Used for LENGTH-based glass type pricing.
 */
export function calculateLengthM(
  width: number,
  height: number,
  unit: DimensionUnit
): number {
  const widthM = toMeters(width, unit);
  const heightM = toMeters(height, unit);
  return Math.max(widthM, heightM);
}

/**
 * Round a number to 2 decimal places using banker's rounding.
 */
export function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}
