package com.example.backend.dto.invoice;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinePreviewDTO {
    private Double width;
    private Double height;
    private Long glassTypeId;
    private String glassTypeName;
    private Double thickness;
    private String calculationMethod;
    private Double areaM2;
    private Double lengthM;
    private Double quantityForPricing;
    private Double glassUnitPrice;
    private Double glassPrice;
    private String cuttingType;
    private Double cuttingRate;
    private Double perimeter;
    private Double cuttingPrice;
    private Double lineTotal;
    private String quantityUnit;
    private String calculationDescription;
    private java.util.List<OperationPreviewDTO> operations;
}