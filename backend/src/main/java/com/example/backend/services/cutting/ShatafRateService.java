package com.example.backend.services.cutting;

import com.example.backend.models.ShatafRate;
import com.example.backend.models.enums.ShatafType;
import com.example.backend.repositories.ShatafRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for managing Shataf rates
 * Handles pricing for different shataf types based on glass thickness
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ShatafRateService {

    private final ShatafRateRepository shatafRateRepository;

    // Default rates for each formula-based shataf type
    private static final Map<ShatafType, Double> DEFAULT_RATES = Map.of(
        ShatafType.KHARAZAN, 12.0,
        ShatafType.SHAMBORLEH, 15.0,
        ShatafType.ONE_CM, 8.0,
        ShatafType.TWO_CM, 10.0,
        ShatafType.THREE_CM, 12.0,
        ShatafType.JULIA, 18.0,
        ShatafType.SANDING, 20.0  // Per square meter for area-based
    );

    /**
     * Initialize default rates for all shataf types across thickness ranges
     */
    @Transactional
    public List<ShatafRate> initializeDefaultRates() {
        log.info("Initializing default shataf rates");
        List<ShatafRate> rates = new ArrayList<>();

        // Standard thickness ranges (same as original cutting rates)
        List<ThicknessRange> ranges = List.of(
            new ThicknessRange(0.0, 3.0),
            new ThicknessRange(3.1, 4.0),
            new ThicknessRange(4.1, 5.0),
            new ThicknessRange(5.1, 6.0),
            new ThicknessRange(6.1, 8.0),
            new ThicknessRange(8.1, 10.0),
            new ThicknessRange(10.1, 12.0),
            new ThicknessRange(12.1, 50.0)  // Maximum range
        );

        // Create rates for each formula-based and area-based type
        for (ShatafType type : ShatafType.values()) {
            if (type.isFormulaBased() || type.isAreaBased()) {
                Double baseRate = DEFAULT_RATES.getOrDefault(type, 10.0);
                
                for (ThicknessRange range : ranges) {
                    // Adjust rate based on thickness range
                    double adjustedRate = baseRate * getThicknessMultiplier(range.min);
                    
                    ShatafRate rate = ShatafRate.builder()
                        .shatafType(type)
                        .minThickness(range.min)
                        .maxThickness(range.max)
                        .ratePerMeter(adjustedRate)
                        .active(true)
                        .build();
                    
                    rates.add(shatafRateRepository.save(rate));
                    log.debug("Created rate: {} - {}-{} mm @ {} EGP/m",
                        type.getArabicName(), range.min, range.max, adjustedRate);
                }
            }
        }

        log.info("Initialized {} shataf rates", rates.size());
        return rates;
    }

    /**
     * Get rate multiplier based on thickness
     */
    private double getThicknessMultiplier(double minThickness) {
        if (minThickness <= 3.0) return 1.0;
        if (minThickness <= 4.0) return 1.2;
        if (minThickness <= 5.0) return 1.4;
        if (minThickness <= 6.0) return 1.6;
        if (minThickness <= 8.0) return 1.8;
        if (minThickness <= 10.0) return 2.0;
        if (minThickness <= 12.0) return 2.2;
        return 2.5;
    }

    /**
     * Get rate for a specific shataf type and thickness
     */
    public Double getRateForThickness(ShatafType shatafType, Double thickness) {
        if (shatafType.isManualInput()) {
            throw new IllegalArgumentException("النوع " + shatafType.getArabicName() + " يتطلب إدخال يدوي");
        }

        return shatafRateRepository
            .findRateByShatafTypeAndThickness(shatafType, thickness)
            .map(ShatafRate::getRatePerMeter)
            .orElseGet(() -> {
                log.warn("No rate found for {} at thickness {}, using default",
                    shatafType.getArabicName(), thickness);
                return DEFAULT_RATES.getOrDefault(shatafType, 10.0);
            });
    }

    /**
     * Get all rates for a specific shataf type
     */
    public List<ShatafRate> getRatesByType(ShatafType shatafType) {
        return shatafRateRepository.findByShatafTypeAndActiveTrue(shatafType);
    }

    /**
     * Get all active rates
     */
    public List<ShatafRate> getAllActiveRates() {
        return shatafRateRepository.findByActiveTrue();
    }

    /**
     * Create a new shataf rate
     */
    @Transactional
    public ShatafRate createRate(ShatafRate rate) {
        validateRate(rate);
        checkForOverlaps(rate);
        
        log.info("Creating new rate for {} ({}-{} mm) @ {} EGP/m",
            rate.getShatafType().getArabicName(),
            rate.getMinThickness(),
            rate.getMaxThickness(),
            rate.getRatePerMeter());
        
        return shatafRateRepository.save(rate);
    }

    /**
     * Update an existing shataf rate
     */
    @Transactional
    public ShatafRate updateRate(Long id, ShatafRate updatedRate) {
        ShatafRate existingRate = shatafRateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(id.toString()));

        validateRate(updatedRate);
        checkForOverlaps(updatedRate, id);

        existingRate.setShatafType(updatedRate.getShatafType());
        existingRate.setMinThickness(updatedRate.getMinThickness());
        existingRate.setMaxThickness(updatedRate.getMaxThickness());
        existingRate.setRatePerMeter(updatedRate.getRatePerMeter());
        existingRate.setActive(updatedRate.getActive());

        log.info("Updated rate {} for {} ({}-{} mm)",
            id,
            existingRate.getShatafType().getArabicName(),
            existingRate.getMinThickness(),
            existingRate.getMaxThickness());

        return shatafRateRepository.save(existingRate);
    }

    /**
     * Delete a shataf rate
     */
    @Transactional
    public void deleteRate(Long id) {
        ShatafRate rate = shatafRateRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(  id.toString() + " سعر الشطف غير موجود"));

        log.info("Deleting rate {} for {}", id, rate.getShatafType().getArabicName());
        shatafRateRepository.delete(rate);
    }

    /**
     * Validate rate data
     */
    private void validateRate(ShatafRate rate) {
        if (rate.getShatafType() == null) {
            throw new IllegalArgumentException("نوع الشطف مطلوب");
        }

        if (rate.getShatafType().isManualInput()) {
            throw new IllegalArgumentException("النوع " + rate.getShatafType().getArabicName() + " لا يستخدم جدول الأسعار");
        }

        if (rate.getMinThickness() == null || rate.getMaxThickness() == null) {
            throw new IllegalArgumentException("نطاق السماكة مطلوب");
        }

        if (rate.getMinThickness() < 0 || rate.getMaxThickness() < 0) {
            throw new IllegalArgumentException("السماكة لا يمكن أن تكون سالبة");
        }

        if (rate.getMinThickness() > rate.getMaxThickness()) {
            throw new IllegalArgumentException("الحد الأدنى للسماكة لا يمكن أن يكون أكبر من الحد الأقصى");
        }

        if (rate.getRatePerMeter() == null || rate.getRatePerMeter() < 0) {
            throw new IllegalArgumentException("السعر لكل متر مطلوب ولا يمكن أن يكون سالباً");
        }
    }

    /**
     * Check for overlapping rates
     */
    private void checkForOverlaps(ShatafRate rate) {
        checkForOverlaps(rate, null);
    }

    /**
     * Check for overlapping rates (excluding a specific rate ID)
     */
    private void checkForOverlaps(ShatafRate rate, Long excludeId) {
        Long checkId = excludeId != null ? excludeId : -1L;
        
        List<ShatafRate> overlapping = shatafRateRepository.findOverlappingRates(
            rate.getShatafType(),
            rate.getMinThickness(),
            rate.getMaxThickness(),
            checkId
        );

        if (!overlapping.isEmpty()) {
            String message = String.format(
                "يوجد تداخل في نطاق السماكة مع سعر موجود للنوع %s",
                rate.getShatafType().getArabicName()
            );
            throw new IllegalArgumentException(message);
        }
    }

    /**
     * Helper class for thickness ranges
     */
    private static class ThicknessRange {
        final double min;
        final double max;

        ThicknessRange(double min, double max) {
            this.min = min;
            this.max = max;
        }
    }
}
