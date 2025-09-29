package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for GlassType responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlassTypeDTO {
    private Long id;
    private String name;
    private String color;
    private Double thickness;
    private Double pricePerMeter;
    private String calculationMethod;

    /**
     * Convert GlassType entity to DTO
     */
    public static GlassTypeDTO from(com.example.backend.models.GlassType glassType) {
        if (glassType == null) {
            return null;
        }

        return GlassTypeDTO.builder()
                .id(glassType.getId())
                .name(glassType.getName())
                .color(glassType.getColor())
                .thickness(glassType.getThickness())
                .pricePerMeter(glassType.getPricePerMeter())
                .calculationMethod(glassType.getCalculationMethod() != null
                        ? glassType.getCalculationMethod().toString()
                        : null)
                .build();
    }
}
