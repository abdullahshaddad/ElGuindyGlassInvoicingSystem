package com.example.backend.application.dto;

import com.example.backend.models.enums.FarmaType;
import com.example.backend.models.enums.ShatafType;
import com.example.backend.models.enums.DimensionUnit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Command to create a new invoice
 * Application layer DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceCommand {
    private Long customerId;
    private List<CreateLineCommand> lines;
    private BigDecimal initialPayment;
    private String notes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateLineCommand {
        private Long glassTypeId;
        private Double width;
        private Double height;
        private DimensionUnit dimensionUnit;
        private ShatafType shatafType;
        private FarmaType farmaType;
        private Double diameter; // For wheel cut
        private BigDecimal manualCuttingPrice; // For manual shataf types
    }
}
