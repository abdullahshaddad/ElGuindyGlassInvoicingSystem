import type { BevelingCalcType } from "../helpers/enums";

/**
 * Calculate beveling edge metres based on the perimeter formula.
 *
 * Formula reference:
 *   STRAIGHT            2 × (L + W)
 *   FRAME_HEAD          (L × 2) + (W × 3)
 *   2_FRAME_HEADS       (L × 2) + (W × 4)
 *   FRAME_SIDE          (L × 3) + (W × 2)
 *   2_FRAME_SIDES       (L × 4) + (W × 2)
 *   FRAME_HEAD_SIDE     3 × (L + W)
 *   2_FRAME_HEADS_SIDE  (L × 3) + (W × 4)
 *   2_FRAME_SIDES_HEAD  (L × 4) + (W × 3)
 *   FULL_FRAME          4 × (L + W)
 *   CIRCLE              6 × diameter
 *   CURVE_ARCH          manual input → 0
 *   PANELS              manual input → 0
 *
 * @param calcType  Perimeter formula code (matches calculationMethodCode in schema.ts)
 * @param length    Length in metres
 * @param width     Width in metres
 * @param diameter  Diameter in metres — required only for CIRCLE
 */
export function calculateBevelingMeters(
  calcType: BevelingCalcType,
  length: number,
  width: number,
  diameter?: number
): number {
  switch (calcType) {
    case "STRAIGHT":
      return 2 * (length + width);

    case "FRAME_HEAD":
      return (length * 2) + (width * 3);

    case "2_FRAME_HEADS":
      return (length * 2) + (width * 4);

    case "FRAME_SIDE":
      return (length * 3) + (width * 2);

    case "2_FRAME_SIDES":
      return (length * 4) + (width * 2);

    case "FRAME_HEAD_SIDE":
      return 3 * (length + width);

    case "2_FRAME_HEADS_SIDE":
      return (length * 3) + (width * 4);

    case "2_FRAME_SIDES_HEAD":
      return (length * 4) + (width * 3);

    case "FULL_FRAME":
      return 4 * (length + width);

    case "CIRCLE":
      if (diameter == null || diameter <= 0) {
        throw new Error("القطر مطلوب لحساب قطع العجلة");
      }
      return 6 * diameter;

    case "CURVE_ARCH":
    case "PANELS":
      // Manual-input: edge length supplied by the cashier via manualMeters
      return 0;

    default:
      throw new Error(`نوع حساب شطف غير معروف: ${calcType}`);
  }
}
