package com.example.backend.domain.glass.model;

import com.example.backend.domain.shared.valueobject.Area;
import com.example.backend.domain.shared.valueobject.Money;
import lombok.Getter;

import java.util.Objects;

/**
 * GlassType Domain Entity
 * Represents a type of glass with pricing information
 */
@Getter
public class GlassType {
    private final GlassTypeId id;
    private String name;
    private String color;
    private double thickness; // in mm
    private Money pricePerMeter;
    private boolean active;

    private GlassType(GlassTypeId id, String name, String color, double thickness,
                      Money pricePerMeter, boolean active) {
        this.id = Objects.requireNonNull(id, "GlassType ID cannot be null");
        this.name = validateName(name);
        this.color = color;
        this.thickness = validateThickness(thickness);
        this.pricePerMeter = Objects.requireNonNull(pricePerMeter, "Price cannot be null");
        this.active = active;
    }

    // Factory methods
    public static GlassType create(GlassTypeId id, String name, String color,
                                  double thickness, Money pricePerMeter) {
        return new GlassType(id, name, color, thickness, pricePerMeter, true);
    }

    public static GlassType reconstitute(GlassTypeId id, String name, String color,
                                        double thickness, Money pricePerMeter, boolean active) {
        return new GlassType(id, name, color, thickness, pricePerMeter, active);
    }

    // Business methods

    /**
     * Calculate price for given area
     */
    public Money calculatePrice(Area area) {
        Objects.requireNonNull(area, "Area cannot be null");
        return pricePerMeter.multiply(area.toBigDecimal());
    }

    /**
     * Update price
     */
    public void updatePrice(Money newPrice) {
        this.pricePerMeter = Objects.requireNonNull(newPrice, "Price cannot be null");
    }

    /**
     * Update name
     */
    public void updateName(String newName) {
        this.name = validateName(newName);
    }

    /**
     * Deactivate this glass type
     */
    public void deactivate() {
        this.active = false;
    }

    /**
     * Activate this glass type
     */
    public void activate() {
        this.active = true;
    }

    // Validation

    private String validateName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("اسم نوع الزجاج مطلوب");
        }
        return name.trim();
    }

    private double validateThickness(double thickness) {
        if (thickness <= 0) {
            throw new IllegalArgumentException("سُمك الزجاج يجب أن يكون موجباً");
        }
        return thickness;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof GlassType)) return false;
        GlassType glassType = (GlassType) o;
        return id.equals(glassType.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "GlassType{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", thickness=" + thickness +
                ", pricePerMeter=" + pricePerMeter +
                '}';
    }
}
