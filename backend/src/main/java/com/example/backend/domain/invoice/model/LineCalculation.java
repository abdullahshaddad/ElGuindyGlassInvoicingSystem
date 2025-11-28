package com.example.backend.domain.invoice.model;

import com.example.backend.domain.shared.valueobject.Area;
import com.example.backend.domain.shared.valueobject.Money;
import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Objects;

/**
 * LineCalculation Value Object
 * Encapsulates all calculation results for an invoice line
 * Immutable - once calculated, values don't change
 */
@Getter
@EqualsAndHashCode
public final class LineCalculation implements Serializable {
    private final Area area;
    private final double shatafMeters;
    private final Money glassPrice;
    private final Money cuttingPrice;
    private final Money totalPrice;

    private LineCalculation(Area area, double shatafMeters, Money glassPrice, Money cuttingPrice) {
        this.area = Objects.requireNonNull(area, "Area cannot be null");
        this.shatafMeters = shatafMeters;
        this.glassPrice = Objects.requireNonNull(glassPrice, "Glass price cannot be null");
        this.cuttingPrice = Objects.requireNonNull(cuttingPrice, "Cutting price cannot be null");
        this.totalPrice = glassPrice.add(cuttingPrice);
    }

    /**
     * Create calculation result
     */
    public static LineCalculation of(Area area, double shatafMeters, Money glassPrice, Money cuttingPrice) {
        return new LineCalculation(area, shatafMeters, glassPrice, cuttingPrice);
    }

    /**
     * Create zero calculation (for manual entry)
     */
    public static LineCalculation zero() {
        return new LineCalculation(Area.zero(), 0.0, Money.zero(), Money.zero());
    }

    @Override
    public String toString() {
        return "LineCalculation{" +
                "area=" + area +
                ", shatafMeters=" + shatafMeters +
                ", glassPrice=" + glassPrice +
                ", cuttingPrice=" + cuttingPrice +
                ", totalPrice=" + totalPrice +
                '}';
    }
}
