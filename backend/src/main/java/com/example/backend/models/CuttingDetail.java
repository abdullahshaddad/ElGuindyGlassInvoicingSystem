package com.example.backend.models;

import com.example.backend.models.enums.CuttingMethod;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CuttingDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_line_id", nullable = false)
    private InvoiceLine invoiceLine;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CuttingMethod method;

    @Column(nullable = false)
    private Double thickness;

    @Column(name = "meters_cut", nullable = false)
    private Double metersCut;

    @Column(nullable = false)
    private Double price;


}
