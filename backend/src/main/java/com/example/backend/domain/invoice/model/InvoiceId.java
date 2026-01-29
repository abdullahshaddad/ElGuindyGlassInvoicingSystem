package com.example.backend.domain.invoice.model;

import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.io.Serializable;

/**
 * Type-safe Invoice ID
 * Uses String to support readable invoice IDs (e.g., "INV-2024-001")
 */
@Getter
@EqualsAndHashCode
public final class InvoiceId implements Serializable {
    private final String value;

    /**
     * Constructor that accepts null for new entities (ID will be generated on save)
     * or a non-blank string for existing entities
     */
    public InvoiceId(String value) {
        if (value != null && value.isBlank()) {
            throw new IllegalArgumentException("Invoice ID cannot be blank");
        }
        this.value = value;
    }

    public static InvoiceId of(String value) {
        return new InvoiceId(value);
    }

    /**
     * Create a new InvoiceId for unsaved entities
     */
    public static InvoiceId newId() {
        return new InvoiceId(null);
    }

    public boolean isNew() {
        return value == null;
    }

    @Override
    public String toString() {
        return value != null ? value : "NEW";
    }
}
