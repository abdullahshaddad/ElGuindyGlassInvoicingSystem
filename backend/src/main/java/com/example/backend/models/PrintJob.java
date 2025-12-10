package com.example.backend.models;

import com.example.backend.models.enums.PrintStatus;
import com.example.backend.models.enums.PrintType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "print_job")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class PrintJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    @JsonIgnoreProperties({ "invoiceLines", "printJobs", "payments", "customer", "hibernateLazyInitializer",
            "handler" })
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private PrintType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private PrintStatus status = PrintStatus.QUEUED;

    @Column(name = "pdf_path")
    private String pdfPath;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "printed_at")
    private LocalDateTime printedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = PrintStatus.QUEUED;
        }
    }

    public PrintJob(Invoice invoice, PrintType type) {
        this.invoice = invoice;
        this.type = type;
        this.status = PrintStatus.QUEUED;
        this.createdAt = LocalDateTime.now();
    }

    public PrintType getPrintType() {
        return this.type;
    }
}