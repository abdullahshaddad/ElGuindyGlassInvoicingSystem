package com.example.backend.models.enums;

/**
 * Payment Method Enum
 * Defines different methods customers can use to make payments
 */
public enum PaymentMethod {
    /**
     * Cash payment
     */
    CASH,
    
    /**
     * Credit/Debit card payment
     */
    CARD,
    
    /**
     * Bank transfer
     */
    BANK_TRANSFER,
    
    /**
     * Check payment
     */
    CHECK,
    
    /**
     * Other payment methods
     */
    OTHER
}
