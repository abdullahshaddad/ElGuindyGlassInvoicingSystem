package com.example.backend.services.cutting;

import com.example.backend.models.InvoiceLine;
import org.springframework.stereotype.Component;

@Component
public class ShatfCuttingStrategy implements CuttingStrategy {

    // شطف pricing rates based on thickness
    private static final double[] THICKNESS_RATES = {
            5.0,   // 3mm glass
            7.0,   // 4mm glass
            9.0,   // 5mm glass
            11.0,  // 6mm glass
            13.0,  // 8mm glass
            15.0,  // 10mm glass
            18.0   // 12mm+ glass
    };

    @Override
    public double calculateCuttingPrice(InvoiceLine invoiceLine) {
        double thickness = invoiceLine.getGlassType().getThickness();
        double perimeter = 2 * (invoiceLine.getWidth() + invoiceLine.getHeight());

        double rate = getRateForThickness(thickness);
        return perimeter * rate;
    }

    @Override
    public String getCuttingMethod() {
        return "شطف";
    }

    private double getRateForThickness(double thickness) {
        if (thickness <= 3.0) return THICKNESS_RATES[0];
        if (thickness <= 4.0) return THICKNESS_RATES[1];
        if (thickness <= 5.0) return THICKNESS_RATES[2];
        if (thickness <= 6.0) return THICKNESS_RATES[3];
        if (thickness <= 8.0) return THICKNESS_RATES[4];
        if (thickness <= 10.0) return THICKNESS_RATES[5];
        return THICKNESS_RATES[6]; // 12mm+
    }
}
