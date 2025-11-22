package com.example.backend.models;

import com.example.backend.models.enums.ShatafType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Shataf Rate Entity
 * Manages pricing for different shataf types based on glass thickness
 *
 * For formula-based types (KHARAZAN, SHAMBORLEH, etc.):
 *   - Price depends on glass thickness
 *   - System multiplies formula result × corresponding rate
 *
 * For area-based types (SANDING):
 *   - cost = area_m2 × sanding_rate
 *
 * For manual types (LASER, ROTATION, TABLEAUX):
 *   - Manual price input per line (stored in InvoiceLine)
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "shataf_rates",
        uniqueConstraints = @UniqueConstraint(columnNames = {"shataf_type", "min_thickness", "max_thickness"}))
public class ShatafRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "shataf_type", nullable = false)
    private ShatafType shatafType;

    /**
     * Minimum thickness in mm (inclusive)
     */
    @Column(name = "min_thickness", nullable = false)
    private Double minThickness;

    /**
     * Maximum thickness in mm (inclusive)
     */
    @Column(name = "max_thickness", nullable = false)
    private Double maxThickness;

    /**
     * Rate per meter (EGP/m)
     * For formula-based types: multiplied by calculated meters
     * For area-based types (SANDING): rate per square meter
     */
    @Column(name = "rate_per_meter", nullable = false)
    private Double ratePerMeter;

    /**
     * Whether this rate is currently active
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * JPA lifecycle callback - automatically set createdAt on entity creation
     */
    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    /**
     * JPA lifecycle callback - automatically update updatedAt on entity update
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Check if this rate applies to a given thickness
     */
    public boolean appliesToThickness(double thickness) {
        return thickness >= minThickness && thickness <= maxThickness;
    }

    /**
     * Validate rate configuration
     * Ensures min/max thickness are valid and rate is positive
     */
    public void validate() {
        if (minThickness == null || maxThickness == null) {
            throw new IllegalArgumentException("يجب تحديد السماكة الدنيا والعليا");
        }
        if (minThickness < 0) {
            throw new IllegalArgumentException("السماكة الدنيا يجب أن تكون موجبة");
        }
        if (maxThickness <= minThickness) {
            throw new IllegalArgumentException("السماكة العليا يجب أن تكون أكبر من السماكة الدنيا");
        }
        if (ratePerMeter == null || ratePerMeter < 0) {
            throw new IllegalArgumentException("السعر يجب أن يكون موجباً");
        }
        if (shatafType == null) {
            throw new IllegalArgumentException("يجب تحديد نوع الشطف");
        }
    }

    /**
     * Get a display string for the thickness range
     */
    public String getThicknessRangeDisplay() {
        return String.format("%.1f - %.1f mm", minThickness, maxThickness);
    }

    /**
     * Check if this rate overlaps with another rate for the same shataf type
     */
    public boolean overlapsWithRange(double otherMin, double otherMax) {
        return !(maxThickness < otherMin || minThickness > otherMax);
    }
}