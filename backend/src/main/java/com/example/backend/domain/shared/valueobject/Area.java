package com.example.backend.domain.shared.valueobject;

import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Area Value Object
 * Immutable area measurement in square meters
 */
@Getter
@EqualsAndHashCode
public final class Area implements Serializable, Comparable<Area> {
    private static final int SCALE = 4; // 4 decimal places for precision

    private final BigDecimal squareMeters;

    private Area(BigDecimal squareMeters) {
        if (squareMeters == null) {
            throw new IllegalArgumentException("Area cannot be null");
        }
        if (squareMeters.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Area cannot be negative: " + squareMeters);
        }
        this.squareMeters = squareMeters.setScale(SCALE, RoundingMode.HALF_UP);
    }

    // Factory methods
    public static Area ofSquareMeters(double squareMeters) {
        return new Area(BigDecimal.valueOf(squareMeters));
    }

    public static Area ofSquareMeters(BigDecimal squareMeters) {
        return new Area(squareMeters);
    }

    public static Area zero() {
        return new Area(BigDecimal.ZERO);
    }

    // Arithmetic operations
    public Area add(Area other) {
        return new Area(this.squareMeters.add(other.squareMeters));
    }

    public Area subtract(Area other) {
        BigDecimal result = this.squareMeters.subtract(other.squareMeters);
        if (result.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Result would be negative");
        }
        return new Area(result);
    }

    public Area multiply(BigDecimal multiplier) {
        return new Area(this.squareMeters.multiply(multiplier));
    }

    public Area multiply(double multiplier) {
        return multiply(BigDecimal.valueOf(multiplier));
    }

    // Comparison operations
    public boolean isGreaterThan(Area other) {
        return squareMeters.compareTo(other.squareMeters) > 0;
    }

    public boolean isLessThan(Area other) {
        return squareMeters.compareTo(other.squareMeters) < 0;
    }

    public boolean isZero() {
        return squareMeters.compareTo(BigDecimal.ZERO) == 0;
    }

    // Comparable implementation
    @Override
    public int compareTo(Area other) {
        return squareMeters.compareTo(other.squareMeters);
    }

    // Conversion methods
    public double toDouble() {
        return squareMeters.doubleValue();
    }

    public BigDecimal toBigDecimal() {
        return squareMeters;
    }

    @Override
    public String toString() {
        return squareMeters.toPlainString() + " m²";
    }
}
