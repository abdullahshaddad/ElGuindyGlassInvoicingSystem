package com.example.backend.exceptions.customer;

/**
 * Exception thrown when customer update operations fail
 */
public class CustomerUpdateException extends RuntimeException {

    private final Long customerId;

    public CustomerUpdateException(String message, Long customerId) {
        super(message);
        this.customerId = customerId;
    }

    public CustomerUpdateException(String message, Long customerId, Throwable cause) {
        super(message, cause);
        this.customerId = customerId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    /**
     * Create exception for database errors during customer update
     */
    public static CustomerUpdateException databaseError(Long customerId, Throwable cause) {
        return new CustomerUpdateException(
                "خطأ في قاعدة البيانات أثناء تحديث العميل (ID: " + customerId + ")",
                customerId,
                cause
        );
    }
}
