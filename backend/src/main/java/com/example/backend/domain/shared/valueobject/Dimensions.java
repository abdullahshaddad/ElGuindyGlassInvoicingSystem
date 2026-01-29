package com.example.backend.domain.shared.valueobject;

import com.example.backend.models.enums.DimensionUnit;
import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.io.Serializable;
import java.util.Objects;

/**
 * Dimensions Value Object
 * Immutable width and height with proper unit conversion
 * Fixes Bug #1: Dimension conversion missing (MM to meters)
 */
@Getter
@EqualsAndHashCode
public final class Dimensions implements Serializable {
    private final double width;
    private final double height;
    private final DimensionUnit unit;

    private Dimensions(double width, double height, DimensionUnit unit) {
        if (width <= 0) {
            throw new IllegalArgumentException("Width must be positive: " + width);
        }
        if (height <= 0) {
            throw new IllegalArgumentException("Height must be positive: " + height);
        }
        Objects.requireNonNull(unit, "Dimension unit cannot be null");

        this.width = width;
        this.height = height;
        this.unit = unit;
    }

    // Factory methods
    public static Dimensions of(double width, double height, DimensionUnit unit) {
        return new Dimensions(width, height, unit);
    }

    public static Dimensions ofMillimeters(double widthMm, double heightMm) {
        return new Dimensions(widthMm, heightMm, DimensionUnit.MM);
    }

    public static Dimensions ofCentimeters(double widthCm, double heightCm) {
        return new Dimensions(widthCm, heightCm, DimensionUnit.CM);
    }

    public static Dimensions ofMeters(double widthM, double heightM) {
        return new Dimensions(widthM, heightM, DimensionUnit.M);
    }

    /**
     * Convert dimensions to meters
     * Uses DimensionUnit.toMeters() for proper conversion from any unit
     */
    public Dimensions convertToMeters() {
        if (unit == DimensionUnit.M) {
            return this;
        }

        return new Dimensions(
            unit.toMeters(width),
            unit.toMeters(height),
            DimensionUnit.M
        );
    }

    /**
     * Convert dimensions to centimeters
     */
    public Dimensions convertToCentimeters() {
        if (unit == DimensionUnit.CM) {
            return this;
        }

        // First convert to meters, then to centimeters
        double widthInMeters = unit.toMeters(width);
        double heightInMeters = unit.toMeters(height);
        return new Dimensions(
            DimensionUnit.CM.fromMeters(widthInMeters),
            DimensionUnit.CM.fromMeters(heightInMeters),
            DimensionUnit.CM
        );
    }

    /**
     * Convert dimensions to millimeters
     */
    public Dimensions convertToMillimeters() {
        if (unit == DimensionUnit.MM) {
            return this;
        }

        // First convert to meters, then to millimeters
        double widthInMeters = unit.toMeters(width);
        double heightInMeters = unit.toMeters(height);
        return new Dimensions(
            DimensionUnit.MM.fromMeters(widthInMeters),
            DimensionUnit.MM.fromMeters(heightInMeters),
            DimensionUnit.MM
        );
    }

    /**
     * Calculate area in square meters
     */
    public Area calculateArea() {
        Dimensions inMeters = convertToMeters();
        double areaM2 = inMeters.width * inMeters.height;
        return Area.ofSquareMeters(areaM2);
    }

    /**
     * Calculate perimeter in meters
     */
    public double getPerimeterInMeters() {
        Dimensions inMeters = convertToMeters();
        return 2 * (inMeters.width + inMeters.height);
    }

    /**
     * Get width in meters (regardless of original unit)
     */
    public double getWidthInMeters() {
        return convertToMeters().width;
    }

    /**
     * Get height in meters (regardless of original unit)
     */
    public double getHeightInMeters() {
        return convertToMeters().height;
    }

    /**
     * Get width in centimeters (regardless of original unit)
     */
    public double getWidthInCentimeters() {
        return convertToCentimeters().width;
    }

    /**
     * Get height in centimeters (regardless of original unit)
     */
    public double getHeightInCentimeters() {
        return convertToCentimeters().height;
    }

    /**
     * Get width in millimeters (regardless of original unit)
     */
    public double getWidthInMillimeters() {
        return convertToMillimeters().width;
    }

    /**
     * Get height in millimeters (regardless of original unit)
     */
    public double getHeightInMillimeters() {
        return convertToMillimeters().height;
    }

    /**
     * Check if dimensions are in meters
     */
    public boolean isInMeters() {
        return unit == DimensionUnit.M;
    }

    /**
     * Check if dimensions are in centimeters
     */
    public boolean isInCentimeters() {
        return unit == DimensionUnit.CM;
    }

    /**
     * Check if dimensions are in millimeters
     */
    public boolean isInMillimeters() {
        return unit == DimensionUnit.MM;
    }

    @Override
    public String toString() {
        return String.format("%.2f × %.2f %s", width, height, unit);
    }
}
