package com.example.backend.exceptions.invoice;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

/**
 * Exception thrown when invoice line creation fails
 */
public class InvoiceLineCreationException extends com.example.backend.exceptions.invoice.InvoiceException {
    private final List<String> lineErrors;

    public InvoiceLineCreationException(String message) {
        super(message);
        this.lineErrors = Collections.emptyList();
    }

    public InvoiceLineCreationException(String message, List<String> lineErrors) {
        super(message);
        this.lineErrors = lineErrors != null ? new ArrayList<>(lineErrors) : Collections.emptyList();
    }

    public InvoiceLineCreationException(String message, Throwable cause) {
        super(message, cause);
        this.lineErrors = Collections.emptyList();
    }

    public Collection<? extends String> getLineErrors() {
        return new ArrayList<>(lineErrors);
    }
}
