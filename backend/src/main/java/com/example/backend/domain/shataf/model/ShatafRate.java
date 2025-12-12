package com.example.backend.domain.shataf.model;

import com.example.backend.domain.shared.valueobject.Money;
import com.example.backend.models.enums.ShatafType;
import lombok.Getter;

import java.util.Objects;

/**
 * ShatafRate Domain Entity
 * Represents pricing rates for different shataf types based on thickness
 */
@Getter
public class ShatafRate {
    private final Long id;
    private final ShatafType shatafType;
    private final double minThickness;
    private final double maxThickness;
    private final Money ratePerMeter;
    private boolean active;

    private ShatafRate(Long id, ShatafType shatafType, double minThickness,
                       double maxThickness, Money ratePerMeter, boolean active) {
        this.id = id;
        this.shatafType = Objects.requireNonNull(shatafType, "Shataf type cannot be null");
        this.minThickness = minThickness;
        this.maxThickness = maxThickness;
        this.ratePerMeter = Objects.requireNonNull(ratePerMeter, "Rate cannot be null");
        this.active = active;

        validateThicknessRange();
    }

    // Factory methods
    public static ShatafRate create(Long id, ShatafType shatafType, double minThickness,
                                   double maxThickness, Money ratePerMeter) {
        return new ShatafRate(id, shatafType, minThickness, maxThickness, ratePerMeter, true);
    }

    public static ShatafRate reconstitute(Long id, ShatafType shatafType, double minThickness,
                                         double maxThickness, Money ratePerMeter, boolean active) {
        return new ShatafRate(id, shatafType, minThickness, maxThickness, ratePerMeter, active);
    }

    // Business methods

    /**
     * Check if this rate applies to given thickness
     */
    public boolean appliesToThickness(double thickness) {
        return thickness >= minThickness && thickness <= maxThickness;
    }

    /**
     * Update rate
     */
    public void updateRate(Money newRate) {
        Objects.requireNonNull(newRate, "Rate cannot be null");
        // Rate is final, so we'd need to return a new instance in pure DDD
        // For now, if needed, we'll handle in the service layer
    }

    /**
     * Deactivate this rate
     */
    public void deactivate() {
        this.active = false;
    }

    /**
     * Activate this rate
     */
    public void activate() {
        this.active = true;
    }

    // Validation

    private void validateThicknessRange() {
        if (minThickness < 0) {
            throw new IllegalArgumentException("السماكة الدنيا يجب أن تكون موجبة");
        }
        if (maxThickness <= minThickness) {
            throw new IllegalArgumentException("السماكة العليا يجب أن تكون أكبر من السماكة الدنيا");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ShatafRate)) return false;
        ShatafRate that = (ShatafRate) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "ShatafRate{" +
                "shatafType=" + shatafType +
                ", thickness=" + minThickness + "-" + maxThickness +
                ", rate=" + ratePerMeter +
                '}';
    }
}
