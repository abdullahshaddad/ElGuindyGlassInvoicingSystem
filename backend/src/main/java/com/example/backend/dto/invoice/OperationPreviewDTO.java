package com.example.backend.dto.invoice;

import com.example.backend.models.enums.FarmaType;
import com.example.backend.models.enums.OperationType;
import com.example.backend.models.enums.ShatafType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationPreviewDTO {
    private OperationType type;
    private ShatafType shatafType;
    private FarmaType farmaType;
    private String laserType;
    private Double diameter;
    private Double manualPrice;
    private Double manualCuttingPrice;
    private Double calculatedPrice;
    private Double shatafMeters;
    private Double ratePerMeter;
    private String notes;
}
