package com.example.backend.models;

import com.example.backend.models.customer.Customer;
import com.example.backend.models.enums.InvoiceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
//@RequiredArgsConstructor
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

    @Enumerated(EnumType.STRING)
    private InvoiceStatus status = InvoiceStatus.PENDING;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<InvoiceLine> invoiceLines;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL)
    private List<PrintJob> printJobs;

    public Invoice(Customer customer) {
        this.customer = customer;
    }
}
