package com.example.backend.exceptions.invoice;

import lombok.Getter;

/**
 * Exception thrown when glass type is not found
 */
@Getter
public class GlassTypeNotFoundException extends com.example.backend.exceptions.invoice.InvoiceException {
    private final Long glassTypeId;

    public GlassTypeNotFoundException(Long glassTypeId) {
        super("Glass type not found: " + glassTypeId);
        this.glassTypeId = glassTypeId;
    }

    public GlassTypeNotFoundException(String message, Long glassTypeId) {
        super(message);
        this.glassTypeId = glassTypeId;
    }

}
