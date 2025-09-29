package com.example.backend.models;

import com.example.backend.models.enums.CalculationMethod;
import com.example.backend.models.enums.CuttingType;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Data
@Builder
@AllArgsConstructor
public class InvoiceLine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "glass_type_id", nullable = false)
    private GlassType glassType;

    @Column(nullable = false)
    private Double width;

    @Column(nullable = false)
    private Double height;

    @Column(name = "calculated_quantity", nullable = false)
    private Double calculatedQuantity; // This will be either area (m²) or length (m) based on glass type

    @Column(name = "area_m2") // Keep for backward compatibility and display
    private Double areaM2;

    @Column(name = "length_m") // For length-based calculations
    private Double lengthM;

    @Enumerated(EnumType.STRING)
    @Column(name = "cutting_type", nullable = false)
    private CuttingType cuttingType;

    @Column(name = "cutting_price", nullable = false)
    private Double cuttingPrice = 0.0;

    @Column(name = "line_total", nullable = false)
    private Double lineTotal = 0.0;

    @OneToMany(mappedBy = "invoiceLine", cascade = CascadeType.ALL)
    private List<CuttingDetail> cuttingDetails;

    public InvoiceLine(Invoice invoice, GlassType glassType, Double width, Double height, CuttingType cuttingType) {
        this.invoice = invoice;
        this.glassType = glassType;
        this.width = width;
        this.height = height;
        calculateQuantities();
        this.cuttingType = cuttingType;
    }

    public InvoiceLine() {
    }


    public void setWidth(Double width) {
        this.width = width;
        calculateQuantities();

    }

    public void setHeight(Double height) {
        this.height = height;
        calculateQuantities();

    }


    private void updateArea() {
        if (width != null && height != null) {
            this.areaM2 = width * height;
        }
    }
    private void calculateQuantities() {
        if (width != null && height != null) {
            this.areaM2 = width * height;

            if (glassType != null && glassType.getCalculationMethod() == CalculationMethod.LENGTH) {
                this.lengthM = Math.max(width, height);
                this.calculatedQuantity = this.lengthM;
            } else {
                this.lengthM = null;
                this.calculatedQuantity = this.areaM2; // Always set calculatedQuantity
            }
        } else {
            // Handle null width/height case
            this.calculatedQuantity = 0.0;
            this.areaM2 = 0.0;
            this.lengthM = null;
        }
    }
              /**
        * Get the quantity to use for pricing calculation
        * @return calculated quantity (either area or length based on glass type)
        */
              public Double getQuantityForPricing() {
                  return calculatedQuantity != null ? calculatedQuantity : areaM2;
              }
  
              /**
        * Get display text for the calculation method used
        * @return human-readable description of how this line was calculated
        */
              public String getCalculationDescription() {
                  if (glassType != null && glassType.getCalculationMethod() == CalculationMethod.LENGTH) {
                          return String.format("طول: %.2f متر", lengthM);
                      } else {
                          return String.format("مساحة: %.2f متر مربع", areaM2);
                      }
              }
}
