package com.example.backend.dto;

import com.example.backend.models.enums.ShatafType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List; /**
 * Request DTO for bulk updating rates by thickness ranges
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkUpdateShatafRatesRequest {
    private ShatafType shatafType;
    private List<ThicknessRateMapping> rates;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ThicknessRateMapping {
        private Double minThickness;
        private Double maxThickness;
        private Double ratePerMeter;
    }
}
