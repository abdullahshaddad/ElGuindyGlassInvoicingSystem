package com.example.backend.models.customer;

import com.example.backend.models.Invoice;
import com.example.backend.models.Payment;
import com.example.backend.models.enums.CustomerType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Customer Entity - Enhanced with customer type and balance tracking
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "customer")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "customer_type", nullable = false)
    private CustomerType customerType = CustomerType.REGULAR;

    /**
     * Current outstanding balance for this customer
     * For CASH customers, this should always be 0
     * For REGULAR and COMPANY customers, this tracks unpaid amounts
     */
    @Column(name = "balance", nullable = false)
    @Builder.Default
    private Double balance = 0.0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Invoice> invoices = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    /**
     * Convenience constructor for basic customer creation
     */
    public Customer(String name, String phone, String address, CustomerType customerType) {
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.customerType = customerType != null ? customerType : CustomerType.REGULAR;
        this.balance = 0.0;
        this.createdAt = LocalDateTime.now();
        this.invoices = new ArrayList<>();
        this.payments = new ArrayList<>();
    }

    public Customer(String name, String phone, String address) {
        this.name=name;
        this.phone=phone;
        this.address=address;

    }

    /**
     * Add amount to customer's balance (increase debt)
     */
    public void addToBalance(Double amount) {
        if (amount != null && amount > 0) {
            this.balance = (this.balance == null ? 0.0 : this.balance) + amount;
            this.updatedAt = LocalDateTime.now();
        }
    }

    /**
     * Subtract amount from customer's balance (payment received)
     */
    public void subtractFromBalance(Double amount) {
        if (amount != null && amount > 0) {
            this.balance = (this.balance == null ? 0.0 : this.balance) - amount;
            this.updatedAt = LocalDateTime.now();
        }
    }

    /**
     * Check if customer can have a balance
     */
    public boolean canHaveBalance() {
        return this.customerType != CustomerType.CASH;
    }

    /**
     * Validate balance is zero for cash customers
     */
    @PrePersist
    @PreUpdate
    public void validateBalance() {
        if (this.customerType == CustomerType.CASH && this.balance != null && this.balance != 0.0) {
            throw new IllegalStateException("عميل نقدي لا يمكن أن يكون له رصيد مستحق");
        }
    }
}