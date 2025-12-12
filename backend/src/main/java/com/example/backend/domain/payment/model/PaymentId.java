package com.example.backend.domain.payment.model;

import com.example.backend.domain.shared.valueobject.EntityId;

/**
 * Type-safe Payment ID
 */
public final class PaymentId extends EntityId {

    public PaymentId(Long value) {
        super(value);
    }

    public static PaymentId of(Long value) {
        return new PaymentId(value);
    }
}
