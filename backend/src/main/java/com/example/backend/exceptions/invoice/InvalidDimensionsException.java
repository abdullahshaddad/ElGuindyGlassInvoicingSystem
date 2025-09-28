package com.example.backend.exceptions.invoice;

import lombok.Getter;

/**
 * Exception thrown when dimensions are invalid
 */
@Getter
public class InvalidDimensionsException extends com.example.backend.exceptions.invoice.InvoiceException {
    private final Double width;
    private final Double height;

    public InvalidDimensionsException(String message) {
        super(message);
        this.width = null;
        this.height = null;
    }

    public InvalidDimensionsException(String message, Double width, Double height) {
        super(message);
        this.width = width;
        this.height = height;
    }

}
