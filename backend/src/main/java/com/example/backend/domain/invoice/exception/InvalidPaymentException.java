package com.example.backend.domain.invoice.exception;

import com.example.backend.domain.shared.exception.DomainException;

public class InvalidPaymentException extends DomainException {
    public InvalidPaymentException(String message) {
        super(message);
    }
}
