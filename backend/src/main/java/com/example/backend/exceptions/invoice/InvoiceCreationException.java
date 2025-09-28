package com.example.backend.exceptions.invoice;

/**
 * Exception thrown when invoice creation fails
 */
public class InvoiceCreationException extends com.example.backend.exceptions.invoice.InvoiceException {
    public InvoiceCreationException(String message) {
        super(message);
    }

    public InvoiceCreationException(String message, Throwable cause) {
        super(message, cause);
    }
}
