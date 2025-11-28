package com.example.backend.models;

import com.example.backend.models.enums.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Enhanced InvoiceLine Entity
 * Supports:
 * - Multiple operations per line (SHATAF, FARMA, LASER)
 * - Formula-based shataf types (KHARAZAN, SHAMBORLEH, etc.)
 * - Manual input types (LASER, ROTATION, TABLEAUX)
 * - Area-based types (SANDING)
 * - Farma formulas with different calculation methods
 */
@Entity
@Table(name = "invoice_line")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    @JsonBackReference
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "glass_type_id", nullable = false)
    private GlassType glassType;

    /**
     * Operations applied to this invoice line (NEW - supports multiple operations)
     */
    @OneToMany(mappedBy = "invoiceLine", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    @Builder.Default
    private List<InvoiceLineOperation> operations = new ArrayList<>();

    // ========== DIMENSION FIELDS ==========

    /**
     * Store original dimensions as entered by user
     */
    @Column(name = "width", nullable = false)
    private Double width;

    @Column(name = "height", nullable = false)
    private Double height;

    /**
     * Store the unit used for input
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "dimension_unit", nullable = false)
    @Builder.Default
    private DimensionUnit dimensionUnit = DimensionUnit.MM;

    /**
     * Diameter (for WHEEL_CUT farma type)
     */
    @Column(name = "diameter")
    private Double diameter;

    // ========== CALCULATED VALUES ==========

    /**
     * Calculated area in square meters
     */
    @Column(name = "area_m2")
    private Double areaM2;

    /**
     * Calculated length in meters (for length-based glass types)
     */
    @Column(name = "length_m")
    private Double lengthM;

    /**
     * Calculated shataf meters based on farma formula
     */
    @Column(name = "shataf_meters")
    private Double shatafMeters;

    // ========== CUTTING CONFIGURATION ==========

    /**
     * Legacy cutting type (kept for backward compatibility)
     * Will be deprecated in favor of shatafType
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "cutting_type")
    private CuttingType cuttingType;

    /**
     * New shataf type (formula-based, manual, or area-based)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "shataf_type")
    private ShatafType shatafType;

    /**
     * Farma type (determines calculation formula)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "farma_type")
    private FarmaType farmaType;

    /**
     * Manual cutting price (for LASER, ROTATION, TABLEAUX)
     */
    @Column(name = "manual_cutting_price")
    private Double manualCuttingPrice;

    /**
     * Calculated cutting price based on type and formula
     */
    @Column(name = "cutting_price")
    private Double cuttingPrice;

    /**
     * Rate per meter used for calculation (for reference)
     */
    @Column(name = "cutting_rate")
    private Double cuttingRate;

    // ========== PRICING ==========

    /**
     * Glass price (area/length × price per meter)
     */
    @Column(name = "glass_price")
    private Double glassPrice;

    /**
     * Total line price (glass + cutting)
     */
    @Column(name = "line_total")
    private Double lineTotal;

    // ========== CONSTRUCTORS ==========

    /**
     * Legacy constructor for backward compatibility
     */
    public InvoiceLine(Invoice invoice, GlassType glassType,
                       Double width, Double height,
                       DimensionUnit unit, CuttingType cuttingType) {
        this.invoice = invoice;
        this.glassType = glassType;
        this.width = width;
        this.height = height;
        this.dimensionUnit = unit != null ? unit : DimensionUnit.MM;
        this.cuttingType = cuttingType;

        // Set default farma type for legacy cutting types
        if (cuttingType == CuttingType.SHATF) {
            this.farmaType = FarmaType.NORMAL_SHATAF;
        }
    }

    /**
     * New constructor with enhanced shataf support
     */
    public InvoiceLine(Invoice invoice, GlassType glassType,
                       Double width, Double height,
                       DimensionUnit unit, ShatafType shatafType,
                       FarmaType farmaType, Double diameter) {
        this.invoice = invoice;
        this.glassType = glassType;
        this.width = width;
        this.height = height;
        this.dimensionUnit = unit != null ? unit : DimensionUnit.MM;
        this.shatafType = shatafType;
        this.farmaType = farmaType;
        this.diameter = diameter;
    }

    // ========== HELPER METHODS ==========

    /**
     * Get quantity used for pricing based on glass calculation method
     */
    @Transient
    public Double getQuantityForPricing() {
        if (glassType == null) return 0.0;

        CalculationMethod method = glassType.getCalculationMethod();
        if (method == null) method = CalculationMethod.AREA;

        return method == CalculationMethod.LENGTH ? lengthM : areaM2;
    }

    /**
     * Calculate dimensions in meters based on input unit
     */
    public void calculateDimensions() {
        if (width == null || height == null || dimensionUnit == null) {
            throw new IllegalStateException("الأبعاد ووحدة القياس مطلوبة");
        }

        // Convert to meters
        double widthM = dimensionUnit.toMeters(width);
        double heightM = dimensionUnit.toMeters(height);

        // Calculate area
        this.areaM2 = widthM * heightM;

        // Calculate length (for length-based pricing)
        this.lengthM = Math.max(widthM, heightM);

        // Store converted dimensions
        this.width = widthM;
        this.height = heightM;
    }

    /**
     * Calculate shataf meters based on farma formula
     */
    public void calculateShatafMeters() {
        if (farmaType == null) {
            // Default to normal shataf if not specified
            this.farmaType = FarmaType.NORMAL_SHATAF;
        }

        if (farmaType.isManual()) {
            // Manual types don't use formulas
            this.shatafMeters = 0.0;
            return;
        }

        // Use farma formula
        this.shatafMeters = farmaType.calculateShatafMeters(
                width,  // Already in meters after calculateDimensions()
                height, // Already in meters after calculateDimensions()
                diameter
        );
    }

    /**
     * Check if this line requires manual price input
     */
    @Transient
    public boolean requiresManualPrice() {
        return shatafType != null && shatafType.isManualInput();
    }

    /**
     * Validate line data before persistence
     */
    @PrePersist
    @PreUpdate
    public void validateLine() {
        // Validate dimensions
        if (width == null || width <= 0) {
            throw new IllegalStateException("العرض مطلوب ويجب أن يكون أكبر من صفر");
        }
        if (height == null || height <= 0) {
            throw new IllegalStateException("الارتفاع مطلوب ويجب أن يكون أكبر من صفر");
        }

        // Validate farma type requirements (legacy support)
        if (farmaType != null) {
            if (farmaType.requiresDiameter() && (diameter == null || diameter <= 0)) {
                throw new IllegalStateException("القطر مطلوب لنوع الفرما: " + farmaType.getArabicName());
            }
        }

        // Validate manual price for manual types (legacy support)
        if (shatafType != null && shatafType.isManualInput()) {
            if (manualCuttingPrice == null || manualCuttingPrice < 0) {
                throw new IllegalStateException("سعر القطع اليدوي مطلوب للنوع: " + shatafType.getArabicName());
            }
        }
    }

    // ========== OPERATION MANAGEMENT METHODS (NEW) ==========

    /**
     * Add an operation to this invoice line
     */
    public void addOperation(InvoiceLineOperation operation) {
        if (operations == null) {
            operations = new ArrayList<>();
        }
        operations.add(operation);
        operation.setInvoiceLine(this);
    }

    /**
     * Remove an operation from this invoice line
     */
    public void removeOperation(InvoiceLineOperation operation) {
        if (operations != null) {
            operations.remove(operation);
            operation.setInvoiceLine(null);
        }
    }

    /**
     * Calculate total cutting price from all operations
     */
    @Transient
    public Double calculateTotalOperationsPrice() {
        if (operations == null || operations.isEmpty()) {
            // Fallback to legacy cutting price if no operations
            return cuttingPrice != null ? cuttingPrice : 0.0;
        }
        return operations.stream()
                .mapToDouble(op -> op.getOperationPrice() != null ? op.getOperationPrice() : 0.0)
                .sum();
    }

    /**
     * Recalculate line total including glass price and all operations
     */
    public void recalculateLineTotal() {
        // Glass price (already set)
        double glassCost = glassPrice != null ? glassPrice : 0.0;

        // Operations price
        double operationsCost = calculateTotalOperationsPrice();

        // Update cutting price to match operations total
        this.cuttingPrice = operationsCost;

        // Update line total
        this.lineTotal = glassCost + operationsCost;
    }
}