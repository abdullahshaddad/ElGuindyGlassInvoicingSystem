package com.example.backend.dto;
import com.example.backend.models.Payment;
import com.example.backend.models.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
/**
 * Response DTO for payment recording with updated balances
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRecordResponse {
    private PaymentDTO payment;
    private Double customerBalance;
    private Double invoiceRemainingBalance;
    private String message;
}
