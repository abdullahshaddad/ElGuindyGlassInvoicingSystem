package com.example.backend.models;

import com.example.backend.models.enums.CuttingType;
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
@Table(name = "cutting_rates")
public class CuttingRate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CuttingType cuttingType;

    @Column(name = "min_thickness", nullable = false)
    private Double minThickness;

    @Column(name = "max_thickness", nullable = false)
    private Double maxThickness;

    @Column(name = "rate_per_meter", nullable = false)
    private Double ratePerMeter;

    @Column(nullable = false)
    private Boolean active = true;
}