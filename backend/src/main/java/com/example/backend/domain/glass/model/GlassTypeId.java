package com.example.backend.domain.glass.model;

import com.example.backend.domain.shared.valueobject.EntityId;

/**
 * Type-safe GlassType ID
 */
public final class GlassTypeId extends EntityId {

    public GlassTypeId(Long value) {
        super(value);
    }

    public static GlassTypeId of(Long value) {
        return new GlassTypeId(value);
    }
}
