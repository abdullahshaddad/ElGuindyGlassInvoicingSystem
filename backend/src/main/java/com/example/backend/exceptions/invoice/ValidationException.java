package com.example.backend.exceptions.invoice;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Exception thrown when request validation fails
 */
public class ValidationException extends com.example.backend.exceptions.invoice.InvoiceException {
    private final List<String> validationErrors;

    public ValidationException(String message) {
        super(message);
        this.validationErrors = Collections.emptyList();
    }

    public ValidationException(String message, List<String> validationErrors) {
        super(message);
        this.validationErrors = validationErrors != null ? new ArrayList<>(validationErrors) : Collections.emptyList();
    }

    public List<String> getValidationErrors() {
        return new ArrayList<>(validationErrors);
    }
}
