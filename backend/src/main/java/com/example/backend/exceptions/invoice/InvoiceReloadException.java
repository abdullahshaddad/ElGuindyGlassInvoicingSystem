package com.example.backend.exceptions.invoice;

/**
 * Exception thrown when invoice reload fails
 */
public class InvoiceReloadException extends com.example.backend.exceptions.invoice.InvoiceException {
    public InvoiceReloadException(String message) {
        super(message);
    }

    public InvoiceReloadException(String message, Throwable cause) {
        super(message, cause);
    }
}
