package com.example.backend.domain.customer.exception;

import com.example.backend.domain.shared.exception.DomainException;

public class InvalidCustomerTypeException extends DomainException {
    public InvalidCustomerTypeException(String message) {
        super(message);
    }
}
