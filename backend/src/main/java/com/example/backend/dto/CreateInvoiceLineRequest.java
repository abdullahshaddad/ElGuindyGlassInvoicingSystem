package com.example.backend.dto;

import com.example.backend.models.enums.CuttingType;
import com.example.backend.models.enums.DimensionUnit;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

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

    @NotNull(message = "Cutting type is required")
    private CuttingType cuttingType;

    @PositiveOrZero(message = "Manual cutting price cannot be negative")
    private Double manualCuttingPrice; // For laser cutting

    private String notes;

}
