package com.example.backend.dto.invoice;

import com.example.backend.dto.CustomerDTO;
import com.example.backend.models.Invoice;
import com.example.backend.models.enums.InvoiceStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class InvoiceDTO {
    private Long id;
    private LocalDateTime issueDate;
    private LocalDateTime paymentDate;
    private InvoiceStatus status;
    private Double totalPrice;
    private String notes;
    private CustomerDTO customer;
    private List<InvoiceLineDTO> invoiceLines;
    private Double amountPaidNow;
    private Double remainingBalance;

    /**
     * Convert Invoice entity to DTO
     */
    public static InvoiceDTO from(Invoice invoice) {
        if (invoice == null) {
            return null;
        }

        return InvoiceDTO.builder()
                .id(invoice.getId())
                .issueDate(invoice.getIssueDate())
                .paymentDate(invoice.getPaymentDate())
                .status(invoice.getStatus())
                .totalPrice(invoice.getTotalPrice())
                .notes(invoice.getNotes())
                .customer(CustomerDTO.from(invoice.getCustomer()))
                .invoiceLines(invoice.getInvoiceLines() != null
                        ? invoice.getInvoiceLines().stream()
                                .map(InvoiceLineDTO::from)
                                .collect(Collectors.toList())
                        : List.of())
                .amountPaidNow(invoice.getAmountPaidNow())
                .remainingBalance(invoice.getRemainingBalance())
                .build();
    }

    /**
     * Convert Invoice entity to DTO without lines (for list views)
     */
    public static InvoiceDTO fromWithoutLines(Invoice invoice) {
        if (invoice == null) {
            return null;
        }

        return InvoiceDTO.builder()
                .id(invoice.getId())
                .issueDate(invoice.getIssueDate())
                .paymentDate(invoice.getPaymentDate())
                .status(invoice.getStatus())
                .totalPrice(invoice.getTotalPrice())
                .notes(invoice.getNotes())
                .customer(CustomerDTO.from(invoice.getCustomer()))
                .invoiceLines(List.of()) // Empty list for performance
                .amountPaidNow(invoice.getAmountPaidNow())
                .remainingBalance(invoice.getRemainingBalance())
                .build();
    }
}