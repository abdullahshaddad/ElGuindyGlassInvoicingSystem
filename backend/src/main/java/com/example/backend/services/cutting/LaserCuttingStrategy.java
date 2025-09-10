package com.example.backend.services.cutting;

import com.example.backend.models.InvoiceLine;
import org.springframework.stereotype.Component;

@Component
public class LaserCuttingStrategy implements CuttingStrategy {

    @Override
    public double calculateCuttingPrice(InvoiceLine invoiceLine) {
        // Laser cutting is manual input - return existing cutting price
        return invoiceLine.getCuttingPrice();
    }

    @Override
    public String getCuttingMethod() {
        return "ليزر";
    }
}
