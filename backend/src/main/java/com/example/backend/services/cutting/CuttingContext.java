package com.example.backend.services.cutting;

import com.example.backend.models.InvoiceLine;
import com.example.backend.models.enums.CuttingType;
import com.example.backend.repositories.CuttingStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;


@Component
public class CuttingContext {

    private final ShatfCuttingStrategy shatfStrategy;
    private final LaserCuttingStrategy laserStrategy;

    @Autowired
    public CuttingContext(ShatfCuttingStrategy shatfStrategy, LaserCuttingStrategy laserStrategy) {
        this.shatfStrategy = shatfStrategy;
        this.laserStrategy = laserStrategy;
    }

    public double calculateCuttingPrice(InvoiceLine invoiceLine) {
        CuttingStrategy strategy = getStrategy(invoiceLine.getCuttingType());
        return strategy.calculateCuttingPrice(invoiceLine);
    }

    private CuttingStrategy getStrategy(CuttingType cuttingType) {
        switch (cuttingType) {
            case SHATF:
                return shatfStrategy;
            case LASER:
                return laserStrategy;
            default:
                throw new IllegalArgumentException("Unknown cutting type: " + cuttingType);
        }
    }
}
