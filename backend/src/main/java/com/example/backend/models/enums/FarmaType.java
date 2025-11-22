package com.example.backend.models.enums;

/**
 * Farma (Frame) Types Enum
 * Defines all supported farma types with their Arabic names and formulas
 */
public enum FarmaType {
    // Standard and Farma types with formulas
    NORMAL_SHATAF("شطف عادي"),
    ONE_HEAD_FARMA("فرما رأس 1"),
    TWO_HEAD_FARMA("فرما رأسين"),
    ONE_SIDE_FARMA("فرما جنب 1"),
    TWO_SIDE_FARMA("فرما جنبين"),
    HEAD_SIDE_FARMA("فرما رأس وجنب"),
    TWO_HEAD_ONE_SIDE_FARMA("فرما رأسين وجنب"),
    TWO_SIDE_ONE_HEAD_FARMA("فرما جنبين ورأس"),
    FULL_FARMA("فرما كامل"),
    
    // Special types
    WHEEL_CUT("العجلة"),
    ROTATION("الدوران"),
    TABLEAUX("التابلوهات");

    private final String arabicName;

    FarmaType(String arabicName) {
        this.arabicName = arabicName;
    }

    public String getArabicName() {
        return arabicName;
    }

    /**
     * Calculate shataf meters based on farma type formula
     * @param length Length in meters
     * @param width Width in meters
     * @param diameter Diameter in meters (only for WHEEL_CUT)
     * @return Calculated meters for shataf
     */
    public double calculateShatafMeters(double length, double width, Double diameter) {
        switch (this) {
            case NORMAL_SHATAF:
                // 2 × (length + width)
                return 2 * (length + width);
                
            case ONE_HEAD_FARMA:
                // (3 × 2) + (length × width)
                return (3 * 2) + (length * width);
                
            case TWO_HEAD_FARMA:
                // (4 × 2) + (length × width)
                return (4 * 2) + (length * width);
                
            case ONE_SIDE_FARMA:
                // (2 × 3) + (length × width)
                return (2 * 3) + (length * width);
                
            case TWO_SIDE_FARMA:
                // (2 × 4) + (length × width)
                return (2 * 4) + (length * width);
                
            case HEAD_SIDE_FARMA:
                // 3 × (length + width)
                return 3 * (length + width);
                
            case TWO_HEAD_ONE_SIDE_FARMA:
                // (4 × 3) + (length × width)
                return (4 * 3) + (length * width);
                
            case TWO_SIDE_ONE_HEAD_FARMA:
                // (3 × 4) + (length × width)
                return (3 * 4) + (length * width);
                
            case FULL_FARMA:
                // 4 × (length + width)
                return 4 * (length + width);
                
            case WHEEL_CUT:
                // 6 × diameter
                if (diameter == null || diameter <= 0) {
                    throw new IllegalArgumentException("القطر مطلوب لحساب قطع العجلة");
                }
                return 6 * diameter;
                
            case ROTATION:
            case TABLEAUX:
                // Manual - no formula
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