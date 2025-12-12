package com.example.backend.models;

import com.example.backend.models.enums.OperationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * OperationPrice Entity
 * Stores base pricing for different operation types and subtypes
 * Used as reference pricing for operations (especially LASER types)
 */
@Entity
@Table(name = "operation_prices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Main operation type (SHATAF, FARMA, LASER)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "operation_type", nullable = false)
    private OperationType operationType;

    /**
     * Subtype name (e.g., "NORMAL", "DEEP", "ENGRAVE", "POLISH" for LASER)
     * For LASER: NORMAL, DEEP, ENGRAVE, POLISH
     * For FARMA/SHATAF: Could be used for special manual types
     */
    @Column(name = "subtype", nullable = false, length = 100)
    private String subtype;

    /**
     * Display name in Arabic
     */
    @Column(name = "arabic_name", nullable = false, length = 100)
    private String arabicName;

    /**
     * Display name in English
     */
    @Column(name = "english_name", length = 100)
    private String englishName;

    /**
     * Base price for this operation type
     */
    @Column(name = "base_price", nullable = false)
    private Double basePrice;

    /**
     * Unit of measurement (e.g., "per piece", "per meter", "per cm")
     */
    @Column(name = "unit", length = 50)
    private String unit;

    /**
     * Description/notes about this operation price
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * Whether this price configuration is active
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    /**
     * Display order for UI sorting
     */
    @Column(name = "display_order")
    private Integer displayOrder;

    /**
     * Validation before persistence
     */
    @PrePersist
    @PreUpdate
    public void validatePrice() {
        if (operationType == null) {
            throw new IllegalStateException("نوع العملية مطلوب");
        }
        if (subtype == null || subtype.trim().isEmpty()) {
            throw new IllegalStateException("النوع الفرعي مطلوب");
        }
        if (arabicName == null || arabicName.trim().isEmpty()) {
            throw new IllegalStateException("الاسم بالعربية مطلوب");
        }
        if (basePrice == null || basePrice < 0) {
            throw new IllegalStateException("السعر يجب أن يكون صفر أو أكبر");
        }
    }
}
