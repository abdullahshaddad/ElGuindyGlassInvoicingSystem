package com.example.backend.dto.invoice;

import com.example.backend.models.InvoiceLineOperation;
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
public class InvoiceLineOperationDTO {
    private Long id;
    private OperationType operationType;
    private ShatafType shatafType;
    private FarmaType farmaType;
    private Double diameter;
    private Double manualCuttingPrice;
    private String laserType;
    private Double manualPrice;
    private String notes;
    private Double shatafMeters;
    private Double ratePerMeter;
    private Double operationPrice;
    private String description;

    public static InvoiceLineOperationDTO from(InvoiceLineOperation operation) {
        if (operation == null) {
            return null;
        }

        return InvoiceLineOperationDTO.builder()
                .id(operation.getId())
                .operationType(operation.getOperationType())
                .shatafType(operation.getShatafType())
                .farmaType(operation.getFarmaType())
                .diameter(operation.getDiameter())
                .manualCuttingPrice(operation.getManualCuttingPrice())
                .laserType(operation.getLaserType())
                .manualPrice(operation.getManualPrice())
                .notes(operation.getNotes())
                .shatafMeters(operation.getShatafMeters())
                .ratePerMeter(operation.getRatePerMeter())
                .operationPrice(operation.getOperationPrice())
                .description(operation.getDescription())
                .build();
    }
}
