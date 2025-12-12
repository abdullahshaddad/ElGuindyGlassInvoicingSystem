package com.example.backend.domain.invoice.model;

import com.example.backend.domain.shared.valueobject.EntityId;

/**
 * Type-safe InvoiceLine ID
 */
public final class InvoiceLineId extends EntityId {

    public InvoiceLineId(Long value) {
        super(value);
    }

    public static InvoiceLineId of(Long value) {
        return new InvoiceLineId(value);
    }
}
