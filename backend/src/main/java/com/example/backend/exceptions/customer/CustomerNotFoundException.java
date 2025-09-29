package com.example.backend.exceptions.customer;

/**
 * Exception thrown when a customer is not found by ID
 * Used specifically for customer lookup operations during invoice creation
 */
public class CustomerNotFoundException extends RuntimeException {

    private final Long customerId;

    public CustomerNotFoundException(String message) {
        super(message);
        this.customerId = null;
    }

    public CustomerNotFoundException(String message, Long customerId) {
        super(message);
        this.customerId = customerId;
    }

    public CustomerNotFoundException(String message, Throwable cause) {
        super(message, cause);
        this.customerId = null;
    }

    public CustomerNotFoundException(String message, Long customerId, Throwable cause) {
        super(message, cause);
        this.customerId = customerId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    /**
     * Create exception with Arabic message for customer ID
     */
    public static CustomerNotFoundException forCustomerId(Long customerId) {
        return new CustomerNotFoundException(
                "العميل غير موجود (ID: " + customerId + ")",
                customerId
        );
    }

    /**
     * Create exception with Arabic message for customer ID and cause
     */
    public static CustomerNotFoundException forCustomerId(Long customerId, Throwable cause) {
        return new CustomerNotFoundException(
                "العميل غير موجود (ID: " + customerId + ")",
                customerId,
                cause
        );
    }
}

