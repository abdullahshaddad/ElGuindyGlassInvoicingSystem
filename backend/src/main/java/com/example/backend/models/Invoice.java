package com.example.backend.models;

import com.example.backend.models.customer.Customer;
import com.example.backend.models.enums.InvoiceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Invoice Entity - Enhanced with payment tracking
 */
@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "invoice")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "issue_date", nullable = false)
    private LocalDateTime issueDate = LocalDateTime.now();

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Column(name = "total_price", nullable = false)
    private Double totalPrice = 0.0;

    /**
     * Amount paid at the time of invoice creation
     */
    @Column(name = "amount_paid_now")
    @Builder.Default
    private Double amountPaidNow = 0.0;

    /**
     * Remaining balance on this invoice
     * For CASH customers: must be 0
     * For REGULAR/COMPANY: can be > 0
     */
    @Column(name = "remaining_balance")
    @Builder.Default
    private Double remainingBalance = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InvoiceStatus status = InvoiceStatus.PENDING;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<InvoiceLine> invoiceLines = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PrintJob> printJobs = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "pdf_url")
    private String pdfUrl;

    /**
     * Convenience constructor
     */
    public Invoice(Customer customer) {
        this.customer = customer;
        this.issueDate = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.totalPrice = 0.0;
        this.amountPaidNow = 0.0;
        this.remainingBalance = 0.0;
        this.status = InvoiceStatus.PENDING;
        this.invoiceLines = new ArrayList<>();
        this.printJobs = new ArrayList<>();
        this.payments = new ArrayList<>();
    }

    /**
     * Calculate remaining balance based on total and amount paid
     */
    public void calculateRemainingBalance() {
        this.remainingBalance = (this.totalPrice != null ? this.totalPrice : 0.0)
                - (this.amountPaidNow != null ? this.amountPaidNow : 0.0);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Record a payment on this invoice
     */
    public void recordPayment(Double amount) {
        if (amount != null && amount > 0) {
            this.amountPaidNow = (this.amountPaidNow != null ? this.amountPaidNow : 0.0) + amount;
            calculateRemainingBalance();

            // Update status if fully paid
            if (this.remainingBalance <= 0.01) { // Small threshold for floating point
                this.status = InvoiceStatus.PAID;
                this.paymentDate = LocalDateTime.now();
            }
            this.updatedAt = LocalDateTime.now();
        }
    }

    /**
     * Get payment status
     */
    public InvoiceStatus getPaymentStatus() {
        return this.status;
    }

    /**
     * Check if invoice is fully paid
     */
    public boolean isFullyPaid() {
        return this.status == InvoiceStatus.PAID ||
                (this.remainingBalance != null && this.remainingBalance <= 0.01);
    }
}