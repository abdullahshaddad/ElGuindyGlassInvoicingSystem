package com.example.backend.domain.invoice.model;

import com.example.backend.domain.shared.valueobject.EntityId;

/**
 * Type-safe Invoice ID
 */
public final class InvoiceId extends EntityId {

    public InvoiceId(Long value) {
        super(value);
    }

    public static InvoiceId of(Long value) {
        return new InvoiceId(value);
    }
}
