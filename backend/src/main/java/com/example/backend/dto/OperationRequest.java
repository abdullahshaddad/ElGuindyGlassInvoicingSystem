package com.example.backend.dto;

import com.example.backend.models.enums.FarmaType;
import com.example.backend.models.enums.OperationType;
import com.example.backend.models.enums.ShatafType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Operation Request DTO
 * Represents a single operation (SHATAF, FARMA, or LASER) to be added to an invoice line
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationRequest {

    /**
     * Unique ID for this operation (frontend-generated, for tracking)
     */
    private String id;

    /**
     * Type of operation (SHATAF, FARMA, LASER)
     */
    @NotNull(message = "Operation type is required")
    private OperationType type;

    // ========== SHATAF-SPECIFIC FIELDS ==========

    /**
     * Shataf type (required for SHATAF operations)
     */
    private ShatafType shatafType;

    /**
     * Farma type (for SHATAF or FARMA operations)
     */
    private FarmaType farmaType;

    /**
     * Diameter (for farma types that require it, like WHEEL_CUT)
     */
    @PositiveOrZero(message = "Diameter must be positive or zero")
    private Double diameter;

    /**
     * Manual cutting price (for shataf types that require manual input)
     */
    @PositiveOrZero(message = "Manual cutting price cannot be negative")
    private Double manualCuttingPrice;

    // ========== LASER-SPECIFIC FIELDS ==========

    /**
     * Laser type (NORMAL, DEEP, ENGRAVE, POLISH)
     */
    private String laserType;

    /**
     * Manual price for laser operations or farma manual types
     */
    @PositiveOrZero(message = "Manual price cannot be negative")
    private Double manualPrice;

    /**
     * Notes for this operation (optional)
     */
    private String notes;

    /**
     * Validate that required fields are present based on operation type
     */
    public void validate() {
        if (type == null) {
            throw new IllegalArgumentException("نوع العملية مطلوب");
        }

        switch (type) {
            case SHATAF:
                if (shatafType == null) {
                    throw new IllegalArgumentException("نوع الشطف مطلوب لعمليات الشطف");
                }
                // Check if farma is required for this shataf type
                if (shatafType.isFormulaBased() && farmaType == null) {
                    throw new IllegalArgumentException(
                            "نوع الفارمة مطلوب لنوع الشطف: " + shatafType.getArabicName()
                    );
                }
                // Check if manual price is required
                if (shatafType.isManualInput() && (manualCuttingPrice == null || manualCuttingPrice < 0)) {
                    throw new IllegalArgumentException(
                            "سعر القطع اليدوي مطلوب للنوع: " + shatafType.getArabicName()
                    );
                }
                // Check if diameter is required
                if (farmaType != null && farmaType.requiresDiameter() && (diameter == null || diameter <= 0)) {
                    throw new IllegalArgumentException(
                            "القطر مطلوب لنوع الفارمة: " + farmaType.getArabicName()
                    );
                }
                break;

            case FARMA:
                if (farmaType == null) {
                    throw new IllegalArgumentException("نوع الفارمة مطلوب لعمليات الفارمة");
                }
                // Check if diameter is required
                if (farmaType.requiresDiameter() && (diameter == null || diameter <= 0)) {
                    throw new IllegalArgumentException(
                            "القطر مطلوب لنوع الفارمة: " + farmaType.getArabicName()
                    );
                }
                // Check if manual price is required
                if (farmaType.isManual() && (manualPrice == null || manualPrice < 0)) {
                    throw new IllegalArgumentException(
                            "السعر اليدوي مطلوب لنوع الفارمة: " + farmaType.getArabicName()
                    );
                }
                break;

            case LASER:
                if (laserType == null || laserType.trim().isEmpty()) {
                    throw new IllegalArgumentException("نوع الليزر مطلوب لعمليات الليزر");
                }
                if (manualPrice == null || manualPrice < 0) {
                    throw new IllegalArgumentException("السعر مطلوب لعمليات الليزر");
                }
                break;
        }
    }
}
