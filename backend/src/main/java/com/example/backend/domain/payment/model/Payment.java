package com.example.backend.domain.payment.model;

import com.example.backend.domain.customer.model.CustomerId;
import com.example.backend.domain.invoice.model.InvoiceId;
import com.example.backend.domain.shared.valueobject.Money;
import com.example.backend.models.enums.PaymentMethod;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Payment Domain Entity
 * Represents a payment transaction
 */
@Getter
public class Payment {
    private final PaymentId id;
    private final CustomerId customerId;
    private final InvoiceId invoiceId;
    private final Money amount;
    private final PaymentMethod paymentMethod;
    private final LocalDateTime paymentDate;
    private final String notes;
    private final String createdBy;

    private Payment(PaymentId id, CustomerId customerId, InvoiceId invoiceId,
                   Money amount, PaymentMethod paymentMethod, LocalDateTime paymentDate,
                   String notes, String createdBy) {
        this.id = Objects.requireNonNull(id, "Payment ID cannot be null");
        this.customerId = Objects.requireNonNull(customerId, "Customer ID cannot be null");
        this.invoiceId = invoiceId; // Can be null for general customer payments
        this.amount = Objects.requireNonNull(amount, "Amount cannot be null");
        this.paymentMethod = Objects.requireNonNull(paymentMethod, "Payment method cannot be null");
        this.paymentDate = paymentDate != null ? paymentDate : LocalDateTime.now();
        this.notes = notes;
        this.createdBy = createdBy;

        validateAmount();
    }

    // Factory method for new payment
    public static Payment create(PaymentId id, CustomerId customerId, InvoiceId invoiceId,
                                Money amount, PaymentMethod paymentMethod,
                                String notes, String createdBy) {
        return new Payment(id, customerId, invoiceId, amount, paymentMethod,
                          LocalDateTime.now(), notes, createdBy);
    }

    // Factory method for reconstitution
    public static Payment reconstitute(PaymentId id, CustomerId customerId, InvoiceId invoiceId,
                                      Money amount, PaymentMethod paymentMethod,
                                      LocalDateTime paymentDate, String notes, String createdBy) {
        return new Payment(id, customerId, invoiceId, amount, paymentMethod,
                          paymentDate, notes, createdBy);
    }

    // Business methods

    /**
     * Check if payment is linked to an invoice
     */
    public boolean isInvoicePayment() {
        return invoiceId != null;
    }

    /**
     * Check if payment is a general customer payment
     */
    public boolean isGeneralPayment() {
        return invoiceId == null;
    }

    // Validation

    private void validateAmount() {
        if (!amount.isPositive()) {
            throw new IllegalArgumentException("مبلغ الدفع يجب أن يكون موجباً");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Payment)) return false;
        Payment payment = (Payment) o;
        return id.equals(payment.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Payment{" +
                "id=" + id +
                ", customerId=" + customerId +
                ", invoiceId=" + invoiceId +
                ", amount=" + amount +
                ", paymentMethod=" + paymentMethod +
                ", paymentDate=" + paymentDate +
                '}';
    }
}
