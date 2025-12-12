package com.example.backend.domain.shared.valueobject;

import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.io.Serializable;
import java.util.Objects;

/**
 * Base class for type-safe entity identifiers
 * Provides type safety to prevent mixing different entity IDs
 */
@Getter
@EqualsAndHashCode
public abstract class EntityId implements Serializable {
    private final Long value;

    protected EntityId(Long value) {
        Objects.requireNonNull(value, "Entity ID cannot be null");
        if (value <= 0) {
            throw new IllegalArgumentException("Entity ID must be positive: " + value);
        }
        this.value = value;
    }

    @Override
    public String toString() {
        return value.toString();
    }
}
