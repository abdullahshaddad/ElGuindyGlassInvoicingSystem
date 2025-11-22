package com.example.backend.services;

import com.example.backend.exceptions.invoice.CuttingCalculationException;
import com.example.backend.models.InvoiceLine;
import com.example.backend.models.enums.FarmaType;
import com.example.backend.models.enums.ShatafType;
import com.example.backend.repositories.CuttingStrategy;
import com.example.backend.services.cutting.ShatafRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Enhanced Shataf Cutting Strategy
 * Supports:
 * - Formula-based types (KHARAZAN, SHAMBORLEH, etc.) - depends on thickness
 * - Manual input types (LASER, ROTATION, TABLEAUX)
 * - Area-based types (SANDING)
 * - Different farma formulas
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EnhancedShatafCuttingStrategy implements CuttingStrategy {

    private final ShatafRateService shatafRateService;

    @Override
    public double calculateCuttingPrice(InvoiceLine invoiceLine) {
        try {
            // Get shataf type and farma type
            ShatafType shatafType = invoiceLine.getShatafType();
            FarmaType farmaType = invoiceLine.getFarmaType();

            if (shatafType == null) {
                throw new CuttingCalculationException("نوع الشطف مطلوب");
            }

            // Handle different shataf type categories
            if (shatafType.isManualInput()) {
                return calculateManualPrice(invoiceLine);
            } else if (shatafType.isAreaBased()) {
                return calculateAreaBasedPrice(invoiceLine);
            } else if (shatafType.isFormulaBased()) {
                return calculateFormulaBasedPrice(invoiceLine);
            }

            throw new CuttingCalculationException("نوع شطف غير مدعوم: " + shatafType.getArabicName());

        } catch (Exception e) {
            log.error("Error calculating cutting price for line {}: {}",
                invoiceLine.getId(), e.getMessage());
            throw new CuttingCalculationException(
                "فشل حساب سعر القطع: " + e.getMessage(), e
            );
        }
    }

    @Override
    public String getCuttingMethod() {
        return "شطف محسّن";
    }

    /**
     * Calculate price for manual input types (LASER, ROTATION, TABLEAUX)
     */
    private double calculateManualPrice(InvoiceLine line) {
        Double manualPrice = line.getManualCuttingPrice();
        
        if (manualPrice == null) {
            throw new CuttingCalculationException(
                "سعر القطع اليدوي مطلوب للنوع: " + line.getShatafType().getArabicName()
            );
        }

        if (manualPrice < 0) {
            throw new CuttingCalculationException("سعر القطع اليدوي لا يمكن أن يكون سالباً");
        }

        log.debug("Manual cutting price for {}: {} EGP",
            line.getShatafType().getArabicName(), manualPrice);

        // Store the manual price directly
        line.setCuttingRate(null); // No rate for manual types
        line.setShatafMeters(null); // No meters calculation for manual types

        return manualPrice;
    }

    /**
     * Calculate price for area-based types (SANDING)
     * cost = area_m2 × sanding_rate
     */
    private double calculateAreaBasedPrice(InvoiceLine line) {
        Double area = line.getAreaM2();
        
        if (area == null || area <= 0) {
            throw new CuttingCalculationException("المساحة مطلوبة لحساب الصنفرة");
        }

        // Get sanding rate (per square meter)
        double thickness = line.getGlassType().getThickness();
        double rate = shatafRateService.getRateForThickness(
            line.getShatafType(),
            thickness
        );

        double price = area * rate;

        log.debug("Sanding price: {} m² × {} EGP/m² = {} EGP",
            area, rate, price);

        // Store calculation details
        line.setCuttingRate(rate);
        line.setShatafMeters(area); // Store area in shataf meters field for reference

        return price;
    }

    /**
     * Calculate price for formula-based types
     * Uses farma formulas and thickness-based rates
     */
    private double calculateFormulaBasedPrice(InvoiceLine line) {
        // Ensure farma type is set
        FarmaType farmaType = line.getFarmaType();
        if (farmaType == null) {
            // Default to normal shataf
            farmaType = FarmaType.NORMAL_SHATAF;
            line.setFarmaType(farmaType);
        }

        // Check if farma type is manual
        if (farmaType.isManual()) {
            return calculateManualPrice(line);
        }

        // Calculate shataf meters using farma formula
        double shatafMeters;
        try {
            shatafMeters = farmaType.calculateShatafMeters(
                line.getWidth(),    // Already in meters after calculateDimensions()
                line.getHeight(),   // Already in meters after calculateDimensions()
                line.getDiameter()
            );
        } catch (IllegalArgumentException e) {
            throw new CuttingCalculationException(e.getMessage());
        }

        // Get rate based on shataf type and glass thickness
        double thickness = line.getGlassType().getThickness();
        double rate = shatafRateService.getRateForThickness(
            line.getShatafType(),
            thickness
        );

        // Calculate price
        double price = shatafMeters * rate;

        log.debug("Formula-based cutting: {} ({}) @ {} mm = {} m × {} EGP/m = {} EGP",
            line.getShatafType().getArabicName(),
            farmaType.getArabicName(),
            thickness,
            shatafMeters,
            rate,
            price);

        // Store calculation details
        line.setShatafMeters(shatafMeters);
        line.setCuttingRate(rate);

        return price;
    }

    /**
     * Validate invoice line has required fields for cutting calculation
     */
    private void validateLine(InvoiceLine line) {
        if (line.getWidth() == null || line.getWidth() <= 0) {
            throw new CuttingCalculationException("العرض مطلوب للحساب");
        }

        if (line.getHeight() == null || line.getHeight() <= 0) {
            throw new CuttingCalculationException("الارتفاع مطلوب للحساب");
        }

        if (line.getGlassType() == null) {
            throw new CuttingCalculationException("نوع الزجاج مطلوب للحساب");
        }

        // Check farma type requirements
        FarmaType farmaType = line.getFarmaType();
        if (farmaType != null && farmaType.requiresDiameter()) {
            if (line.getDiameter() == null || line.getDiameter() <= 0) {
                throw new CuttingCalculationException(
                    "القطر مطلوب لنوع الفرما: " + farmaType.getArabicName()
                );
            }
        }
    }
}
