package com.example.backend.services.cutting;

import com.example.backend.models.CuttingRate;
import com.example.backend.models.InvoiceLine;
import com.example.backend.models.enums.CuttingType;
import com.example.backend.repositories.CuttingRateRepository;
import com.example.backend.repositories.CuttingStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ShatfCuttingStrategy implements CuttingStrategy {

    private static final double DEFAULT_RATE = 10.0;
    private final CuttingRateRepository cuttingRateRepository;

    @Autowired
    public ShatfCuttingStrategy(CuttingRateRepository cuttingRateRepository) {
        this.cuttingRateRepository = cuttingRateRepository;
    }

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
        return cuttingRateRepository.findRateByTypeAndThickness(CuttingType.SHATF, thickness)
                .map(CuttingRate::getRatePerMeter)
                .orElse(DEFAULT_RATE); // 12mm+
    }
}
