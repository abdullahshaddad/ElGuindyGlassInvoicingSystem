package com.example.backend.dto;

import com.example.backend.models.enums.ShatafType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor; /**
 * Request DTO for updating shataf rate
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateShatafRateRequest {
    private ShatafType shatafType;
    private Double minThickness;
    private Double maxThickness;
    private Double ratePerMeter;
    private Boolean active;
}
