package com.example.backend.exceptions;

/**
 * Exception thrown when payment operations fail
 */
public class PaymentException extends RuntimeException {
    
    public PaymentException(String message) {
        super(message);
    }
    
    public PaymentException(String message, Throwable cause) {
        super(message, cause);
    }
    
    /**
     * Create exception for invalid payment amount
     */
    public static PaymentException invalidAmount(Double amount) {
        return new PaymentException(
            String.format("مبلغ الدفع غير صالح: %.2f", amount)
        );
    }
    
    /**
     * Create exception for payment exceeding balance
     */
    public static PaymentException exceedsBalance(Double payment, Double balance) {
        return new PaymentException(
            String.format("المبلغ المدفوع (%.2f ج.م) يتجاوز الرصيد المستحق (%.2f ج.م)", 
                payment, balance)
        );
    }
    
    /**
     * Create exception for cash customer payment
     */
    public static PaymentException cashCustomerPayment() {
        return new PaymentException(
            "العملاء النقديون يجب أن يدفعوا كامل المبلغ عند إنشاء الفاتورة"
        );
    }
}
