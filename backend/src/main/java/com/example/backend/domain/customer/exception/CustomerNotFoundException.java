package com.example.backend.domain.customer.exception;

import com.example.backend.domain.shared.exception.DomainException;

public class CustomerNotFoundException extends DomainException {
    public CustomerNotFoundException(String message) {
        super(message);
    }

    public static CustomerNotFoundException forId(Long id) {
        return new CustomerNotFoundException("العميل غير موجود برقم: " + id);
    }
}
