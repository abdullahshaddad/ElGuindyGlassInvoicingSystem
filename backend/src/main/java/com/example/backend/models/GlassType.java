package com.example.backend.models;

import com.example.backend.models.enums.CalculationMethod;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlassType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double thickness;

    private String color;

    @Column(name = "price_per_meter", nullable = false)
    private Double pricePerMeter;

    @Enumerated(EnumType.STRING)
    @Column(name = "calculation_method", nullable = false)
    @Builder.Default
    private CalculationMethod calculationMethod = CalculationMethod.AREA;

    @Column(name = "active")
    @Builder.Default
    private Boolean active = true;

    public GlassType(String name, Double thickness, String color, Double pricePerMeter) {
        this.name = name;
        this.thickness = thickness;
        this.color = color;
        this.pricePerMeter = pricePerMeter;
        this.calculationMethod = CalculationMethod.AREA; // Default to area calculation
        this.active = true;
    }
}
