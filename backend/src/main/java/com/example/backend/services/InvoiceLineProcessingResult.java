package com.example.backend.services;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Result of processing invoice lines
 */
@Data
@Builder
@NoArgsConstructor
public class InvoiceLineProcessingResult {
    private Double totalPrice;

    @Builder.Default
    private List<String> errors = new ArrayList<>();

    private int successfulLines;

    public InvoiceLineProcessingResult(Double totalPrice, List<String> errors, int successfulLines) {
        this.totalPrice = totalPrice;
        this.errors = errors != null ? errors : new ArrayList<>();
        this.successfulLines = successfulLines;
    }
}
