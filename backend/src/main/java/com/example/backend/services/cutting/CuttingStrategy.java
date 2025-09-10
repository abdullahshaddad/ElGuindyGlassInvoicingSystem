package com.example.backend.services.cutting;

import com.example.backend.models.InvoiceLine;

public interface CuttingStrategy {
    double calculateCuttingPrice(InvoiceLine invoiceLine);
    String getCuttingMethod();
}


