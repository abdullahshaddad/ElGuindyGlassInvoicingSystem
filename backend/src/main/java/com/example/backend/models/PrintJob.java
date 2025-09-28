package com.example.backend.models;

import com.example.backend.models.enums.PrintStatus;
import com.example.backend.models.enums.PrintType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
public class PrintJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrintType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrintStatus status = PrintStatus.QUEUED;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "printed_at")
    private LocalDateTime printedAt;

    @Column(name = "pdf_path")
    private String pdfPath;

    @Column(name = "error_message")
    private String errorMessage;

    public PrintJob(Invoice invoice, PrintType type) {
        this.invoice = invoice;
        this.type = type;
    }


    public PrintType getPrintType() {
        return this.type;
    }
}
