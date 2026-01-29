package com.example.backend.dto;

import com.example.backend.models.enums.CuttingType;
import com.example.backend.models.enums.DimensionUnit;
import com.example.backend.models.enums.ShatafType;
import com.example.backend.models.enums.FarmaType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Create Invoice Line Request DTO
 * UPDATED to support multiple operations per line (NEW)
 * Also supports legacy single operation format for backward compatibility
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceLineRequest {
    // Getters and Setters
    @NotNull(message = "Glass type is required")
    private Long glassTypeId;

    @NotNull(message = "Width is required")
    @Positive(message = "Width must be positive")
    private Double width;

    @NotNull(message = "Height is required")
    @Positive(message = "Height must be positive")
    private Double height;

    @NotNull(message = "Dimension unit is required")
    private DimensionUnit dimensionUnit;

    /**
     * Quantity - number of pieces (default 1)
     */
    @Positive(message = "Quantity must be positive")
    @Builder.Default
    private Integer quantity = 1;

    // NEW: Multiple operations support
    @Valid
    @Builder.Default
    private List<OperationRequest> operations = new ArrayList<>();

    // LEGACY: Single operation fields (for backward compatibility - will be
    // deprecated)
    private ShatafType shatafType;
    private FarmaType farmaType;
    private Double diameter; // For wheel cut (العجلة)
    private CuttingType cuttingType;

    @PositiveOrZero(message = "Manual cutting price cannot be negative")
    private Double manualCuttingPrice; // For laser cutting

    private String notes;

    /**
     * Get effective shataf type (convert from legacy if needed)
     */
    public ShatafType getEffectiveShatafType() {
        if (shatafType != null) {
            return shatafType;
        }

        // Convert legacy cutting type
        if (cuttingType == CuttingType.LASER) {
            return null; // Laser is no longer a ShatafType
        } else if (cuttingType == CuttingType.SHATF) {
            return ShatafType.KHARAZAN; // Default
        }

        return null;
    }

    /**
     * Get effective farma type (default to NORMAL_SHATAF if not specified)
     */
    public FarmaType getEffectiveFarmaType() {
        if (farmaType != null) {
            return farmaType;
        }

        // Default for formula-based types
        if (shatafType != null && shatafType.isFormulaBased()) {
            return FarmaType.NORMAL_SHATAF;
        }

        return FarmaType.NORMAL_SHATAF; // Safe default
    }

    /**
     * Check if this request uses the new operations format
     */
    public boolean hasOperations() {
        return operations != null && !operations.isEmpty();
    }

    /**
     * Check if this request uses the legacy single operation format
     */
    public boolean hasLegacyOperation() {
        return cuttingType != null || shatafType != null;
    }

    /**
     * Validate that either operations or legacy fields are provided
     */
    public void validate() {
        if (!hasOperations() && !hasLegacyOperation()) {
            throw new IllegalArgumentException("يجب توفير عملية واحدة على الأقل (operations أو legacy fields)");
        }
    }
}
