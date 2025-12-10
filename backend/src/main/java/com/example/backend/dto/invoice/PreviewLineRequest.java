package com.example.backend.dto.invoice;

import com.example.backend.models.enums.CuttingType;
import com.example.backend.models.enums.DimensionUnit;
import com.example.backend.models.enums.ShatafType;
import com.example.backend.models.enums.FarmaType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import com.example.backend.dto.OperationRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Preview Line Request DTO
 * Supports both legacy (cuttingType) and new (shatafType/farmaType) formats
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreviewLineRequest {
    @NotNull(message = "Glass type is required")
    private Long glassTypeId;

    @NotNull(message = "Width is required")
    @Positive(message = "Width must be positive")
    private Double width; // In the unit specified by dimensionUnit

    @NotNull(message = "Height is required")
    @Positive(message = "Height must be positive")
    private Double height; // In the unit specified by dimensionUnit

    @NotNull(message = "Dimension unit is required")
    private DimensionUnit dimensionUnit;

    // LEGACY: For backward compatibility (optional now)
    private CuttingType cuttingType;

    // NEW: Enhanced shataf/farma support
    private List<OperationRequest> operations;

    // LEGACY: Kept for backward compatibility
    private ShatafType shatafType;
    private FarmaType farmaType;
    private Double diameter; // For wheel cut (العجلة)

    @PositiveOrZero(message = "Manual cutting price cannot be negative")
    private Double manualCuttingPrice;

    /**
     * Get effective cutting type for legacy preview calculation
     * 
     * @return CuttingType for calculation, defaults to SHATF if shatafType is set
     */
    public CuttingType getEffectiveCuttingType() {
        if (cuttingType != null) {
            return cuttingType;
        }

        // If using new format with shatafType, map to legacy
        if (shatafType != null) {
            return shatafType.isManualInput() ? CuttingType.LASER : CuttingType.SHATF;
        }

        // Default to SHATF
        return CuttingType.SHATF;
    }
}