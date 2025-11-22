package com.example.backend.dto;

import com.example.backend.models.ShatafRate;
import com.example.backend.models.enums.ShatafType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO for Shataf Rate responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShatafRateDTO {
    private Long id;
    private ShatafType shatafType;
    private String shatafTypeArabic;
    private Double minThickness;
    private Double maxThickness;
    private Double ratePerMeter;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Convert ShatafRate entity to DTO
     */
    public static ShatafRateDTO from(ShatafRate rate) {
        if (rate == null) return null;

        return ShatafRateDTO.builder()
            .id(rate.getId())
            .shatafType(rate.getShatafType())
            .shatafTypeArabic(rate.getShatafType().getArabicName())
            .minThickness(rate.getMinThickness())
            .maxThickness(rate.getMaxThickness())
            .ratePerMeter(rate.getRatePerMeter())
            .active(rate.getActive())
            .createdAt(rate.getCreatedAt())
            .updatedAt(rate.getUpdatedAt())
            .build();
    }

    /**
     * Convert list of ShatafRate entities to DTOs
     */
    public static List<ShatafRateDTO> fromList(List<ShatafRate> rates) {
        return rates.stream()
            .map(ShatafRateDTO::from)
            .collect(Collectors.toList());
    }
}

/**
 * Response DTO for rate calculation preview
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class ShatafRateCalculationResponse {
    private ShatafType shatafType;
    private String shatafTypeArabic;
    private Double thickness;
    private Double ratePerMeter;
    private Double shatafMeters;
    private Double totalPrice;
    private String formula;
    private String calculation;
}

