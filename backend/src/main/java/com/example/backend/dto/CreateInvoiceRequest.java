package com.example.backend.dto;

import com.example.backend.dto.invoice.InvoiceDTO;
import com.example.backend.models.enums.CuttingType;
import com.example.backend.models.enums.DimensionUnit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Enhanced Create Invoice Request DTO with payment information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceRequest {
    private Long customerId;
    private List<CreateInvoiceLineRequest> invoiceLines;
    private String notes;
    private LocalDateTime issueDate;

    /**
     * Amount customer is paying now (at invoice creation)
     * - For CASH customers: must equal totalPrice
     * - For REGULAR/COMPANY: can be 0 to totalPrice
     */
    private Double amountPaidNow;
}


/**
 * Response DTO for invoice creation with payment details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class CreateInvoiceResponse {
    private InvoiceDTO invoice;
    private Double totalPrice;
    private Double amountPaidNow;
    private Double remainingBalance;
    private Double customerTotalBalance;
    private String message;
    private List<String> warnings; // e.g., if print jobs failed
}