package com.example.backend.dto;

import com.example.backend.models.ShatafRate;
import com.example.backend.models.enums.ShatafType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor; /**
 * Request DTO for creating a new shataf rate
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateShatafRateRequest {
    private ShatafType shatafType;
    private Double minThickness;
    private Double maxThickness;
    private Double ratePerMeter;

    /**
     * Convert to ShatafRate entity
     */
    public ShatafRate toEntity() {
        return ShatafRate.builder()
            .shatafType(shatafType)
            .minThickness(minThickness)
            .maxThickness(maxThickness)
            .ratePerMeter(ratePerMeter)
            .active(true)
            .build();
    }
}
