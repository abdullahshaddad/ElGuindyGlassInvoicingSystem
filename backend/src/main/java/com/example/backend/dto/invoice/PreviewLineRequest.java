package com.example.backend.dto.invoice;

import com.example.backend.models.enums.CuttingType;
import com.example.backend.models.enums.DimensionUnit;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private DimensionUnit dimensionUnit; // ADD THIS FIELD

    @NotNull(message = "Cutting type is required")
    private CuttingType cuttingType;

    @PositiveOrZero(message = "Manual cutting price cannot be negative")
    private Double manualCuttingPrice;
}