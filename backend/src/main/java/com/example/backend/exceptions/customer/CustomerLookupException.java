package com.example.backend.exceptions.customer;

/**
 * Exception thrown when there's an error during customer lookup operations
 * Used for database errors or other technical issues during customer retrieval
 */
public class CustomerLookupException extends RuntimeException {

    private final Long customerId;

    public CustomerLookupException(String message) {
        super(message);
        this.customerId = null;
    }

    public CustomerLookupException(String message, Long customerId) {
        super(message);
        this.customerId = customerId;
    }

    public CustomerLookupException(String message, Throwable cause) {
        super(message, cause);
        this.customerId = null;
    }

    public CustomerLookupException(String message, Long customerId, Throwable cause) {
        super(message, cause);
        this.customerId = customerId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    /**
     * Create exception for database errors during customer lookup
     */
    public static CustomerLookupException databaseError(Long customerId, Throwable cause) {
        return new CustomerLookupException(
                "خطأ في قاعدة البيانات أثناء البحث عن العميل (ID: " + customerId + ")",
                customerId,
                cause
        );
    }

    /**
     * Create exception for unexpected errors during customer lookup
     */
    public static CustomerLookupException unexpectedError(Long customerId, Throwable cause) {
        return new CustomerLookupException(
                "خطأ غير متوقع أثناء البحث عن العميل (ID: " + customerId + ")",
                customerId,
                cause
        );
    }
}
