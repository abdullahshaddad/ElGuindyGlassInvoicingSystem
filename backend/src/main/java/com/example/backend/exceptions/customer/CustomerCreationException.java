package com.example.backend.exceptions.customer;

/**
 * Exception thrown when customer creation fails
 * Used when creating new customers through the customer management interface
 */
public class CustomerCreationException extends RuntimeException {

    private final String customerName;
    private final String customerPhone;

    public CustomerCreationException(String message) {
        super(message);
        this.customerName = null;
        this.customerPhone = null;
    }

    public CustomerCreationException(String message, String customerName, String customerPhone) {
        super(message);
        this.customerName = customerName;
        this.customerPhone = customerPhone;
    }

    public CustomerCreationException(String message, Throwable cause) {
        super(message, cause);
        this.customerName = null;
        this.customerPhone = null;
    }

    public CustomerCreationException(String message, String customerName, String customerPhone, Throwable cause) {
        super(message, cause);
        this.customerName = customerName;
        this.customerPhone = customerPhone;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    /**
     * Create exception for duplicate phone number
     */
    public static CustomerCreationException duplicatePhone(String customerName, String phone) {
        return new CustomerCreationException(
                "رقم الهاتف موجود بالفعل: " + phone,
                customerName,
                phone
        );
    }

    /**
     * Create exception for invalid customer data
     */
    public static CustomerCreationException invalidData(String message, String customerName, String phone) {
        return new CustomerCreationException(
                "بيانات العميل غير صالحة: " + message,
                customerName,
                phone
        );
    }
}
