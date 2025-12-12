package com.example.backend.models.enums;

/**
 * Shataf (Cutting) Types Enum
 * Defines all supported shataf types with their Arabic names.
 * These are strictly "Material/Finish" types that have a price per meter/m2
 * based on thickness.
 * Calculation method (Formula) is determined by FarmaType.
 */
public enum ShatafType {
    // Formula-based types (depend on thickness)
    KHARAZAN("خرازان", true, false, false),
    SHAMBORLEH("شمبورليه", true, false, false),
    ONE_CM("1 سم", true, false, false),
    TWO_CM("2 سم", true, false, false),
    THREE_CM("3 سم", true, false, false),
    JULIA("جوليا", true, false, false),

    // Area-based type
    SANDING("صنفرة", false, false, true),

    // Manual types (from frontend requirements)
    LASER("ليزر (يدوي)", false, true, false),
    ROTATION("دوران (يدوي)", false, true, false),
    TABLEAUX("تابلوهات (يدوي)", false, true, false);

    private final String arabicName;
    private final boolean formulaBased;
    private final boolean manualInput;
    private final boolean areaBased;

    ShatafType(String arabicName, boolean formulaBased, boolean manualInput, boolean areaBased) {
        this.arabicName = arabicName;
        this.formulaBased = formulaBased;
        this.manualInput = manualInput;
        this.areaBased = areaBased;
    }

    public String getArabicName() {
        return arabicName;
    }

    public boolean isFormulaBased() {
        return formulaBased;
    }

    public boolean isManualInput() {
        return manualInput;
    }

    public boolean isAreaBased() {
        return areaBased;
    }

    /**
     * Check if this shataf type requires thickness-based pricing
     */
    public boolean requiresThicknessRate() {
        return formulaBased || areaBased;
    }

    /**
     * Check if this shataf type requires manual price input
     */
    public boolean requiresManualPrice() {
        return manualInput;
    }

    /**
     * Check if this shataf type uses area-based calculation
     */
    public boolean usesAreaCalculation() {
        return areaBased;
    }
}