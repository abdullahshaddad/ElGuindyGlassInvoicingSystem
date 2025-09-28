package com.example.backend.exceptions.invoice;

/**
 * Exception thrown when invoice update fails
 */
public class InvoiceUpdateException extends com.example.backend.exceptions.invoice.InvoiceException {
    public InvoiceUpdateException(String message) {
        super(message);
    }

    public InvoiceUpdateException(String message, Throwable cause) {
        super(message, cause);
    }
}
