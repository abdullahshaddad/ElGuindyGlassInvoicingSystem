package com.example.backend.domain.customer.model;

import com.example.backend.domain.customer.exception.InvalidCustomerTypeException;
import com.example.backend.domain.shared.exception.DomainException;
import com.example.backend.domain.shared.valueobject.Money;
import com.example.backend.models.enums.CustomerType;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Customer Domain Entity (Rich Model)
 * Encapsulates all customer business logic and invariants
 */
@Getter
public class Customer {
    private final CustomerId id;
    private String name;
    private String phone;
    private String address;
    private CustomerType customerType;
    private Money balance;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Private constructor enforces invariants
    private Customer(CustomerId id, String name, String phone, String address,
                     CustomerType customerType, Money balance,
                     LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = Objects.requireNonNull(id, "Customer ID cannot be null");
        this.name = validateName(name);
        this.phone = phone;
        this.address = address;
        this.customerType = Objects.requireNonNull(customerType, "Customer type cannot be null");
        this.balance = balance != null ? balance : Money.zero();
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt;

        validateCustomerInvariants();
    }

    // Factory method for new customers
    public static Customer create(CustomerId id, String name, String phone, String address, CustomerType customerType) {
        return new Customer(id, name, phone, address, customerType, Money.zero(), LocalDateTime.now(), null);
    }

    // Factory method for reconstitution from database
    public static Customer reconstitute(CustomerId id, String name, String phone, String address,
                                       CustomerType customerType, Money balance,
                                       LocalDateTime createdAt, LocalDateTime updatedAt) {
        return new Customer(id, name, phone, address, customerType, balance, createdAt, updatedAt);
    }

    // Business methods

    /**
     * Add amount to customer balance (increase debt)
     * Only allowed for REGULAR and COMPANY customers
     */
    public void addToBalance(Money amount) {
        if (!canHaveBalance()) {
            throw new InvalidCustomerTypeException("عملاء النقد لا يمكنهم أن يكون لديهم رصيد مستحق");
        }
        Objects.requireNonNull(amount, "Amount cannot be null");
        if (amount.isZero()) {
            return; // No change
        }

        this.balance = this.balance.add(amount);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Subtract amount from customer balance (payment received)
     */
    public void subtractFromBalance(Money amount) {
        Objects.requireNonNull(amount, "Amount cannot be null");
        if (amount.isGreaterThan(this.balance)) {
            throw new DomainException("المبلغ المراد خصمه أكبر من الرصيد الحالي");
        }

        this.balance = this.balance.subtract(amount);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Update customer name
     */
    public void updateName(String newName) {
        this.name = validateName(newName);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Update phone number
     */
    public void updatePhone(String newPhone) {
        this.phone = newPhone;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Update address
     */
    public void updateAddress(String newAddress) {
        this.address = newAddress;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Change customer type
     * Only allowed if balance is zero
     */
    public void changeType(CustomerType newType) {
        if (!this.balance.isZero()) {
            throw new InvalidCustomerTypeException("لا يمكن تغيير نوع العميل بينما يوجد رصيد مستحق");
        }
        this.customerType = Objects.requireNonNull(newType, "Customer type cannot be null");
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Check if this customer type can have an outstanding balance
     */
    public boolean canHaveBalance() {
        return customerType != CustomerType.CASH;
    }

    /**
     * Check if customer has outstanding balance
     */
    public boolean hasOutstandingBalance() {
        return this.balance.isPositive();
    }

    // Validation

    private String validateName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("اسم العميل مطلوب");
        }
        return name.trim();
    }

    private void validateCustomerInvariants() {
        // CASH customers cannot have balance
        if (customerType == CustomerType.CASH && !balance.isZero()) {
            throw new InvalidCustomerTypeException("عملاء النقد لا يمكن أن يكون لديهم رصيد مستحق");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Customer)) return false;
        Customer customer = (Customer) o;
        return id.equals(customer.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Customer{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", type=" + customerType +
                ", balance=" + balance +
                '}';
    }
}
