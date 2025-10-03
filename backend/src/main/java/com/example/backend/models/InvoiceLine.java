package com.example.backend.models;

import com.example.backend.models.enums.CalculationMethod;
import com.example.backend.models.enums.CuttingType;
import com.example.backend.models.enums.DimensionUnit;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    // Store original dimensions as entered by user
    @Column(name = "width", nullable = false)
    private Double width;

    @Column(name = "height", nullable = false)
    private Double height;

    // Store the unit used for input
    @Enumerated(EnumType.STRING)
    @Column(name = "dimension_unit", nullable = false)
    private DimensionUnit dimensionUnit = DimensionUnit.MM;

    // Calculated values in standard units
    @Column(name = "area_m2")
    private Double areaM2;

    @Column(name = "length_m")
    private Double lengthM;

    @Transient
    private Double calculatedQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "cutting_type", nullable = false)
    private CuttingType cuttingType;

    @Column(name = "cutting_price")
    private Double cuttingPrice;

    @Column(name = "line_total")
    private Double lineTotal;

    public InvoiceLine(Invoice invoice, GlassType glassType,
                       Double width, Double height,
                       DimensionUnit unit, CuttingType cuttingType) {
        this.invoice = invoice;
        this.glassType = glassType;
        this.width = width;
        this.height = height;
        this.dimensionUnit = unit != null ? unit : DimensionUnit.MM;
        this.cuttingType = cuttingType;
        calculateQuantities();
    }

    @PrePersist
    @PreUpdate
    private void calculateQuantities() {
        if (width != null && height != null && dimensionUnit != null) {
            // Convert to meters for calculations
            double widthInMeters = dimensionUnit.toMeters(width);
            double heightInMeters = dimensionUnit.toMeters(height);

            this.areaM2 = widthInMeters * heightInMeters;

            if (glassType != null && glassType.getCalculationMethod() == CalculationMethod.LENGTH) {
                this.lengthM = Math.max(widthInMeters, heightInMeters);
                this.calculatedQuantity = this.lengthM;
            } else {
                this.lengthM = null;
                this.calculatedQuantity = this.areaM2;
            }
        }
    }

    public Double getQuantityForPricing() {
        return calculatedQuantity != null ? calculatedQuantity : 0.0;
    }

    // Helper method to get width in specific unit
    public Double getWidthInUnit(DimensionUnit targetUnit) {
        if (targetUnit == dimensionUnit) return width;
        double widthInMeters = dimensionUnit.toMeters(width);
        return targetUnit.fromMeters(widthInMeters);
    }

    // Helper method to get height in specific unit
    public Double getHeightInUnit(DimensionUnit targetUnit) {
        if (targetUnit == dimensionUnit) return height;
        double heightInMeters = dimensionUnit.toMeters(height);
        return targetUnit.fromMeters(heightInMeters);
    }
}