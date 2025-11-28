package com.example.backend.domain.shared.exception;

/**
 * Base exception for all domain-level exceptions
 * Domain exceptions represent business rule violations
 */
public class DomainException extends RuntimeException {

    public DomainException(String message) {
        super(message);
    }

    public DomainException(String message, Throwable cause) {
        super(message, cause);
    }
}
