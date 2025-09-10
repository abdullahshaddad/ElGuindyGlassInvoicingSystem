package com.example.backend.dto;

import lombok.*;

import java.util.List;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceRequest {
    // Getters and Setters
    private String customerName;
    private String customerPhone;
    private String customerAddress;
    private List<CreateInvoiceLineRequest> invoiceLines;

}

