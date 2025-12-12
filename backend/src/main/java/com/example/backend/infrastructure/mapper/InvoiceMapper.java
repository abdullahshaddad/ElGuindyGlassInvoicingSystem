package com.example.backend.infrastructure.mapper;

import com.example.backend.domain.customer.model.CustomerId;
import com.example.backend.domain.glass.model.GlassType;
import com.example.backend.domain.glass.model.GlassTypeId;
import com.example.backend.domain.invoice.model.Invoice;
import com.example.backend.domain.invoice.model.InvoiceId;
import com.example.backend.domain.invoice.model.InvoiceLine;
import com.example.backend.domain.invoice.model.InvoiceLineId;
import com.example.backend.domain.invoice.model.LineCalculation;
import com.example.backend.domain.shared.valueobject.Area;
import com.example.backend.domain.shared.valueobject.Dimensions;
import com.example.backend.domain.shared.valueobject.Money;
import com.example.backend.repositories.GlassTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

/**
 * CRITICAL INTEGRATION POINT
 * Maps between JPA entities (existing database) and Domain entities (new clean architecture)
 * This is the bridge that connects the domain layer to the infrastructure
 */
@Component
@RequiredArgsConstructor
public class InvoiceMapper {

    private final GlassTypeRepository glassTypeRepository;

    /**
     * Convert JPA Invoice to Domain Invoice
     * This allows existing database records to work with new domain logic
     */
    public Invoice toDomain(com.example.backend.models.Invoice jpaInvoice) {
        if (jpaInvoice == null) return null;

        // Reconstitute domain entity from database
        Invoice invoice = Invoice.reconstitute(
            new InvoiceId(jpaInvoice.getId()),
            new CustomerId(jpaInvoice.getCustomer().getId()),
            Money.of(jpaInvoice.getTotalPrice()),
            Money.of(jpaInvoice.getAmountPaidNow() != null ? jpaInvoice.getAmountPaidNow() : 0.0),
            Money.of(jpaInvoice.getRemainingBalance() != null ? jpaInvoice.getRemainingBalance() : 0.0),
            jpaInvoice.getStatus(),
            jpaInvoice.getIssueDate(),
            jpaInvoice.getPaymentDate(),
            jpaInvoice.getNotes()
        );

        // Add invoice lines
        if (jpaInvoice.getInvoiceLines() != null) {
            jpaInvoice.getInvoiceLines().forEach(jpaLine -> {
                InvoiceLine domainLine = toLineDomain(jpaLine);
                invoice.addLineWithoutRecalculation(domainLine);
            });
        }

        return invoice;
    }

    /**
     * Convert Domain Invoice to JPA Invoice
     * This allows domain entities to be persisted to database
     */
    public com.example.backend.models.Invoice toJpa(
        Invoice domainInvoice,
        com.example.backend.models.customer.Customer jpaCustomer
    ) {
        if (domainInvoice == null) return null;

        com.example.backend.models.Invoice jpaInvoice = com.example.backend.models.Invoice.builder()
            .id(domainInvoice.getId().getValue())
            .customer(jpaCustomer)
            .issueDate(domainInvoice.getIssueDate())
            .paymentDate(domainInvoice.getPaymentDate())
            .totalPrice(domainInvoice.getTotalPrice().toDouble())
            .amountPaidNow(domainInvoice.getAmountPaid().toDouble())
            .remainingBalance(domainInvoice.getRemainingBalance().toDouble())
            .status(domainInvoice.getStatus())
            .notes(domainInvoice.getNotes())
            .createdAt(domainInvoice.getIssueDate())
            .build();

        // Map invoice lines
        if (domainInvoice.getLines() != null) {
            jpaInvoice.setInvoiceLines(
                domainInvoice.getLines().stream()
                    .map(line -> toLineJpa(line, jpaInvoice))
                    .collect(Collectors.toList())
            );
        }

        return jpaInvoice;
    }

    /**
     * Convert JPA InvoiceLine to Domain InvoiceLine
     */
    public InvoiceLine toLineDomain(com.example.backend.models.InvoiceLine jpaLine) {
        if (jpaLine == null) return null;

        // FIX BUG #1: Use Dimensions value object
        Dimensions dimensions = Dimensions.of(
            jpaLine.getWidth(),
            jpaLine.getHeight(),
            jpaLine.getDimensionUnit()
        );

        // FIX BUG #4: Use LineCalculation
        LineCalculation calculation = LineCalculation.of(
            Area.ofSquareMeters(jpaLine.getAreaM2() != null ? jpaLine.getAreaM2() : 0.0),
            jpaLine.getShatafMeters() != null ? jpaLine.getShatafMeters() : 0.0,
            Money.of(jpaLine.getGlassPrice() != null ? jpaLine.getGlassPrice() : 0.0),
            Money.of(jpaLine.getCuttingPrice() != null ? jpaLine.getCuttingPrice() : 0.0)
        );

        // Build domain invoice line
        return InvoiceLine.builder()
            .id(new InvoiceLineId(jpaLine.getId()))
            .glassTypeId(new GlassTypeId(jpaLine.getGlassType().getId()))
            .dimensions(dimensions)
            .shatafType(jpaLine.getShatafType())
            .farmaType(jpaLine.getFarmaType())
            .diameter(jpaLine.getDiameter())
            .manualCuttingPrice(jpaLine.getManualCuttingPrice() != null ?
                Money.of(jpaLine.getManualCuttingPrice()) : null)
            .calculation(calculation)
            .build();
    }

    /**
     * Convert Domain InvoiceLine to JPA InvoiceLine
     * FIX BUG #1: Store both original and converted dimensions
     */
    public com.example.backend.models.InvoiceLine toLineJpa(
        InvoiceLine domainLine,
        com.example.backend.models.Invoice jpaInvoice
    ) {
        if (domainLine == null) return null;

        // Fetch the actual glass type entity from repository
        com.example.backend.models.GlassType jpaGlassType = glassTypeRepository
            .findById(domainLine.getGlassTypeId().getValue())
            .orElseThrow(() -> new IllegalArgumentException(
                "Glass type not found: " + domainLine.getGlassTypeId().getValue()
            ));

        Dimensions dims = domainLine.getDimensions();
        Dimensions metersD = dims.convertToMeters();
        Dimensions mmD = dims.convertToMillimeters();

        return com.example.backend.models.InvoiceLine.builder()
            .id(domainLine.getId() != null ? domainLine.getId().getValue() : null)
            .invoice(jpaInvoice)
            .glassType(jpaGlassType)
            .width(mmD.getWidth())  // Store in MM as original
            .height(mmD.getHeight())
            .dimensionUnit(dims.getUnit())
            .shatafType(domainLine.getShatafType())
            .farmaType(domainLine.getFarmaType())
            .diameter(domainLine.getDiameter())
            .areaM2(domainLine.getCalculation().getArea().toDouble())
            .shatafMeters(domainLine.getCalculation().getShatafMeters())
            .glassPrice(domainLine.getGlassPrice().toDouble())
            .cuttingPrice(domainLine.getCuttingPrice().toDouble())
            .manualCuttingPrice(domainLine.getManualCuttingPrice() != null ?
                domainLine.getManualCuttingPrice().toDouble() : null)
            .lineTotal(domainLine.getTotalPrice().toDouble())
            .build();
    }

    /**
     * Convert JPA GlassType to Domain GlassType
     */
    public GlassType toGlassTypeDomain(com.example.backend.models.GlassType jpaGlassType) {
        if (jpaGlassType == null) return null;

        return GlassType.reconstitute(
            new GlassTypeId(jpaGlassType.getId()),
            jpaGlassType.getName(),
            jpaGlassType.getColor(),
            jpaGlassType.getThickness(),
            Money.of(jpaGlassType.getPricePerMeter()),
            jpaGlassType.getActive() != null ? jpaGlassType.getActive() : true
        );
    }
}
