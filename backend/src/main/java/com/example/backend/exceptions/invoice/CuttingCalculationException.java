package com.example.backend.exceptions.invoice;

import lombok.Getter;

/**
 * Exception thrown when cutting calculation fails
 */
@Getter
public class CuttingCalculationException extends com.example.backend.exceptions.invoice.InvoiceException {
    private final String cuttingType;
    private final Double thickness;

    public CuttingCalculationException(String message) {
        super(message);
        this.cuttingType = null;
        this.thickness = null;
    }

    public CuttingCalculationException(String message, String cuttingType, Double thickness) {
        super(message);
        this.cuttingType = cuttingType;
        this.thickness = thickness;
    }

    public CuttingCalculationException(String message, Throwable cause) {
        super(message, cause);
        this.cuttingType = null;
        this.thickness = null;
    }

}
