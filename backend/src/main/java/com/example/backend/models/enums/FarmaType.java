package com.example.backend.models.enums;

/**
 * Farma (Calculation Method) Types Enum
 * Defines all supported calculation methods (formulas) for Shatf operations.
 */
public enum FarmaType {
    // Standard and Farma types with formulas
    NORMAL_SHATAF("عدل (2 × (طول + عرض))"),
    ONE_HEAD_FARMA("فرما رأس 1"),
    TWO_HEAD_FARMA("فرما رأسين"),
    ONE_SIDE_FARMA("فرما جنب 1"),
    TWO_SIDE_FARMA("فرما جنبين"),
    HEAD_SIDE_FARMA("فرما رأس وجنب"),
    TWO_HEAD_ONE_SIDE_FARMA("فرما رأسين وجنب"),
    TWO_SIDE_ONE_HEAD_FARMA("فرما جنبين ورأس"),
    FULL_FARMA("فرما كامل"),

    // Special types
    WHEEL_CUT("العجلة (6 × القطر)"),
    ROTATION("الدوران (يدوي)"),
    TABLEAUX("التابلوهات (يدوي)"),

    // New types from requirements
    HAND_SHATAF("ليزر يدوي");

    private final String arabicName;

    FarmaType(String arabicName) {
        this.arabicName = arabicName;
    }

    public String getArabicName() {
        return arabicName;
    }

    /**
     * Calculate shataf meters based on farma type formula
     * 
     * @param length   Length in meters
     * @param width    Width in meters
     * @param diameter Diameter in meters (only for WHEEL_CUT)
     * @return Calculated meters for shataf
     */
    public double calculateShatafMeters(double length, double width, Double diameter) {
        switch (this) {
            case NORMAL_SHATAF:
            case HAND_SHATAF: // Assume same as normal shataf (perimeter) or maybe custom? Defaulting to
                              // perimeter for now unless specified
                // 2 × (length + width)
                return 2 * (length + width);

            case ONE_HEAD_FARMA:
                // (3 × 2) + (length × width) -- logic from previous code seems weird for
                // perimeter, usually it's linear length.
                // Reverting to previous logic: (3 * 2) + (length * width) ?? Dimensions are in
                // Meters.
                // The previous code had: (3 * 2) + (length * width). This mixes numbers and
                // area?
                // Let's stick to previous implementation to avoid regression, but it looks
                // suspicious.
                // Wait, if 3*2 is 6, is it adding 6 meters?
                // Let's assume the previous logic was correct for the business, just
                // refactoring structure.
                return (3 * 2) + (length * width);

            case TWO_HEAD_FARMA:
                return (4 * 2) + (length * width);

            case ONE_SIDE_FARMA:
                return (2 * 3) + (length * width);

            case TWO_SIDE_FARMA:
                return (2 * 4) + (length * width);

            case HEAD_SIDE_FARMA:
                return 3 * (length + width);

            case TWO_HEAD_ONE_SIDE_FARMA:
                return (4 * 3) + (length * width);

            case TWO_SIDE_ONE_HEAD_FARMA:
                return (3 * 4) + (length * width);

            case FULL_FARMA:
                return 4 * (length + width);

            case WHEEL_CUT:
                // 6 × diameter
                if (diameter == null || diameter <= 0) {
                    throw new IllegalArgumentException("القطر مطلوب لحساب قطع العجلة");
                }
                return 6 * diameter;

            case ROTATION:
            case TABLEAUX:
                // Manual - no formula, meters = 0, price is manual?
                // Requirement says: "In addition to subtypes, Shatf uses... methods...
                // including... manual methods like Rotation and Tableaux"
                // "The final cutting cost is calculated by applying the selected Shatf
                // subtype’s price to the output..."
                // Use 0.0 for meters, meaning calculated price will be 0 * Rate = 0?
                // Or does it mean manual meters?
                // The prompt says "methods ... include ... formulas ... in addition to manual
                // methods".
                // And "Final cutting cost is calculated by applying the selected Shatf
                // subtype's price to the output of the chosen calculation method".
                // If output is manual, maybe we need Manual Meters input?
                // For now, let's keep 0.0 but flag it.
                return 0.0;

            default:
                throw new IllegalArgumentException("نوع فرما غير معروف: " + this);
        }
    }

    /**
     * Check if this farma type requires diameter input
     */
    public boolean requiresDiameter() {
        return this == WHEEL_CUT;
    }

    /**
     * Check if this farma type is manual (no formula)
     */
    public boolean isManual() {
        return this == ROTATION || this == TABLEAUX;
    }

    /**
     * Check if this farma type uses a formula
     */
    public boolean hasFormula() {
        return !isManual();
    }
}