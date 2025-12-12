package com.example.backend.models;

import com.example.backend.models.enums.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * InvoiceLineOperation Entity
 * Represents a single operation (SHATAF, FARMA, or LASER) on an invoice line.
 * Multiple operations can be applied to a single invoice line.
 */
@Entity
@Table(name = "invoice_line_operation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceLineOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_line_id", nullable = false)
    @JsonBackReference
    private InvoiceLine invoiceLine;

    /**
     * Type of operation (SHATAF, FARMA, LASER)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "operation_type", nullable = false)
    private OperationType operationType;

    // ========== SHATAF-SPECIFIC FIELDS ==========

    /**
     * Shataf type (only for SHATAF operations)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "shataf_type")
    private ShatafType shatafType;

    /**
     * Farma type (can be used with SHATAF or standalone FARMA operations)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "farma_type")
    private FarmaType farmaType;

    /**
     * Diameter (for farma types that require it, like WHEEL_CUT)
     */
    @Column(name = "diameter")
    private Double diameter;

    /**
     * Manual cutting price (for shataf types that require manual input)
     */
    @Column(name = "manual_cutting_price")
    private Double manualCuttingPrice;

    // ========== LASER-SPECIFIC FIELDS ==========

    /**
     * Laser type (NORMAL, DEEP, ENGRAVE, POLISH)
     * Stored as string to allow frontend-defined types
     */
    @Column(name = "laser_type")
    private String laserType;

    /**
     * Manual price for laser operations
     */
    @Column(name = "manual_price")
    private Double manualPrice;

    /**
     * Notes for this operation (optional, mainly for laser)
     */
    @Column(name = "notes", length = 1000)
    private String notes;

    // ========== CALCULATED FIELDS ==========

    /**
     * Calculated shataf meters (for formula-based operations)
     */
    @Column(name = "shataf_meters")
    private Double shatafMeters;

    /**
     * Rate per meter used for calculation (for reference)
     */
    @Column(name = "rate_per_meter")
    private Double ratePerMeter;

    /**
     * Final calculated price for this operation
     */
    @Column(name = "operation_price", nullable = false)
    @Builder.Default
    private Double operationPrice = 0.0;

    // ========== HELPER METHODS ==========

    /**
     * Check if this operation requires manual price input
     */
    @Transient
    public boolean requiresManualPrice() {
        if (operationType == OperationType.LASER) {
            return true;
        }
        if (operationType == OperationType.SHATAF && shatafType != null) {
            return shatafType.isManualInput();
        }
        if (operationType == OperationType.FARMA && farmaType != null) {
            return farmaType.isManual();
        }
        return false;
    }

    /**
     * Calculate shataf meters based on farma formula
     */
    public void calculateShatafMeters(Double width, Double height) {
        if (farmaType == null) {
            this.shatafMeters = 0.0;
            return;
        }

        if (farmaType.isManual()) {
            // Manual types don't use formulas
            this.shatafMeters = 0.0;
            return;
        }

        // Use farma formula (width and height should be in meters)
        this.shatafMeters = farmaType.calculateShatafMeters(width, height, diameter);
    }

    /**
     * Validate operation data before persistence
     */
    @PrePersist
    @PreUpdate
    public void validateOperation() {
        // Validate operation type is set
        if (operationType == null) {
            throw new IllegalStateException("نوع العملية مطلوب");
        }

        // Validate type-specific fields
        switch (operationType) {
            case SHATAF:
                if (shatafType == null) {
                    throw new IllegalStateException("نوع الشطف مطلوب لعمليات الشطف");
                }
                // Check if manual price is required for this shataf type
                if (shatafType.isManualInput() && (manualCuttingPrice == null || manualCuttingPrice < 0)) {
                    throw new IllegalStateException("سعر القطع اليدوي مطلوب للنوع: " + shatafType.getArabicName());
                }
                // Check if farma is required
                if (shatafType.isFormulaBased() && farmaType == null) {
                    throw new IllegalStateException("نوع الفارمة مطلوب لنوع الشطف: " + shatafType.getArabicName());
                }
                break;

            case FARMA:
                if (farmaType == null) {
                    throw new IllegalStateException("نوع الفارمة مطلوب لعمليات الفارمة");
                }
                // Check if diameter is required
                if (farmaType.requiresDiameter() && (diameter == null || diameter <= 0)) {
                    throw new IllegalStateException("القطر مطلوب لنوع الفارمة: " + farmaType.getArabicName());
                }
                // Check if manual price is required
                if (farmaType.isManual() && (manualPrice == null || manualPrice < 0)) {
                    throw new IllegalStateException("السعر اليدوي مطلوب لنوع الفارمة: " + farmaType.getArabicName());
                }
                break;

            case LASER:
                if (laserType == null || laserType.trim().isEmpty()) {
                    throw new IllegalStateException("نوع الليزر مطلوب لعمليات الليزر");
                }
                if (manualPrice == null || manualPrice < 0) {
                    throw new IllegalStateException("السعر مطلوب لعمليات الليزر");
                }
                break;
        }

        // Validate operation price
        if (operationPrice == null || operationPrice < 0) {
            throw new IllegalStateException("سعر العملية يجب أن يكون صفر أو أكبر");
        }
    }

    /**
     * Get a human-readable description of this operation
     */
    @Transient
    public String getDescription() {
        StringBuilder desc = new StringBuilder(operationType.getArabicName());

        switch (operationType) {
            case SHATAF:
                if (shatafType != null) {
                    desc.append(" - ").append(shatafType.getArabicName());
                }
                if (farmaType != null) {
                    desc.append(" (").append(farmaType.getArabicName()).append(")");
                }
                break;
            case FARMA:
                if (farmaType != null) {
                    desc.append(" - ").append(farmaType.getArabicName());
                }
                break;
            case LASER:
                if (laserType != null) {
                    desc.append(" - ").append(laserType);
                }
                break;
        }

        return desc.toString();
    }
}
