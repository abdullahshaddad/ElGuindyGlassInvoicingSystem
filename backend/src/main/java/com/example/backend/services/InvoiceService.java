package com.example.backend.services;

import com.example.backend.dto.CreateInvoiceLineRequest;
import com.example.backend.dto.CreateInvoiceRequest;
import com.example.backend.exceptions.customer.CustomerLookupException;
import com.example.backend.exceptions.customer.CustomerNotFoundException;
import com.example.backend.exceptions.invoice.*;
import com.example.backend.exceptions.printjob.PdfGenerationException;
import com.example.backend.exceptions.websocket.WebSocketException;
import com.example.backend.models.customer.Customer;
import com.example.backend.models.GlassType;
import com.example.backend.models.Invoice;
import com.example.backend.models.InvoiceLine;
import com.example.backend.models.enums.CuttingType;
import com.example.backend.models.enums.InvoiceStatus;
import com.example.backend.repositories.InvoiceLineRepository;
import com.example.backend.repositories.InvoiceRepository;
import com.example.backend.services.cutting.CuttingContext;
import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.validation.ValidationException;
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

    // Constants for validation
    private static final double MAX_GLASS_WIDTH = 5000.0;  // 5 meters in mm
    private static final double MAX_GLASS_HEIGHT = 3000.0; // 3 meters in mm
    private static final double MIN_DIMENSION = 0.1;       // Minimum 0.1mm
    private static final int MAX_NOTES_LENGTH = 500;

    private final InvoiceRepository invoiceRepository;
    private final InvoiceLineRepository invoiceLineRepository;
    private final CustomerService customerService;
    private final GlassTypeService glassTypeService;
    private final CuttingContext cuttingContext;
    private final PrintJobService printJobService;
    private final WebSocketNotificationService webSocketService;

    @Autowired
    public InvoiceService(InvoiceRepository invoiceRepository,
                          InvoiceLineRepository invoiceLineRepository,
                          CustomerService customerService,
                          GlassTypeService glassTypeService,
                          CuttingContext cuttingContext,
                          PrintJobService printJobService,
                          WebSocketNotificationService webSocketService) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceLineRepository = invoiceLineRepository;
        this.customerService = customerService;
        this.glassTypeService = glassTypeService;
        this.cuttingContext = cuttingContext;
        this.printJobService = printJobService;
        this.webSocketService = webSocketService;
    }

    /**
     * Create a new invoice with comprehensive error handling
     * @param request The invoice creation request
     * @return Created invoice
     * @throws InvoiceCreationException if invoice creation fails
     */
    @Transactional(rollbackFor = Exception.class)
    public Invoice createInvoice(CreateInvoiceRequest request) {
        log.info("Starting invoice creation for customer ID: {}", request.getCustomerId());
        Long invoiceId = null;

        try {
            // 1. Validate request
            validateCreateInvoiceRequest(request);

            // 2. Lookup customer with error handling
            Customer customer = lookupCustomer(request.getCustomerId());

            // 3. Create invoice with error handling
            Invoice invoice = createInvoiceEntity(customer, request);
            invoiceId = invoice.getId();

            // 4. Add invoice lines with individual error handling
            InvoiceLineProcessingResult lineResult = processInvoiceLines(invoice, request.getInvoiceLines());

            // 5. Validate that we have at least one successful line
            if (lineResult.getSuccessfulLines() == 0) {
                String allErrors = String.join(", ", lineResult.getErrors());
                log.error("All invoice lines failed for invoice {}: {}", invoiceId, allErrors);
                throw new InvoiceLineCreationException("فشل في إنشاء جميع بنود الفاتورة: " + allErrors);
            }

            // Log warnings for partial failures
            if (!lineResult.getErrors().isEmpty()) {
                log.warn("Invoice {} created with {} successful lines and {} failed lines. Errors: {}",
                        invoiceId, lineResult.getSuccessfulLines(), lineResult.getErrors().size(), lineResult.getErrors());
            }

            // 6. Update total price
            invoice = updateInvoiceTotal(invoice, lineResult.getTotalPrice());

            // 7. Reload invoice with lines and glass types
            invoice = reloadInvoiceWithLines(invoiceId);

            // 8. Create print jobs (non-critical)
            handlePrintJobCreation(invoice);

            // 9. Notify factory screen (non-critical)
            handleFactoryNotification(invoice);

            // 10. Log success with summary
            log.info("Invoice {} created successfully for customer '{}' (ID: {}) with {} lines, total: {} EGP. {} errors occurred.",
                    invoiceId, customer.getName(), customer.getId(), lineResult.getSuccessfulLines(),
                    lineResult.getTotalPrice(), lineResult.getErrors().size());

            return invoice;

        } catch (ValidationException e) {
            log.error("Validation failed for invoice creation: {}", e.getMessage());
            throw e;
        } catch (CustomerNotFoundException e) {
            log.error("Customer not found during invoice creation: {}", e.getMessage());
            throw e;
        } catch (CustomerLookupException | InvoiceCreationException |
                 InvoiceLineCreationException | InvoiceUpdateException |
                 InvoiceReloadException e) {
            log.error("Invoice creation failed at step '{}': {}", getOperationName(e), e.getMessage(), e);
            throw e;
        } catch (DataAccessException e) {
            log.error("Database error during invoice creation: {}", e.getMessage(), e);
            throw new InvoiceCreationException("خطأ في قاعدة البيانات أثناء إنشاء الفاتورة", e);
        } catch (Exception e) {
            log.error("Unexpected error during invoice creation for customer {}: {}",
                    request.getCustomerId(), e.getMessage(), e);
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
            Invoice invoice = Invoice.builder()
                    .customer(customer)
                    .issueDate(request.getIssueDate() != null ? request.getIssueDate() : LocalDateTime.now())
                    .status(InvoiceStatus.PENDING)
                    .totalPrice(0.0)
                    .build();

            invoice = invoiceRepository.save(invoice);
            log.debug("Invoice created with ID: {} for customer: {}", invoice.getId(), customer.getName());
            return invoice;
        } catch (DataAccessException e) {
            log.error("Database error while creating invoice for customer {}: {}", customer.getId(), e.getMessage(), e);
            throw new InvoiceCreationException("خطأ في قاعدة البيانات أثناء إنشاء الفاتورة", e);
        } catch (Exception e) {
            log.error("Unexpected error while creating invoice for customer {}: {}", customer.getId(), e.getMessage(), e);
            throw new InvoiceCreationException("خطأ غير متوقع أثناء إنشاء الفاتورة", e);
        }
    }

    /**
     * Process all invoice lines and collect results
     */
    private InvoiceLineProcessingResult processInvoiceLines(Invoice invoice, List<CreateInvoiceLineRequest> lineRequests) {
        double totalPrice = 0.0;
        List<String> lineErrors = new ArrayList<>();
        int successfulLines = 0;

        for (int i = 0; i < lineRequests.size(); i++) {
            CreateInvoiceLineRequest lineRequest = lineRequests.get(i);
            try {
                InvoiceLine line = createInvoiceLine(invoice, lineRequest);
                totalPrice += line.getLineTotal();
                successfulLines++;
                log.debug("Invoice line {} created successfully with total: {} EGP", i + 1, line.getLineTotal());
            } catch (GlassTypeNotFoundException e) {
                String error = String.format("البند %d: نوع الزجاج غير موجود (ID: %d)", i + 1, lineRequest.getGlassTypeId());
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

        return new InvoiceLineProcessingResult(totalPrice, lineErrors, successfulLines);
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
    private Invoice reloadInvoiceWithLines(Long invoiceId) {
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
     * Handle print job creation (non-critical)
     */
    private void handlePrintJobCreation(Invoice invoice) {
        try {
            printJobService.createPrintJobs(invoice);
            log.debug("Print jobs created successfully for invoice {}", invoice.getId());
        } catch (PdfGenerationException e) {
            log.error("PDF generation failed for invoice {}: {}", invoice.getId(), e.getMessage(), e);
            notifyPrintJobFailure(invoice.getId(), "فشل في إنشاء ملف PDF", e);
        } catch (DataAccessException e) {
            log.error("Database error creating print jobs for invoice {}: {}", invoice.getId(), e.getMessage(), e);
            notifyPrintJobFailure(invoice.getId(), "خطأ في قاعدة البيانات أثناء إنشاء مهام الطباعة", e);
        } catch (Exception e) {
            log.error("Unexpected error creating print jobs for invoice {}: {}", invoice.getId(), e.getMessage(), e);
            notifyPrintJobFailure(invoice.getId(), "خطأ غير متوقع في إنشاء مهام الطباعة", e);
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
     */
    private InvoiceLine createInvoiceLine(Invoice invoice, CreateInvoiceLineRequest request) {
        // Validate glass type exists

        GlassType glassType = glassTypeService.findById(request.getGlassTypeId())
                .orElseThrow();

        // Validate dimensions
        validateDimensions(request.getWidth(), request.getHeight());

        // Create invoice line
        InvoiceLine line = new InvoiceLine(invoice, glassType, request.getWidth(), request.getHeight(), request.getCuttingType());

        // Calculate glass price based on calculation method
        double glassPrice = line.getQuantityForPricing() * glassType.getPricePerMeter();

        // Calculate cutting price
        double cuttingPrice = calculateCuttingPrice(line, request);

        // Set totals
        line.setCuttingPrice(cuttingPrice);
        line.setLineTotal(glassPrice + cuttingPrice);

        return invoiceLineRepository.save(line);
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
     * Validate dimensions are within reasonable limits
     */
    private void validateDimensions(Double width, Double height) {
        if (width == null || height == null) {
            throw new InvalidDimensionsException("العرض والارتفاع مطلوبان");
        }

        if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
            throw new InvalidDimensionsException("الأبعاد صغيرة جداً (الحد الأدنى: " + MIN_DIMENSION + " مم)");
        }

        if (width > MAX_GLASS_WIDTH) {
            throw new InvalidDimensionsException("العرض كبير جداً (الحد الأقصى: " + MAX_GLASS_WIDTH + " مم)");
        }

        if (height > MAX_GLASS_HEIGHT) {
            throw new InvalidDimensionsException("الارتفاع كبير جداً (الحد الأقصى: " + MAX_GLASS_HEIGHT + " مم)");
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
        } else if (line.getWidth() > MAX_GLASS_WIDTH) {
            errors.add(prefix + "العرض كبير جداً (الحد الأقصى: " + MAX_GLASS_WIDTH + " مم)");
        }

        if (line.getHeight() == null || line.getHeight() <= 0) {
            errors.add(prefix + "الارتفاع يجب أن يكون أكبر من صفر");
        } else if (line.getHeight() > MAX_GLASS_HEIGHT) {
            errors.add(prefix + "الارتفاع كبير جداً (الحد الأقصى: " + MAX_GLASS_HEIGHT + " مم)");
        }

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

    /**
     * Helper method to get operation name from exception
     */
    private String getOperationName(Exception e) {
        if (e instanceof CustomerLookupException) return "Customer Lookup";
        if (e instanceof InvoiceCreationException) return "Invoice Creation";
        if (e instanceof InvoiceLineCreationException) return "Invoice Lines Creation";
        if (e instanceof InvoiceUpdateException) return "Invoice Update";
        if (e instanceof InvoiceReloadException) return "Invoice Reload";
        return "Unknown Operation";
    }

    /**
     * Handle print job failure notification (non-critical)
     */
    private void notifyPrintJobFailure(Long invoiceId, String arabicMessage, Exception cause) {
        try {
            // Could send notification to admin dashboard, email, etc.
            log.warn("Print job failure notification for invoice {}: {}", invoiceId, arabicMessage);
            // Example: emailService.notifyAdminPrintJobFailure(invoiceId, arabicMessage, cause);
        } catch (Exception e) {
            log.error("Failed to notify print job failure for invoice {}: {}", invoiceId, e.getMessage());
        }
    }

    /**
     * Schedule factory notification retry (non-critical)
     */
    private void scheduleFactoryNotificationRetry(Invoice invoice, String arabicMessage) {
        try {
            // Could add to retry queue, schedule delayed notification, etc.
            log.warn("Factory notification retry scheduled for invoice {}: {}", invoice.getId(), arabicMessage);
            // Example: retryService.scheduleFactoryNotification(invoice, 5); // retry in 5 minutes
        } catch (Exception e) {
            log.error("Failed to schedule notification retry for invoice {}: {}", invoice.getId(), e.getMessage());
        }
    }

    // ================ OTHER METHODS (unchanged) ================

    public Optional<Invoice> findById(Long id) {
        return invoiceRepository.findById(id);
    }

    public Page<Invoice> findInvoicesByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return invoiceRepository.findByIssueDateBetween(startDate, endDate, pageable);
    }

    public Page<Invoice> findInvoicesByCustomer(String customerName, Pageable pageable) {
        return invoiceRepository.findByCustomerNameOrPhone(customerName, pageable);
    }

    public Invoice markAsPaid(Long invoiceId) {
        Invoice invoice = findById(invoiceId)
                .orElseThrow(() -> new InvoiceNotFoundException("Invoice not found: " + invoiceId));

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaymentDate(LocalDateTime.now());

        return invoiceRepository.save(invoice);
    }

    public Invoice markAsCancelled(Long invoiceId) {
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
     * Inner class to hold invoice line processing results
     */
    private static class InvoiceLineProcessingResult {
        private final double totalPrice;
        private final List<String> errors;
        private final int successfulLines;

        public InvoiceLineProcessingResult(double totalPrice, List<String> errors, int successfulLines) {
            this.totalPrice = totalPrice;
            this.errors = errors;
            this.successfulLines = successfulLines;
        }

        public double getTotalPrice() { return totalPrice; }
        public List<String> getErrors() { return errors; }
        public int getSuccessfulLines() { return successfulLines; }
    }
}