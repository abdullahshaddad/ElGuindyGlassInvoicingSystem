package com.example.backend.dto;



import java.time.LocalDateTime;
import com.example.backend.models.Payment;
import com.example.backend.models.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
/**
 * Payment DTO for API responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long invoiceId;
    private Double amount;
    private PaymentMethod paymentMethod;
    private LocalDateTime paymentDate;
    private String referenceNumber;
    private String notes;
    private LocalDateTime createdAt;
    private String createdBy;
    
    /**
     * Convert Payment entity to DTO
     */
    public static PaymentDTO from(Payment payment) {
        if (payment == null) {
            return null;
        }
        
        return PaymentDTO.builder()
                .id(payment.getId())
                .customerId(payment.getCustomer() != null ? payment.getCustomer().getId() : null)
                .customerName(payment.getCustomer() != null ? payment.getCustomer().getName() : null)
                .invoiceId(payment.getInvoice() != null ? payment.getInvoice().getId() : null)
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .paymentDate(payment.getPaymentDate())
                .referenceNumber(payment.getReferenceNumber())
                .notes(payment.getNotes())
                .createdAt(payment.getCreatedAt())
                .createdBy(payment.getCreatedBy())
                .build();
    }
}


