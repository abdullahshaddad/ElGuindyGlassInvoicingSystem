package com.example.backend.application.dto;

import com.example.backend.models.enums.FarmaType;
import com.example.backend.models.enums.InvoiceStatus;
import com.example.backend.models.enums.ShatafType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Invoice DTO for application layer
 * Used for communication between use cases and API layer
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDTO {
    private Long id;
    private Long customerId;
    private String customerName;
    private BigDecimal totalPrice;
    private BigDecimal amountPaid;
    private BigDecimal remainingBalance;
    private InvoiceStatus status;
    private LocalDateTime issueDate;
    private LocalDateTime paymentDate;
    private String notes;
    private List<InvoiceLineDTO> invoiceLines;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceLineDTO {
        private Long id;
        private Long glassTypeId;
        private String glassTypeName;
        private Double widthMm;
        private Double heightMm;
        private Double widthM;
        private Double heightM;
        private Double areaM2;
        private ShatafType shatafType;
        private FarmaType farmaType;
        private Double diameter;
        private Double shatafMeters;
        private BigDecimal glassPrice;
        private BigDecimal cuttingPrice;
        private BigDecimal totalPrice;
    }
}
