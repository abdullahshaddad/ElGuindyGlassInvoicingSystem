package com.example.backend.dto;

import com.example.backend.models.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for recording payment
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecordPaymentRequest {
    private Long customerId;
    private String invoiceId; // Optional - null for general balance payment
    private Double amount;
    private PaymentMethod paymentMethod = PaymentMethod.CASH;
    private String referenceNumber;
    private String notes;
}
