package com.example.backend.models;

import com.example.backend.models.enums.CuttingType;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RequiredArgsConstructor
public class InvoiceLine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "glass_type_id", nullable = false)
    private GlassType glassType;

    @Column(nullable = false)
    private Double width;

    @Column(nullable = false)
    private Double height;

    @Column(name = "area_m2", nullable = false)
    private Double areaM2;

    @Enumerated(EnumType.STRING)
    @Column(name = "cutting_type", nullable = false)
    private CuttingType cuttingType;

    @Column(name = "cutting_price", nullable = false)
    private Double cuttingPrice = 0.0;

    @Column(name = "line_total", nullable = false)
    private Double lineTotal = 0.0;

    @OneToMany(mappedBy = "invoiceLine", cascade = CascadeType.ALL)
    private List<CuttingDetail> cuttingDetails;

    public InvoiceLine(Invoice invoice, GlassType glassType, Double width, Double height, CuttingType cuttingType) {
        this.invoice = invoice;
        this.glassType = glassType;
        this.width = width;
        this.height = height;
        this.areaM2 = width * height;
        this.cuttingType = cuttingType;
    }
    public InvoiceLine() {}




    public void setWidth(Double width) {
        this.width = width;
        updateArea();
    }

    public void setHeight(Double height) {
        this.height = height;
        updateArea();
    }


    private void updateArea() {
        if (width != null && height != null) {
            this.areaM2 = width * height;
        }
    }
}
