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

    @PreUpdate
    public void preUpdate() {
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
     */
    @PrePersist
    @PreUpdate
    public void validateRate() {
        if (minThickness == null || maxThickness == null) {
            throw new IllegalStateException("نطاق السماكة مطلوب");
        }

        if (minThickness < 0 || maxThickness < 0) {
            throw new IllegalStateException("السماكة لا يمكن أن تكون سالبة");
        }

        if (minThickness > maxThickness) {
            throw new IllegalStateException("الحد الأدنى للسماكة لا يمكن أن يكون أكبر من الحد الأقصى");
        }

        if (ratePerMeter == null || ratePerMeter < 0) {
            throw new IllegalStateException("السعر لكل متر مطلوب ولا يمكن أن يكون سالباً");
        }

        if (shatafType == null) {
            throw new IllegalStateException("نوع الشطف مطلوب");
        }

        // Manual types should not have rates in this table
        if (shatafType.isManualInput()) {
            throw new IllegalStateException("الأنواع اليدوية (" + shatafType.getArabicName() + ") لا تستخدم جدول الأسعار");
        }
    }
}