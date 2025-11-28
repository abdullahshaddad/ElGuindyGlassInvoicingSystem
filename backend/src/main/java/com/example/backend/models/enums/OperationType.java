package com.example.backend.models.enums;

import lombok.Getter;

/**
 * Operation Type Enum
 * Represents different types of operations that can be performed on a glass piece
 */
@Getter
public enum OperationType {
    SHATAF("شطف", "Shataf cutting operation"),
    FARMA("فارمة", "Farma operation"),
    LASER("ليزر", "Laser cutting/engraving operation");

    private final String arabicName;
    private final String description;

    OperationType(String arabicName, String description) {
        this.arabicName = arabicName;
        this.description = description;
    }

    /**
     * Check if this operation type requires manual price input
     */
    public boolean requiresManualPrice() {
        return this == LASER;
    }

    /**
     * Check if this operation type uses formula-based calculation
     */
    public boolean usesFormulaCalculation() {
        return this == SHATAF || this == FARMA;
    }
}
