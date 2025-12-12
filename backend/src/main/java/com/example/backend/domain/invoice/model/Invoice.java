package com.example.backend.domain.invoice.model;

import com.example.backend.domain.customer.model.CustomerId;
import com.example.backend.domain.invoice.exception.InvalidPaymentException;
import com.example.backend.domain.shared.valueobject.Money;
import com.example.backend.models.enums.InvoiceStatus;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Invoice Domain Entity (Aggregate Root)
 * Manages invoice lines and payment tracking
 *
 * FIX BUG #8: Uses Money (BigDecimal) instead of Double for precision
 * FIX BUG #10: Single source of truth for balance tracking
 */
@Getter
public class Invoice {
    private final InvoiceId id;
    private final CustomerId customerId;
    private final List<InvoiceLine> lines;
    private Money totalPrice;
    private Money amountPaid;
    private Money remainingBalance;
    private InvoiceStatus status;
    private final LocalDateTime issueDate;
    private LocalDateTime paymentDate;
    private String notes;

    private Invoice(InvoiceId id, CustomerId customerId, LocalDateTime issueDate) {
        this.id = Objects.requireNonNull(id, "Invoice ID cannot be null");
        this.customerId = Objects.requireNonNull(customerId, "Customer ID cannot be null");
        this.lines = new ArrayList<>();
        this.totalPrice = Money.zero();
        this.amountPaid = Money.zero();
        this.remainingBalance = Money.zero();
        this.status = InvoiceStatus.PENDING;
        this.issueDate = issueDate != null ? issueDate : LocalDateTime.now();
    }

    // Factory method for new invoice
    public static Invoice create(InvoiceId id, CustomerId customerId) {
        return new Invoice(id, customerId, LocalDateTime.now());
    }

    // Factory method for reconstitution from database
    public static Invoice reconstitute(InvoiceId id, CustomerId customerId,
                                      Money totalPrice, Money amountPaid, Money remainingBalance,
                                      InvoiceStatus status, LocalDateTime issueDate,
                                      LocalDateTime paymentDate, String notes) {
        Invoice invoice = new Invoice(id, customerId, issueDate);
        invoice.totalPrice = totalPrice;
        invoice.amountPaid = amountPaid;
        invoice.remainingBalance = remainingBalance;
        invoice.status = status;
        invoice.paymentDate = paymentDate;
        invoice.notes = notes;
        return invoice;
    }

    // Business methods

    /**
     * Add a line to the invoice and recalculate totals
     */
    public void addLine(InvoiceLine line) {
        Objects.requireNonNull(line, "Invoice line cannot be null");
        lines.add(line);
        recalculateTotal();
    }

    /**
     * Add line without recalculation (for reconstitution)
     */
    public void addLineWithoutRecalculation(InvoiceLine line) {
        Objects.requireNonNull(line, "Invoice line cannot be null");
        lines.add(line);
    }

    /**
     * Record a payment on this invoice
     * FIX BUG #8: Uses Money for proper precision comparison
     */
    public void recordPayment(Money amount) {
        Objects.requireNonNull(amount, "Payment amount cannot be null");

        if (amount.isZero()) {
            return; // No payment to record
        }

        if (amount.isGreaterThan(remainingBalance)) {
            throw new InvalidPaymentException("مبلغ الدفع أكبر من المبلغ المتبقي");
        }

        this.amountPaid = this.amountPaid.add(amount);
        this.remainingBalance = this.remainingBalance.subtract(amount);
        updateStatus();
    }

    /**
     * Reverse a payment (for payment deletion)
     */
    public void reversePayment(Money amount) {
        Objects.requireNonNull(amount, "Payment amount cannot be null");

        if (amount.isGreaterThan(amountPaid)) {
            throw new InvalidPaymentException("لا يمكن عكس مبلغ أكبر من المبلغ المدفوع");
        }

        this.amountPaid = this.amountPaid.subtract(amount);
        this.remainingBalance = this.remainingBalance.add(amount);
        updateStatus();
    }

    /**
     * Set initial payment (at invoice creation)
     */
    public void setInitialPayment(Money amount) {
        Objects.requireNonNull(amount, "Payment amount cannot be null");

        if (amount.isGreaterThan(totalPrice)) {
            throw new InvalidPaymentException("مبلغ الدفع الأولي أكبر من إجمالي الفاتورة");
        }

        this.amountPaid = amount;
        this.remainingBalance = totalPrice.subtract(amount);
        updateStatus();
    }

    /**
     * Update invoice notes
     */
    public void updateNotes(String notes) {
        this.notes = notes;
    }

    /**
     * Check if invoice is fully paid
     * FIX BUG #8: Uses Money.isZero() instead of floating-point comparison
     */
    public boolean isFullyPaid() {
        return status == InvoiceStatus.PAID || remainingBalance.isZero();
    }

    /**
     * Check if invoice has any payment
     */
    public boolean hasPayment() {
        return amountPaid.isPositive();
    }

    /**
     * Get lines as unmodifiable list
     */
    public List<InvoiceLine> getLines() {
        return Collections.unmodifiableList(lines);
    }

    // Private helpers

    /**
     * Recalculate invoice total from all lines
     */
    private void recalculateTotal() {
        this.totalPrice = lines.stream()
                .map(InvoiceLine::getTotalPrice)
                .reduce(Money.zero(), Money::add);

        // Remaining balance = total - amount paid
        this.remainingBalance = totalPrice.subtract(amountPaid);
    }

    /**
     * Update status based on payment state
     */
    private void updateStatus() {
        if (remainingBalance.isZero()) {
            this.status = InvoiceStatus.PAID;
            if (this.paymentDate == null) {
                this.paymentDate = LocalDateTime.now();
            }
        } else if (amountPaid.isPositive()) {
            this.status = InvoiceStatus.PARTIALLY_PAID;
        } else {
            this.status = InvoiceStatus.PENDING;
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Invoice)) return false;
        Invoice invoice = (Invoice) o;
        return id.equals(invoice.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Invoice{" +
                "id=" + id +
                ", customerId=" + customerId +
                ", totalPrice=" + totalPrice +
                ", amountPaid=" + amountPaid +
                ", remainingBalance=" + remainingBalance +
                ", status=" + status +
                ", lines=" + lines.size() +
                '}';
    }
}
