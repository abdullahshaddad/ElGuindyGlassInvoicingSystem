package com.example.backend.services;

import com.example.backend.dto.CreateInvoiceLineRequest;
import com.example.backend.dto.CreateInvoiceRequest;
import com.example.backend.dto.invoice.LinePreviewDTO;
import com.example.backend.dto.invoice.PreviewLineRequest;
import com.example.backend.exceptions.customer.CustomerLookupException;
import com.example.backend.exceptions.customer.CustomerNotFoundException;
import com.example.backend.exceptions.invoice.*;
import com.example.backend.exceptions.websocket.WebSocketException;
import com.example.backend.models.customer.Customer;
import com.example.backend.models.GlassType;
import com.example.backend.models.Invoice;
import com.example.backend.models.InvoiceLine;
import com.example.backend.models.enums.CuttingType;
import com.example.backend.models.enums.DimensionUnit;
import com.example.backend.models.enums.InvoiceStatus;
import com.example.backend.models.enums.OperationType;
import com.example.backend.dto.OperationRequest;
import com.example.backend.repositories.InvoiceLineRepository;
import com.example.backend.repositories.InvoiceRepository;
import com.example.backend.services.cutting.CuttingContext;
import jakarta.validation.ValidationException;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@Slf4j
public class InvoiceService {

    // Constants for validation (in meters)
    private static final double MIN_DIMENSION_METERS = 0.001; // 1mm in meters
    private static final int MAX_NOTES_LENGTH = 5000;

    private final InvoiceRepository invoiceRepository;
    private final InvoiceLineRepository invoiceLineRepository;
    private final CustomerService customerService;
    private final GlassTypeService glassTypeService;
    private final CuttingContext cuttingContext;
    private final PrintJobService printJobService;
    private final WebSocketNotificationService webSocketService;
    private final OperationCalculationService operationCalculationService;
    private final PaymentService paymentService;
    private final ReadableIdGeneratorService idGeneratorService;

    @Autowired
    public InvoiceService(InvoiceRepository invoiceRepository,
            InvoiceLineRepository invoiceLineRepository,
            CustomerService customerService,
            GlassTypeService glassTypeService,
            CuttingContext cuttingContext,
            PrintJobService printJobService,
            WebSocketNotificationService webSocketService,
            OperationCalculationService operationCalculationService,
            PaymentService paymentService,
            ReadableIdGeneratorService idGeneratorService) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceLineRepository = invoiceLineRepository;
        this.customerService = customerService;
        this.glassTypeService = glassTypeService;
        this.cuttingContext = cuttingContext;
        this.printJobService = printJobService;
        this.webSocketService = webSocketService;
        this.operationCalculationService = operationCalculationService;
        this.paymentService = paymentService;
        this.idGeneratorService = idGeneratorService;
    }

    /**
     * Create a new invoice using DOMAIN LAYER with all bug fixes
     * This method now delegates to InvoiceCreationService which uses clean
     * architecture
     *
     * FIXES ALL BUGS:
     * - Bug #1: Dimension conversion (MM to meters)
     * - Bug #2: ShatafType/FarmaType saved
     * - Bug #3: Enhanced cutting strategy
     * - Bug #4: Glass price calculated
     * - Bug #8: BigDecimal precision
     *
     * @param request The invoice creation request
     * @return Created invoice
     *         /**
     *         Create a new invoice
     *         Uses local logic to support multiple operations and new Shatf/Laser
     *         structure
     *
     * @param request The invoice creation request
     * @return Created invoice
     * @throws InvoiceCreationException if invoice creation fails
     */
    @Transactional(rollbackFor = Exception.class)
    public Invoice createInvoice(CreateInvoiceRequest request) {
        log.info("Starting invoice creation for customer ID: {}", request.getCustomerId());

        try {
            // 1. Validate request
            validateCreateInvoiceRequest(request);

            // 2. Lookup customer
            Customer customer = lookupCustomer(request.getCustomerId());

            // 3. Create invoice entity
            Invoice invoice = createInvoiceEntity(customer, request);

            // 4. Process invoice lines
            InvoiceLineProcessingResult result = processInvoiceLines(invoice, request.getInvoiceLines());

            // 5. Update invoice totals and balance
            invoice.setTotalPrice(result.getTotalPrice());
            invoice.calculateRemainingBalance();

            // 6. Check payment status
            if (invoice.getRemainingBalance() <= 0.01) {
                invoice.setStatus(InvoiceStatus.PAID);
                invoice.setPaymentDate(LocalDateTime.now());
            }

            // 6.5 Update Customer Balance & Record Payment
            if (customer.getCustomerType() != com.example.backend.models.enums.CustomerType.CASH) {
                // For non-CASH customers:
                // 1. Add FULL invoice amount to balance (increase debt)
                customerService.updateCustomerBalance(customer.getId(), invoice.getTotalPrice());

                // 2. If there is an initial payment, record it via PaymentService
                // This validates the payment and creates a Payment entity
                // It also automatically deducts from customer balance
                if (request.getAmountPaidNow() != null && request.getAmountPaidNow() > 0) {
                    try {
                        paymentService.recordPayment(
                                customer.getId(),
                                invoice.getId(),
                                request.getAmountPaidNow(),
                                com.example.backend.models.enums.PaymentMethod.CASH, // Default to CASH for now
                                null, // Reference number
                                "دفعة أولية عند إنشاء الفاتورة",
                                "System" // Or get current user
                        );
                        // Note: invoice.amountPaidNow is already set in createInvoiceEntity for
                        // calculation purposes,
                        // but PaymentService.recordPayment will update it again.
                        // To avoid double counting or confusion, rely on recordPayment to handle the
                        // updates.
                        // However, createInvoiceEntity sets it initially.
                        // Because recordPayment also updates the invoice's paid amount, we are fine.
                    } catch (Exception e) {
                        log.error("Failed to record initial payment for invoice {}: {}", invoice.getId(),
                                e.getMessage());
                        // Consider if this should rollback the transaction or just log error
                        // For now, we log but don't fail the invoice creation, but user balance might
                        // be affected
                        // Ideally transaction rollback handles this if exception propagates.
                        throw new InvoiceCreationException("فشل في تسجيل الدفعة الأولية: " + e.getMessage(), e);
                    }
                }
            } else {
                // For CASH customers:
                // Existing logic (set amountPaidNow in entity, no Payment entity created)
                // This is handled by createInvoiceEntity setting amountPaidNow
            }

            // 7. Save final invoice state
            invoice = invoiceRepository.save(invoice);

            // 8. Reload invoice with lines and glass types
            invoice = reloadInvoiceWithLines(invoice.getId());

            // 9. Notify factory screen (non-critical)
            handleFactoryNotification(invoice);

            // 10. Log success
            log.info("Invoice {} created successfully for customer '{}' (ID: {}) with {} lines, total: {} EGP",
                    invoice.getId(), customer.getName(), customer.getId(),
                    invoice.getInvoiceLines().size(), invoice.getTotalPrice());

            return invoice;

        } catch (ValidationException e) {
            log.error("Validation failed for invoice creation: {}", e.getMessage());
            throw e;
        } catch (CustomerNotFoundException e) {
            log.error("Customer not found during invoice creation: {}", e.getMessage());
            throw e;
        } catch (CustomerLookupException | InvoiceCreationException e) {
            log.error("Invoice creation failed: {}", e.getMessage(), e);
            throw e;
        } catch (DataAccessException e) {
            log.error("Database error during invoice creation: {}", e.getMessage(), e);
            throw new InvoiceCreationException("خطأ في قاعدة البيانات أثناء إنشاء الفاتورة", e);
        } catch (Exception e) {
            log.error("Unexpected error during invoice creation: {}", e.getMessage(), e);
            throw new InvoiceCreationException("خطأ غير متوقع أثناء إنشاء الفاتورة: " + e.getMessage(), e);
        }
    }

    /**
     * Lookup customer with proper error handling
     */
    private Customer lookupCustomer(Long customerId) {
        try {
            Customer customer = customerService.findById(customerId)
                    .orElseThrow(() -> CustomerNotFoundException.forCustomerId(customerId));
            log.debug("Customer found: ID={}, Name={}, Phone={}",
                    customer.getId(), customer.getName(), customer.getPhone());
            return customer;
        } catch (CustomerNotFoundException e) {
            log.error("Customer not found with ID {}: {}", customerId, e.getMessage());
            throw e;
        } catch (DataAccessException e) {
            log.error("Database error while finding customer {}: {}", customerId, e.getMessage(), e);
            throw CustomerLookupException.databaseError(customerId, e);
        } catch (Exception e) {
            log.error("Unexpected error while finding customer {}: {}", customerId, e.getMessage(), e);
            throw CustomerLookupException.unexpectedError(customerId, e);
        }
    }

    /**
     * Create invoice entity with error handling
     */
    private Invoice createInvoiceEntity(Customer customer, CreateInvoiceRequest request) {
        try {
            double initialPaid = 0.0;

            // For CASH customers, we set the paid amount immediately to reflect full
            // payment (usually) or partial
            // For REGULAR customers, we initially set 0 and let PaymentService handle the
            // payment to create a record
            // UNLESS we want the invoice entity to start with the value.
            // However, to ensure PaymentService logic is used, we should probably start
            // with 0 for Regular
            // and let recordPayment update it.

            if (customer.getCustomerType() == com.example.backend.models.enums.CustomerType.CASH) {
                initialPaid = request.getAmountPaidNow() != null ? request.getAmountPaidNow() : 0.0;
            } else {
                // For regular customers, we'll record the payment separately
                initialPaid = 0.0;
            }

            // Generate readable ID before creating invoice
            String invoiceId = idGeneratorService.generateInvoiceId();

            Invoice invoice = Invoice.builder()
                    .id(invoiceId)
                    .customer(customer)
                    .issueDate(request.getIssueDate() != null ? request.getIssueDate() : LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .status(InvoiceStatus.PENDING)
                    .totalPrice(0.0)
                    .amountPaidNow(initialPaid)
                    .notes(request.getNotes())
                    .build();

            // Calculate initial remaining balance (total is 0 initially)
            invoice.calculateRemainingBalance();

            invoice = invoiceRepository.save(invoice);
            log.debug("Invoice created with ID: {} for customer: {}", invoice.getId(), customer.getName());
            return invoice;
        } catch (DataAccessException e) {
            log.error("Database error while creating invoice for customer {}: {}", customer.getId(), e.getMessage(), e);
            throw new InvoiceCreationException("خطأ في قاعدة البيانات أثناء إنشاء الفاتورة", e);
        } catch (Exception e) {
            log.error("Unexpected error while creating invoice for customer {}: {}", customer.getId(), e.getMessage(),
                    e);
            throw new InvoiceCreationException("خطأ غير متوقع أثناء إنشاء الفاتورة", e);
        }
    }

    /**
     * Process all invoice lines and collect results
     */
    private InvoiceLineProcessingResult processInvoiceLines(Invoice invoice,
            List<CreateInvoiceLineRequest> lineRequests) {
        java.math.BigDecimal totalPrice = java.math.BigDecimal.ZERO;
        List<String> lineErrors = new ArrayList<>();
        int successfulLines = 0;

        for (int i = 0; i < lineRequests.size(); i++) {
            CreateInvoiceLineRequest lineRequest = lineRequests.get(i);
            try {
                InvoiceLine line = createInvoiceLine(invoice, lineRequest);
                totalPrice = totalPrice.add(java.math.BigDecimal.valueOf(line.getLineTotal()));
                successfulLines++;
                log.debug("Invoice line {} created successfully with total: {} EGP", i + 1, line.getLineTotal());
            } catch (GlassTypeNotFoundException e) {
                String error = String.format("البند %d: نوع الزجاج غير موجود (ID: %d)", i + 1,
                        lineRequest.getGlassTypeId());
                lineErrors.add(error);
                log.error("Glass type not found for line {} in invoice {}: Glass type ID {}",
                        i + 1, invoice.getId(), lineRequest.getGlassTypeId());
            } catch (InvalidDimensionsException e) {
                String error = String.format("البند %d: أبعاد غير صالحة - %s", i + 1, e.getMessage());
                lineErrors.add(error);
                log.error("Invalid dimensions for line {} in invoice {}: Width={}, Height={}",
                        i + 1, invoice.getId(), lineRequest.getWidth(), lineRequest.getHeight());
            } catch (CuttingCalculationException e) {
                String error = String.format("البند %d: خطأ في حساب القطع - %s", i + 1, e.getMessage());
                lineErrors.add(error);
                log.error("Cutting calculation error for line {} in invoice {}: {}",
                        i + 1, invoice.getId(), e.getMessage());
            } catch (DataAccessException e) {
                String error = String.format("البند %d: خطأ في قاعدة البيانات - %s", i + 1, e.getMessage());
                lineErrors.add(error);
                log.error("Database error for line {} in invoice {}: {}",
                        i + 1, invoice.getId(), e.getMessage(), e);
            } catch (Exception e) {
                String error = String.format("البند %d: خطأ غير متوقع - %s", i + 1, e.getMessage());
                lineErrors.add(error);
                log.error("Unexpected error for invoice line {} in invoice {}: {}",
                        i + 1, invoice.getId(), e.getMessage(), e);
            }
        }

        return new InvoiceLineProcessingResult(totalPrice.setScale(2, java.math.RoundingMode.HALF_UP).doubleValue(),
                lineErrors, successfulLines);
    }

    /**
     * Update invoice total with error handling
     */
    private Invoice updateInvoiceTotal(Invoice invoice, double totalPrice) {
        try {
            invoice.setTotalPrice(totalPrice);
            invoice = invoiceRepository.save(invoice);
            log.debug("Invoice {} total updated to: {} EGP", invoice.getId(), totalPrice);
            return invoice;
        } catch (DataAccessException e) {
            log.error("Failed to update invoice {} total price: {}", invoice.getId(), e.getMessage(), e);
            throw new InvoiceUpdateException("فشل في تحديث إجمالي الفاتورة", e);
        } catch (Exception e) {
            log.error("Unexpected error updating invoice {} total: {}", invoice.getId(), e.getMessage(), e);
            throw new InvoiceUpdateException("خطأ غير متوقع في تحديث إجمالي الفاتورة", e);
        }
    }

    /**
     * Reload invoice with lines and glass types
     */
    private Invoice reloadInvoiceWithLines(String invoiceId) {
        try {
            Invoice invoice = invoiceRepository.findByIdWithLines(invoiceId)
                    .orElseThrow(() -> new InvoiceNotFoundException("الفاتورة غير موجودة بعد الإنشاء: " + invoiceId));

            int loadedLinesCount = Optional.ofNullable(invoice.getInvoiceLines())
                    .map(List::size)
                    .orElse(0);
            log.debug("Invoice {} reloaded successfully with {} lines", invoiceId, loadedLinesCount);
            return invoice;
        } catch (InvoiceNotFoundException e) {
            log.error("Invoice {} not found after creation: {}", invoiceId, e.getMessage());
            throw e;
        } catch (DataAccessException e) {
            log.error("Database error reloading invoice {}: {}", invoiceId, e.getMessage(), e);
            throw new InvoiceReloadException("فشل في إعادة تحميل الفاتورة بعد الإنشاء", e);
        } catch (Exception e) {
            log.error("Unexpected error reloading invoice {}: {}", invoiceId, e.getMessage(), e);
            throw new InvoiceReloadException("خطأ غير متوقع في إعادة تحميل الفاتورة", e);
        }
    }

    /**
     * Handle factory notification (non-critical)
     */
    private void handleFactoryNotification(Invoice invoice) {
        try {
            webSocketService.notifyNewInvoice(invoice);
            log.debug("Factory notification sent successfully for invoice {}", invoice.getId());
        } catch (WebSocketException e) {
            log.error("WebSocket notification failed for invoice {}: {}", invoice.getId(), e.getMessage(), e);
            scheduleFactoryNotificationRetry(invoice, "فشل في إرسال إشعار WebSocket");
        } catch (Exception e) {
            log.error("Unexpected error notifying factory for invoice {}: {}", invoice.getId(), e.getMessage(), e);
            scheduleFactoryNotificationRetry(invoice, "خطأ غير متوقع في إرسال الإشعار");
        }
    }

    /**
     * Create individual invoice line with comprehensive validation
     * UPDATED to support multiple operations per line
     */
    private InvoiceLine createInvoiceLine(Invoice invoice, CreateInvoiceLineRequest request) {
        // Validate request has at least one operation (new or legacy format)
        request.validate();

        // Validate glass type exists
        GlassType glassType = glassTypeService.findById(request.getGlassTypeId())
                .orElseThrow(() -> new GlassTypeNotFoundException("نوع الزجاج غير موجود: ", request.getGlassTypeId()));

        // Validate dimensions based on unit
        validateDimensions(request.getWidth(), request.getHeight(), request.getDimensionUnit());

        // Convert dimensions to meters for calculations
        Double widthM = request.getDimensionUnit().toMeters(request.getWidth());
        Double heightM = request.getDimensionUnit().toMeters(request.getHeight());

        // Create invoice line
        InvoiceLine line = InvoiceLine.builder()
                .invoice(invoice)
                .glassType(glassType)
                .width(request.getWidth())
                .height(request.getHeight())
                .dimensionUnit(request.getDimensionUnit())
                .build();

        // Calculate dimensions and glass price (Using BigDecimal for precision)
        line.calculateDimensions();
        java.math.BigDecimal quantity = java.math.BigDecimal.valueOf(line.getQuantityForPricing());
        java.math.BigDecimal pricePerMeter = java.math.BigDecimal.valueOf(glassType.getPricePerMeter());
        java.math.BigDecimal glassPrice = quantity.multiply(pricePerMeter)
                .setScale(2, java.math.RoundingMode.HALF_UP);

        line.setGlassPrice(glassPrice.doubleValue());

        // Process operations (new format) or legacy single operation
        if (request.hasOperations()) {
            // NEW: Multiple operations support
            log.debug("Processing {} operations for invoice line", request.getOperations().size());
            processOperations(line, request, widthM, heightM);
        } else {
            // LEGACY: Single operation support
            log.debug("Processing legacy single operation for invoice line");
            processLegacyOperation(line, request);
        }

        // Recalculate line total (glass + all operations)
        line.recalculateLineTotal();

        // Save and return
        return invoiceLineRepository.save(line);
    }

    /**
     * Process multiple operations (NEW format)
     */
    private void processOperations(
            InvoiceLine line,
            CreateInvoiceLineRequest request,
            Double widthM,
            Double heightM) {
        // Get glass type thickness for rate calculations
        Double thickness = line.getGlassType().getThickness();
        if (thickness == null) {
            throw new CuttingCalculationException("سماكة الزجاج مطلوبة لحساب أسعار العمليات");
        }

        for (var opRequest : request.getOperations()) {
            try {
                // Validate operation request
                opRequest.validate();

                // Create and calculate operation with thickness
                var operation = operationCalculationService.createAndCalculateOperation(
                        opRequest, widthM, heightM, thickness);

                // Add to invoice line
                line.addOperation(operation);

                log.debug("Added operation: type={}, price={}",
                        operation.getOperationType(), operation.getOperationPrice());

            } catch (Exception e) {
                log.error("Failed to process operation: type={}, error={}",
                        opRequest.getType(), e.getMessage());
                throw new CuttingCalculationException(
                        "فشل في معالجة العملية: " + opRequest.getType().getArabicName() + " - " + e.getMessage(),
                        e);
            }
        }
    }

    /**
     * Process legacy single operation (backward compatibility)
     */
    private void processLegacyOperation(InvoiceLine line, CreateInvoiceLineRequest request) {
        // Set legacy fields
        line.setCuttingType(request.getCuttingType());
        line.setShatafType(request.getShatafType());
        line.setFarmaType(request.getFarmaType());
        line.setDiameter(request.getDiameter());
        line.setManualCuttingPrice(request.getManualCuttingPrice());

        // Calculate cutting price using legacy method
        double cuttingPrice = calculateCuttingPrice(line, request);
        line.setCuttingPrice(cuttingPrice);

        log.debug("Legacy operation calculated: cuttingType={}, price={}",
                request.getCuttingType(), cuttingPrice);
    }

    /**
     * Validates dimensions with unit conversion.
     * This is the primary validation method - all dimension validation should use this.
     */
    private void validateDimensions(Double width, Double height, DimensionUnit unit) {
        if (width == null || height == null) {
            throw new InvalidDimensionsException("العرض والارتفاع مطلوبان");
        }

        if (unit == null) {
            throw new InvalidDimensionsException("وحدة القياس مطلوبة");
        }

        // Convert to meters for validation
        double widthInMeters = unit.toMeters(width);
        double heightInMeters = unit.toMeters(height);

        validateDimensionsInMeters(widthInMeters, heightInMeters, unit);
    }

    /**
     * Validates dimensions that are already in meters.
     * Only checks minimum dimension (must be at least 1mm).
     * @param widthInMeters width in meters
     * @param heightInMeters height in meters
     * @param unit optional unit for error message formatting (null = meters)
     */
    private void validateDimensionsInMeters(double widthInMeters, double heightInMeters, DimensionUnit unit) {
        if (widthInMeters < MIN_DIMENSION_METERS || heightInMeters < MIN_DIMENSION_METERS) {
            String unitName = unit != null ? unit.getArabicName() : "متر";
            double minDisplay = unit != null ? unit.fromMeters(MIN_DIMENSION_METERS) : MIN_DIMENSION_METERS;
            throw new InvalidDimensionsException(
                    String.format("الأبعاد صغيرة جداً (الحد الأدنى: %.1f %s)", minDisplay, unitName));
        }
    }

    /**
     * Calculate cutting price with proper validation
     */
    private double calculateCuttingPrice(InvoiceLine line, CreateInvoiceLineRequest request) {
        try {
            if (request.getCuttingType() == CuttingType.LASER) {
                if (request.getManualCuttingPrice() == null) {
                    throw new CuttingCalculationException("سعر القطع اليدوي مطلوب للقطع بالليزر");
                }
                if (request.getManualCuttingPrice() < 0) {
                    throw new CuttingCalculationException("سعر القطع اليدوي لا يمكن أن يكون سالباً");
                }
                return request.getManualCuttingPrice();
            } else {
                // Use strategy pattern for automatic calculation
                return cuttingContext.calculateCuttingPrice(line);
            }
        } catch (Exception e) {
            log.error("Error calculating cutting price for line: {}", e.getMessage());
            throw new CuttingCalculationException("خطأ في حساب سعر القطع: " + e.getMessage(), e);
        }
    }


    /**
     * Enhanced validation with proper customer ID validation
     */
    private void validateCreateInvoiceRequest(CreateInvoiceRequest request) {
        List<String> errors = new ArrayList<>();

        // Validate customer ID
        if (request.getCustomerId() == null) {
            errors.add("معرف العميل مطلوب");
        } else if (request.getCustomerId() <= 0) {
            errors.add("معرف العميل غير صالح");
        }

        // Validate invoice lines
        if (request.getInvoiceLines() == null || request.getInvoiceLines().isEmpty()) {
            errors.add("يجب أن تحتوي الفاتورة على بند واحد على الأقل");
        } else {
            for (int i = 0; i < request.getInvoiceLines().size(); i++) {
                CreateInvoiceLineRequest line = request.getInvoiceLines().get(i);
                validateInvoiceLineRequest(line, i + 1, errors);
            }
        }

        // Validate issue date if provided
        if (request.getIssueDate() != null && request.getIssueDate().isAfter(LocalDateTime.now())) {
            errors.add("تاريخ الإصدار لا يمكن أن يكون في المستقبل");
        }

        // Validate notes length if provided
        if (request.getNotes() != null && request.getNotes().length() > MAX_NOTES_LENGTH) {
            errors.add("الملاحظات لا يمكن أن تتجاوز " + MAX_NOTES_LENGTH + " حرف");
        }

        if (!errors.isEmpty()) {
            String allErrors = String.join(", ", errors);
            log.error("Validation failed for invoice request: {}", allErrors);
            throw new ValidationException("فشل في التحقق من صحة البيانات: " + allErrors);
        }
    }

    /**
     * Validate individual invoice line request
     */
    private void validateInvoiceLineRequest(CreateInvoiceLineRequest line, int lineNumber, List<String> errors) {
        String prefix = "البند " + lineNumber + ": ";

        if (line.getGlassTypeId() == null) {
            errors.add(prefix + "نوع الزجاج مطلوب");
        } else if (line.getGlassTypeId() <= 0) {
            errors.add(prefix + "معرف نوع الزجاج غير صالح");
        }

        if (line.getWidth() == null || line.getWidth() <= 0) {
            errors.add(prefix + "العرض يجب أن يكون أكبر من صفر");
        }

        if (line.getHeight() == null || line.getHeight() <= 0) {
            errors.add(prefix + "الارتفاع يجب أن يكون أكبر من صفر");
        }

        // Validate dimensions with unit conversion
        if (line.getWidth() != null && line.getWidth() > 0 &&
            line.getHeight() != null && line.getHeight() > 0) {
            try {
                validateDimensions(line.getWidth(), line.getHeight(), line.getDimensionUnit());
            } catch (InvalidDimensionsException e) {
                errors.add(prefix + e.getMessage());
            }
        }

        // Validate operations - New Format
        if (line.hasOperations()) {
            for (int j = 0; j < line.getOperations().size(); j++) {
                var op = line.getOperations().get(j);
                if (op.getType() == null) {
                    errors.add(prefix + "نوع العملية مطلوب للعملية رقم " + (j + 1));
                    continue;
                }

                if (op.getType() == OperationType.SHATAF) {
                    if (op.getShatafType() == null) {
                        errors.add(prefix + "نوع الشطف مطلوب للعملية رقم " + (j + 1));
                    } else if (op.getShatafType().isManualInput()) {
                        if (op.getManualCuttingPrice() == null || op.getManualCuttingPrice() < 0) {
                            errors.add(prefix + "سعر القطع اليدوي مطلوب للعملية رقم " + (j + 1));
                        }
                    }
                } else if (op.getType() == OperationType.LASER) {
                    if (op.getManualPrice() == null || op.getManualPrice() < 0) {
                        errors.add(prefix + "سعر الليزر مطلوب للعملية رقم " + (j + 1));
                    }
                }
            }
        }
        // Validate Legacy Format (only if no operations provided)
        else {
            if (line.getCuttingType() == null) {
                errors.add(prefix + "نوع القطع مطلوب");
            }

            // Validate manual cutting price for laser
            if (CuttingType.LASER.equals(line.getCuttingType())) {
                if (line.getManualCuttingPrice() == null) {
                    errors.add(prefix + "سعر القطع اليدوي مطلوب للقطع بالليزر");
                } else if (line.getManualCuttingPrice() < 0) {
                    errors.add(prefix + "سعر القطع اليدوي لا يمكن أن يكون سالباً");
                }
            }
        }
    }

    /**
     * Helper method to get operation name from exception
     */
    private String getOperationName(Exception e) {
        if (e instanceof CustomerLookupException)
            return "Customer Lookup";
        if (e instanceof InvoiceCreationException)
            return "Invoice Creation";
        if (e instanceof InvoiceLineCreationException)
            return "Invoice Lines Creation";
        if (e instanceof InvoiceUpdateException)
            return "Invoice Update";
        if (e instanceof InvoiceReloadException)
            return "Invoice Reload";
        return "Unknown Operation";
    }

    /**
     * Schedule factory notification retry (non-critical)
     */
    private void scheduleFactoryNotificationRetry(Invoice invoice, String arabicMessage) {
        try {
            // Could add to retry queue, schedule delayed notification, etc.
            log.warn("Factory notification retry scheduled for invoice {}: {}", invoice.getId(), arabicMessage);
            // Example: retryService.scheduleFactoryNotification(invoice, 5); // retry in 5
            // minutes
        } catch (Exception e) {
            log.error("Failed to schedule notification retry for invoice {}: {}", invoice.getId(), e.getMessage());
        }
    }

    // ================ OTHER METHODS (unchanged) ================

    public Optional<Invoice> findById(String id) {
        return invoiceRepository.findByIdWithDetails(id);
    }

    public Page<Invoice> findInvoicesByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return invoiceRepository.findByIssueDateBetween(startDate, endDate, pageable);
    }

    public Page<Invoice> findInvoicesByCustomer(String customerName, Pageable pageable) {
        return invoiceRepository.findByCustomerNameOrPhone(customerName, pageable);
    }

    public Invoice markAsPaid(String invoiceId) {
        Invoice invoice = findById(invoiceId)
                .orElseThrow(() -> new InvoiceNotFoundException("Invoice not found: " + invoiceId));

        if (invoice.getStatus() != InvoiceStatus.PAID) {
            Double remaining = invoice.getRemainingBalance();
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaymentDate(LocalDateTime.now());
            invoice.setRemainingBalance(0.0);

            // Deduct the remaining amount from customer balance (reduce debt)
            if (invoice.getCustomer().getCustomerType() != com.example.backend.models.enums.CustomerType.CASH) {
                // We use negative amount to subtract or we need a subtract method
                // Customer.subtractFromBalance is available but we need a service method
                // Let's use updateCustomerBalance with negative amount
                customerService.updateCustomerBalance(invoice.getCustomer().getId(), -remaining);
            }
        }

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public void deleteInvoice(String invoiceId) {
        Invoice invoice = findById(invoiceId)
                .orElseThrow(() -> new InvoiceNotFoundException("Invoice not found: " + invoiceId));

        // 1. Reverse Payments (if any)
        if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getAmountPaidNow() > 0) {
            List<com.example.backend.dto.PaymentDTO> payments = paymentService.getInvoicePayments(invoiceId);
            for (com.example.backend.dto.PaymentDTO payment : payments) {
                paymentService.deletePayment(payment.getId());
                log.info("Reversed payment {} for deleted invoice {}", payment.getId(), invoiceId);
            }
        } else if (invoice.getStatus() == InvoiceStatus.PENDING) {
            // Even if pending, if it's not a CASH customer, the invoice Total was added to
            // balance as debt.
            // We must reverse this debt.
            // Note: If invoice was PAID, deletePayment() handles the credit reversal
            // (Payment),
            // but we still need to reverse the Debit (Invoice Total).
            // So this logic applies to ALL non-CASH customers regardless of status.
        }

        // 2. Reverse Invoice Debt (for non-CASH customers)
        if (invoice.getCustomer().getCustomerType() != com.example.backend.models.enums.CustomerType.CASH) {
            customerService.updateCustomerBalance(invoice.getCustomer().getId(), -invoice.getTotalPrice());
            log.info("Reversed invoice debt ({}) for customer {}", invoice.getTotalPrice(),
                    invoice.getCustomer().getId());
        }

        invoiceRepository.delete(invoice);
        log.info("Deleted invoice {}", invoiceId);
    }

    public Invoice markAsCancelled(String invoiceId) {
        Invoice invoice = findById(invoiceId)
                .orElseThrow(() -> new InvoiceNotFoundException("Invoice not found: " + invoiceId));

        invoice.setStatus(InvoiceStatus.CANCELLED);

        return invoiceRepository.save(invoice);
    }

    public Double getTotalRevenue(LocalDateTime startDate, LocalDateTime endDate) {
        Double revenue = invoiceRepository.getTotalRevenueByStatusAndDateRange(
                InvoiceStatus.PAID, startDate, endDate);
        return revenue != null ? revenue : 0.0;
    }

    public List<Invoice> findAll() {
        return invoiceRepository.findAll();
    }

    public Page<Invoice> findRecentInvoices(Pageable pageable) {
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
        LocalDateTime now = LocalDateTime.now();
        return invoiceRepository.findByIssueDateBetween(yesterday, now, pageable);
    }

    public Page<Invoice> findInvoicesByCustomer(Long customerId, Pageable pageable) {
        return invoiceRepository.findByCustomerId(customerId, pageable);

    }

    // In InvoiceService.java
    public Page<Invoice> findInvoicesByCustomerId(Long customerId, Pageable pageable) {
        log.debug("Finding invoices for customer ID: {}", customerId);
        return invoiceRepository.findByCustomerId(customerId, pageable);
    }

    public Page<Invoice> findInvoicesByStatus(InvoiceStatus status, Pageable pageable) {
        log.debug("Finding invoices with status: {}", status);
        return invoiceRepository.findByStatus(status, pageable);
    }

    /**
     * Calculate line preview without creating invoice
     * This ensures frontend sees exact same calculations as backend
     * UPDATED to support both legacy (cuttingType) and new (shatafType/farmaType)
     * formats
     *
     * @param request Preview request with dimensions in original unit
     * @return LinePreviewDTO with all calculations in meters
     */
    public LinePreviewDTO calculateLinePreview(PreviewLineRequest request) {
        log.debug(
                "Calculating line preview for glass type: {}, width: {}, height: {}, unit: {}, shatafType: {}, cuttingType: {}",
                request.getGlassTypeId(), request.getWidth(), request.getHeight(),
                request.getDimensionUnit(), request.getShatafType(), request.getCuttingType());

        try {
            // 1. Validate and get glass type
            GlassType glassType = glassTypeService.findById(request.getGlassTypeId())
                    .orElseThrow(() -> new GlassTypeNotFoundException(
                            "Glass type not found: " + request.getGlassTypeId(),
                            request.getGlassTypeId()));

            // 2. Convert dimensions to meters based on unit
            Double width = convertToMeters(request.getWidth(), request.getDimensionUnit());
            Double height = convertToMeters(request.getHeight(), request.getDimensionUnit());

            // 3. Validate converted dimensions (now in meters)
            validateDimensionsInMeters(width, height, request.getDimensionUnit());

            // 4. Calculate quantities (same logic as InvoiceLine)
            Double areaM2 = width * height;
            Double lengthM = null;
            Double quantityForPricing;
            String quantityUnit;
            String calculationDescription;

            if (glassType.getCalculationMethod() == com.example.backend.models.enums.CalculationMethod.LENGTH) {
                lengthM = Math.max(width, height);
                quantityForPricing = lengthM;
                quantityUnit = "متر طولي";
                calculationDescription = String.format("طول: %.2f متر", lengthM);
            } else {
                quantityForPricing = areaM2;
                quantityUnit = "متر مربع";
                calculationDescription = String.format("مساحة: %.2f متر مربع", areaM2);
            }

            // 5. Calculate glass price (Using BigDecimal for precision)
            Double glassUnitPrice = glassType.getPricePerMeter();
            java.math.BigDecimal quantityBD = java.math.BigDecimal.valueOf(quantityForPricing);
            java.math.BigDecimal priceBD = java.math.BigDecimal.valueOf(glassUnitPrice);
            Double glassPrice = quantityBD.multiply(priceBD)
                    .setScale(2, java.math.RoundingMode.HALF_UP).doubleValue();

            // 6. Calculate cutting price (support both old and new formats)
            Double perimeter = 2 * (width + height);
            Double cuttingRate = null;
            Double cuttingPrice = 0.0;

            // NEW: Multi-operation support
            CuttingType effectiveCuttingType = null;
            List<com.example.backend.dto.invoice.OperationPreviewDTO> operationPreviews = new java.util.ArrayList<>();

            if (request.getOperations() != null && !request.getOperations().isEmpty()) {
                // NEW LOGIC: Calculate each operation
                for (OperationRequest opReq : request.getOperations()) {
                    com.example.backend.models.InvoiceLineOperation op = operationCalculationService
                            .createAndCalculateOperation(
                                    opReq,
                                    width,
                                    height,
                                    glassType.getThickness());
                    cuttingPrice += op.getOperationPrice();

                    // Add to preview list
                    operationPreviews.add(com.example.backend.dto.invoice.OperationPreviewDTO.builder()
                            .type(op.getOperationType())
                            .shatafType(op.getShatafType())
                            .farmaType(op.getFarmaType())
                            .laserType(op.getLaserType())
                            .diameter(op.getDiameter())
                            .manualPrice(op.getManualPrice())
                            .manualCuttingPrice(op.getManualCuttingPrice())
                            .calculatedPrice(op.getOperationPrice())
                            .shatafMeters(op.getShatafMeters())
                            .ratePerMeter(op.getRatePerMeter())
                            .notes(op.getNotes())
                            .build());
                }

                // For preview, if we have operations, we might want to expose the total price
                cuttingRate = perimeter > 0 ? cuttingPrice / perimeter : 0.0;

            } else {
                // LEGACY LOGIC
                effectiveCuttingType = request.getEffectiveCuttingType();

                if (effectiveCuttingType == CuttingType.LASER ||
                        (request.getShatafType() != null && request.getShatafType().isManualInput())) {
                    // Manual price (laser or manual shataf types)
                    if (request.getManualCuttingPrice() == null) {
                        throw new CuttingCalculationException("سعر القطع اليدوي مطلوب للقطع بالليزر");
                    }
                    if (request.getManualCuttingPrice() < 0) {
                        throw new CuttingCalculationException("سعر القطع اليدوي لا يمكن أن يكون سالباً");
                    }
                    cuttingPrice = request.getManualCuttingPrice();
                } else {
                    // SHATF - use the same strategy pattern as actual invoice creation
                    InvoiceLine tempLine = InvoiceLine.builder()
                            .glassType(glassType)
                            .width(width)
                            .height(height)
                            .cuttingType(effectiveCuttingType)
                            .shatafType(request.getShatafType())
                            .farmaType(request.getFarmaType())
                            .diameter(request.getDiameter())
                            .build();

                    cuttingPrice = cuttingContext.calculateCuttingPrice(tempLine);
                    cuttingRate = cuttingPrice / perimeter;
                }
            }

            // 7. Calculate total (Using BigDecimal for precision)
            Double lineTotal = java.math.BigDecimal.valueOf(glassPrice)
                    .add(java.math.BigDecimal.valueOf(cuttingPrice))
                    .setScale(2, java.math.RoundingMode.HALF_UP).doubleValue();

            // 8. Build and return preview DTO (all dimensions in meters)
            return LinePreviewDTO.builder()
                    .width(width)
                    .height(height)
                    .glassTypeId(glassType.getId())
                    .glassTypeName(glassType.getName())
                    .thickness(glassType.getThickness())
                    .calculationMethod(glassType.getCalculationMethod().toString())
                    .areaM2(areaM2)
                    .lengthM(lengthM)
                    .quantityForPricing(quantityForPricing)
                    .glassUnitPrice(glassUnitPrice)
                    .glassPrice(glassPrice)
                    .glassPrice(glassPrice)
                    .cuttingType(effectiveCuttingType != null ? effectiveCuttingType.toString() : null)
                    .cuttingRate(cuttingRate)
                    .perimeter(perimeter)
                    .cuttingPrice(cuttingPrice)
                    .lineTotal(lineTotal)
                    .quantityUnit(quantityUnit)
                    .calculationDescription(calculationDescription)
                    .operations(operationPreviews)
                    .build();

        } catch (GlassTypeNotFoundException | InvalidDimensionsException | CuttingCalculationException e) {
            log.error("Error calculating line preview: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error calculating line preview: {}", e.getMessage(), e);
            throw new CuttingCalculationException("خطأ في حساب معاينة البند: " + e.getMessage(), e);
        }
    }

    /**
     * Convert dimension to meters based on unit
     * 
     * @param value Dimension value in original unit
     * @param unit  Dimension unit (MM, CM, M)
     * @return Value converted to meters
     */
    private Double convertToMeters(Double value, DimensionUnit unit) {
        if (value == null) {
            log.warn("Null dimension value provided, returning 0.0");
            return 0.0;
        }

        return switch (unit) {
            case MM -> value / 1000.0;
            case CM -> value / 100.0;
            case M -> value;
            default -> {
                log.warn("Unknown dimension unit: {}, defaulting to MM", unit);
                yield value / 1000.0;
            }
        };
    }

    /**
     * Inner class to hold invoice line processing results
     */
    @Getter
    private static class InvoiceLineProcessingResult {
        private final double totalPrice;
        private final List<String> errors;
        private final int successfulLines;

        public InvoiceLineProcessingResult(double totalPrice, List<String> errors, int successfulLines) {
            this.totalPrice = totalPrice;
            this.errors = errors;
            this.successfulLines = successfulLines;
        }

    }
}