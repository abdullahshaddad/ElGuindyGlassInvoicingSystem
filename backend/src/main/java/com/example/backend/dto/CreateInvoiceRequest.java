package com.example.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceRequest {
    // Getters and Setters
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private List<CreateInvoiceLineRequest> invoiceLines;
    private String notes;
    private LocalDateTime issueDate;


}

