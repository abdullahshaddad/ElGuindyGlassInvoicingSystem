package com.example.backend.models.enums;

/**
 * Payment Method Enum
 * Defines different methods customers can use to make payments
 */
public enum PaymentMethod {
    /**
     * Cash payment - نقدي
     */
    CASH,

    /**
     * Credit/Debit card payment - بطاقة
     */
    CARD,

    /**
     * Bank transfer - تحويل بنكي
     */
    BANK_TRANSFER,

    /**
     * Check payment - شيك
     */
    CHECK,

    /**
     * Vodafone Cash - فودافون كاش
     */
    VODAFONE_CASH,

    /**
     * Other payment methods - أخرى
     */
    OTHER
}
