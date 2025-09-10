package com.example.backend.dto;

import com.example.backend.models.enums.CuttingType;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceLineRequest {
    // Getters and Setters
    private Long glassTypeId;
    private Double width;
    private Double height;
    private CuttingType cuttingType;
    private Double manualCuttingPrice; // For laser cutting

}
