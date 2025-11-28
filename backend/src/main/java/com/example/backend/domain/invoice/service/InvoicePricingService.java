package com.example.backend.domain.invoice.service;

import com.example.backend.domain.glass.model.GlassType;
import com.example.backend.domain.invoice.model.LineCalculation;
import com.example.backend.domain.shataf.model.ShatafRate;
import com.example.backend.domain.shared.valueobject.Area;
import com.example.backend.domain.shared.valueobject.Dimensions;
import com.example.backend.domain.shared.valueobject.Money;
import com.example.backend.domain.shataf.repository.ShatafRateRepository;
import com.example.backend.models.enums.FarmaType;
import com.example.backend.models.enums.ShatafType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Invoice Pricing Domain Service
 * Handles all pricing calculations for invoice lines
 *
 * FIX BUG #1: Uses Dimensions value object for proper MM to M conversion
 * FIX BUG #3: Uses ShatafType and FarmaType for enhanced cutting calculations
 * FIX BUG #4: Properly calculates glass price using area
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoicePricingService {
    private final ShatafRateRepository shatafRateRepository;

    /**
     * Calculate line pricing with all bug fixes
     */
    public LineCalculation calculateLinePrice(
            Dimensions dimensions,
            GlassType glassType,
            ShatafType shatafType,
            FarmaType farmaType,
            Double diameter,
            Money manualCuttingPrice
    ) {
        log.debug("Calculating line price: glassType={}, shatafType={}, farmaType={}",
                glassType.getName(), shatafType, farmaType);

        // FIX BUG #1: Convert dimensions to meters
        Dimensions metersD = dimensions.convertToMeters();
        log.debug("Dimensions converted: original={}, meters={}", dimensions, metersD);

        // FIX BUG #4: Calculate area properly
        Area area = metersD.calculateArea();
        log.debug("Area calculated: {} m²", area.toDouble());

        // Calculate glass price: area × price per meter
        Money glassPrice = glassType.calculatePrice(area);
        log.debug("Glass price calculated: {}", glassPrice);

        // FIX BUG #3: Calculate shataf meters using farma formula
        double shatafMeters = calculateShatafMeters(farmaType, metersD, diameter);
        log.debug("Shataf meters calculated: {} m", shatafMeters);

        // Calculate cutting price based on shataf type
        Money cuttingPrice = calculateCuttingPrice(
                shatafType,
                shatafMeters,
                area,
                glassType.getThickness(),
                manualCuttingPrice
        );
        log.debug("Cutting price calculated: {}", cuttingPrice);

        return LineCalculation.of(area, shatafMeters, glassPrice, cuttingPrice);
    }

    /**
     * Calculate shataf meters using farma formula
     * FIX BUG #3: Properly use FarmaType formulas
     */
    private double calculateShatafMeters(FarmaType farmaType, Dimensions metersD, Double diameter) {
        if (farmaType.isManual()) {
            // Manual types (ROTATION, TABLEAUX) don't have formulas
            return 0.0;
        }

        // Use the formula defined in FarmaType enum
        return farmaType.calculateShatafMeters(
                metersD.getWidth(),
                metersD.getHeight(),
                diameter
        );
    }

    /**
     * Calculate cutting price based on shataf type
     * FIX BUG #3: Handle all shataf types correctly
     */
    private Money calculateCuttingPrice(
            ShatafType shatafType,
            double shatafMeters,
            Area area,
            double thickness,
            Money manualCuttingPrice
    ) {
        // Manual input types (LASER, ROTATION, TABLEAUX)
        if (shatafType.isManualInput()) {
            if (manualCuttingPrice == null || manualCuttingPrice.isZero()) {
                throw new IllegalArgumentException("سعر القطع اليدوي مطلوب لنوع: " + shatafType);
            }
            return manualCuttingPrice;
        }

        // Area-based type (SANDING)
        if (shatafType.isAreaBased()) {
            ShatafRate rate = findRateForThickness(shatafType, thickness);
            return rate.getRatePerMeter().multiply(area.toBigDecimal());
        }

        // Formula-based types (KHARAZAN, SHAMBORLEH, ONE_CM, TWO_CM, THREE_CM, JULIA)
        if (shatafType.isFormulaBased()) {
            ShatafRate rate = findRateForThickness(shatafType, thickness);
            return rate.getRatePerMeter().multiply(BigDecimal.valueOf(shatafMeters));
        }

        throw new IllegalArgumentException("نوع شطف غير معروف: " + shatafType);
    }

    /**
     * Find appropriate rate for given shataf type and thickness
     */
    private ShatafRate findRateForThickness(ShatafType shatafType, double thickness) {
        return shatafRateRepository
                .findByShatafTypeAndThickness(shatafType, thickness)
                .orElseThrow(() -> new IllegalArgumentException(
                        String.format("لم يتم العثور على سعر لنوع الشطف %s بسماكة %.1f مم",
                                shatafType.getArabicName(), thickness)
                ));
    }
}
