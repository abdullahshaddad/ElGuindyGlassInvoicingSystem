package com.example.backend.exceptions.invoice;

import lombok.Getter;

/**
 * Base exception for invoice-related errors
 */
@Getter
public class InvoiceException extends RuntimeException {
    private final String arabicMessage;

    public InvoiceException(String message) {
        super(message);
        this.arabicMessage = message;
    }

    public InvoiceException(String message, Throwable cause) {
        super(message, cause);
        this.arabicMessage = message;
    }

    public InvoiceException(String message, String arabicMessage, Throwable cause) {
        super(message, cause);
        this.arabicMessage = arabicMessage;
    }

}

