package com.example.backend.exceptions.invoice;

/**
 * Exception thrown when customer resolution fails
 */
public class CustomerResolutionException extends com.example.backend.exceptions.invoice.InvoiceException {
    public CustomerResolutionException(String message) {
        super(message);
    }

    public CustomerResolutionException(String message, Throwable cause) {
        super(message, cause);
    }
}
