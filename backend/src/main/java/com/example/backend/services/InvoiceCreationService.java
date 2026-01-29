package com.example.backend.services;

import com.example.backend.domain.customer.model.CustomerId;
import com.example.backend.domain.glass.model.GlassType;
import com.example.backend.domain.glass.model.GlassTypeId;
import com.example.backend.domain.invoice.model.*;
import com.example.backend.domain.invoice.service.InvoicePricingService;
import com.example.backend.domain.shared.valueobject.Dimensions;
import com.example.backend.domain.shared.valueobject.Money;
import com.example.backend.dto.CreateInvoiceLineRequest;
import com.example.backend.dto.CreateInvoiceRequest;
import com.example.backend.infrastructure.mapper.InvoiceMapper;
import com.example.backend.models.customer.Customer;
import com.example.backend.models.enums.DimensionUnit;
import com.example.backend.models.enums.FarmaType;
import com.example.backend.models.enums.ShatafType;
import com.example.backend.repositories.GlassTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * INTEGRATION SERVICE - Critical Bridge Between Old and New Architecture
 *
 * This service uses the new Domain Layer to fix all bugs while working
 * with existing JPA entities. This allows gradual migration.
 *
 * FIXES ALL BUGS:
 * - Bug #1: Dimension conversion (via Dimensions value object)
 * - Bug #2: ShatafType/FarmaType saved (via InvoiceLine domain entity)
 * - Bug #3: Enhanced cutting strategy (via InvoicePricingService)
 * - Bug #4: Glass price calculated (via LineCalculation)
 * - Bug #8: BigDecimal precision (via Money value object)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceCreationService {

    private final InvoicePricingService pricingService;
    private final InvoiceMapper mapper;
    private final GlassTypeRepository glassTypeRepository;

    /**
     * Create invoice using DOMAIN LAYER with bug fixes
     * Returns JPA entity for existing code compatibility
     */
    @Transactional
    public com.example.backend.models.Invoice createInvoiceWithDomain(
        CreateInvoiceRequest request,
        Customer customer
    ) {
        log.info("Creating invoice with DOMAIN LAYER for customer: {}", customer.getName());

        // Create domain invoice
        Invoice domainInvoice = Invoice.create(
            new InvoiceId(null), // Will be generated on save
            new CustomerId(customer.getId())
        );

        // Add notes
        if (request.getNotes() != null) {
            domainInvoice.updateNotes(request.getNotes());
        }

        // Process each invoice line using DOMAIN LOGIC
        for (CreateInvoiceLineRequest lineRequest : request.getInvoiceLines()) {
            InvoiceLine domainLine = createInvoiceLineWithDomain(lineRequest);
            domainInvoice.addLine(domainLine);
        }

        // Set initial payment if any
        if (request.getAmountPaidNow() != null && request.getAmountPaidNow() > 0) {
            Money initialPayment = Money.of(request.getAmountPaidNow());
            domainInvoice.setInitialPayment(initialPayment);
        }

        log.info("Domain invoice created: {} lines, total: {}",
            domainInvoice.getLines().size(),
            domainInvoice.getTotalPrice());

        // Convert to JPA for persistence (existing code compatibility)
        com.example.backend.models.Invoice jpaInvoice = mapper.toJpa(domainInvoice, customer);

        return jpaInvoice;
    }

    /**
     * Create invoice line using DOMAIN LOGIC
     * FIXES BUGS #1, #2, #3, #4
     */
    private InvoiceLine createInvoiceLineWithDomain(CreateInvoiceLineRequest request) {
        log.debug("Creating line with domain logic: glassType={}, shataf={}, farma={}",
            request.getGlassTypeId(), request.getEffectiveShatafType(), request.getEffectiveFarmaType());

        // FIX BUG #1: Use Dimensions value object for proper conversion
        Dimensions dimensions = Dimensions.of(
            request.getWidth(),
            request.getHeight(),
            request.getDimensionUnit() != null ? request.getDimensionUnit() : DimensionUnit.CM
        );

        log.debug("Dimensions created: {}", dimensions);

        // Fetch glass type and convert to domain
        com.example.backend.models.GlassType jpaGlassType = glassTypeRepository
            .findById(request.getGlassTypeId())
            .orElseThrow(() -> new IllegalArgumentException("Glass type not found: " + request.getGlassTypeId()));

        GlassType domainGlassType = mapper.toGlassTypeDomain(jpaGlassType);

        // FIX BUGS #1, #3, #4: Calculate pricing using domain service
        // Use effective types to support both legacy and new requests
        LineCalculation calculation = pricingService.calculateLinePrice(
            dimensions,
            domainGlassType,
            request.getEffectiveShatafType(),
            request.getEffectiveFarmaType(),
            request.getDiameter(),
            request.getManualCuttingPrice() != null ? Money.of(request.getManualCuttingPrice()) : null
        );

        log.debug("Line calculation complete: glass={}, cutting={}, total={}",
            calculation.getGlassPrice(),
            calculation.getCuttingPrice(),
            calculation.getTotalPrice());

        // FIX BUG #2: ShatafType and FarmaType are stored in domain entity
        // Use effective types to support legacy and new requests
        InvoiceLine domainLine = InvoiceLine.builder()
            .id(new InvoiceLineId(null)) // Will be generated
            .glassTypeId(new GlassTypeId(jpaGlassType.getId()))
            .dimensions(dimensions)
            .shatafType(request.getEffectiveShatafType())
            .farmaType(request.getEffectiveFarmaType())
            .diameter(request.getDiameter())
            .manualCuttingPrice(request.getManualCuttingPrice() != null ?
                Money.of(request.getManualCuttingPrice()) : null)
            .calculation(calculation)
            .quantity(request.getQuantity())
            .build();

        log.debug("Domain invoice line created successfully");

        return domainLine;
    }

    /**
     * Validate invoice request
     */
    public void validateRequest(CreateInvoiceRequest request) {
        if (request.getCustomerId() == null) {
            throw new IllegalArgumentException("معرف العميل مطلوب");
        }

        if (request.getInvoiceLines() == null || request.getInvoiceLines().isEmpty()) {
            throw new IllegalArgumentException("يجب إضافة بند واحد على الأقل للفاتورة");
        }

        for (CreateInvoiceLineRequest line : request.getInvoiceLines()) {
            validateLineRequest(line);
        }
    }

    /**
     * Validate line request
     */
    private void validateLineRequest(CreateInvoiceLineRequest line) {
        if (line.getGlassTypeId() == null) {
            throw new IllegalArgumentException("نوع الزجاج مطلوب");
        }

        if (line.getWidth() == null || line.getWidth() <= 0) {
            throw new IllegalArgumentException("العرض يجب أن يكون موجباً");
        }

        if (line.getHeight() == null || line.getHeight() <= 0) {
            throw new IllegalArgumentException("الارتفاع يجب أن يكون موجباً");
        }

        // Use effective types for validation (supports legacy and new)
        ShatafType effectiveShataf = line.getEffectiveShatafType();
        FarmaType effectiveFarma = line.getEffectiveFarmaType();

        if (effectiveShataf == null) {
            throw new IllegalArgumentException("نوع الشطف مطلوب");
        }

        if (effectiveFarma == null) {
            throw new IllegalArgumentException("نوع الفرما مطلوب");
        }

        // Validate manual cutting price for manual types
        if (effectiveShataf.isManualInput()) {
            if (line.getManualCuttingPrice() == null || line.getManualCuttingPrice() <= 0) {
                throw new IllegalArgumentException(
                    "سعر القطع اليدوي مطلوب لنوع الشطف: " + effectiveShataf.getArabicName()
                );
            }
        }

        // Validate diameter for wheel cut
        if (effectiveFarma.requiresDiameter()) {
            if (line.getDiameter() == null || line.getDiameter() <= 0) {
                throw new IllegalArgumentException("القطر مطلوب لقطع العجلة");
            }
        }
    }
}
