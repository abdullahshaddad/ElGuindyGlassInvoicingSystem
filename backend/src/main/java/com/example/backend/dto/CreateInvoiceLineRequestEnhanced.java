package com.example.backend.dto;

import com.example.backend.models.enums.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Enhanced Create Invoice Line Request DTO
 * Supports new shataf types and farma formulas
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceLineRequestEnhanced {

    // Glass selection
    private Long glassTypeId;

    // Dimensions
    private Double width;
    private Double height;
    private DimensionUnit dimensionUnit;
    private Double diameter; // For WHEEL_CUT farma type

    // Cutting configuration
    private ShatafType shatafType; // New: Enhanced shataf type
    private FarmaType farmaType; // New: Farma formula type
    private CuttingType cuttingType; // Legacy: For backward compatibility

    // Manual price (for LASER, ROTATION, TABLEAUX)
    private Double manualCuttingPrice;

    /**
     * Validate the request
     */
    public void validate() {
        if (glassTypeId == null) {
            throw new IllegalArgumentException("نوع الزجاج مطلوب");
        }

        if (width == null || width <= 0) {
            throw new IllegalArgumentException("العرض مطلوب ويجب أن يكون أكبر من صفر");
        }

        if (height == null || height <= 0) {
            throw new IllegalArgumentException("الارتفاع مطلوب ويجب أن يكون أكبر من صفر");
        }

        if (dimensionUnit == null) {
            throw new IllegalArgumentException("وحدة القياس مطلوبة");
        }

        // Validate shataf type
        if (shatafType == null && cuttingType == null) {
            throw new IllegalArgumentException("نوع الشطف مطلوب");
        }

        // Validate farma type requirements
        if (farmaType != null) {
            if (farmaType.requiresDiameter() && (diameter == null || diameter <= 0)) {
                throw new IllegalArgumentException("القطر مطلوب لنوع الفرما: " + farmaType.getArabicName());
            }

            if (farmaType.isManual() && (manualCuttingPrice == null || manualCuttingPrice < 0)) {
                throw new IllegalArgumentException("سعر القطع اليدوي مطلوب للنوع: " + farmaType.getArabicName());
            }
        }

        // Validate manual price for manual shataf types
        if (shatafType != null && shatafType.isManualInput()) {
            if (manualCuttingPrice == null || manualCuttingPrice < 0) {
                throw new IllegalArgumentException("سعر القطع اليدوي مطلوب للنوع: " + shatafType.getArabicName());
            }
        }
    }

    /**
     * Check if this line uses legacy cutting type
     */
    public boolean isLegacy() {
        return shatafType == null && cuttingType != null;
    }

    /**
     * Get effective shataf type (convert from legacy if needed)
     */
    public ShatafType getEffectiveShatafType() {
        if (shatafType != null) {
            return shatafType;
        }

        // Convert legacy cutting type to shataf type
        if (cuttingType == CuttingType.LASER) {
            return null; // Laser is no longer a ShatafType
        } else if (cuttingType == CuttingType.SHATF) {
            // Default to KHARAZAN for legacy SHATF
            return ShatafType.KHARAZAN;
        }

        return null;
    }

    /**
     * Get effective farma type (default to NORMAL_SHATAF if not specified)
     */
    public FarmaType getEffectiveFarmaType() {
        if (farmaType != null) {
            return farmaType;
        }

        // Default to normal shataf for formula-based types
        if (shatafType != null && (shatafType.isFormulaBased() || isLegacy())) {
            return FarmaType.NORMAL_SHATAF;
        }

        return null;
    }
}
