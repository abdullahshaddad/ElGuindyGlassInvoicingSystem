package com.example.backend.domain.customer.model;

import com.example.backend.domain.shared.valueobject.EntityId;

/**
 * Type-safe Customer ID
 */
public final class CustomerId extends EntityId {

    public CustomerId(Long value) {
        super(value);
    }

    public static CustomerId of(Long value) {
        return new CustomerId(value);
    }
}
