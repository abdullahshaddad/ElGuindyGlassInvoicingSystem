package com.example.backend.models;

import jakarta.persistence.*;
import jakarta.persistence.Id;
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

    public GlassType(String name, Double thickness, String color, Double pricePerMeter) {
        this.name = name;
        this.thickness = thickness;
        this.color = color;
        this.pricePerMeter = pricePerMeter;
    }


}
