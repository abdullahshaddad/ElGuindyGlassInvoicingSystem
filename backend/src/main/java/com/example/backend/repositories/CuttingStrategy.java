package com.example.backend.repositories;

import com.example.backend.models.InvoiceLine;

public interface CuttingStrategy {
    double calculateCuttingPrice(InvoiceLine invoiceLine);
    String getCuttingMethod();
}


