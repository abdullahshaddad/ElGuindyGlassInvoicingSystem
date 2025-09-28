package com.example.backend.services;

import com.example.backend.dto.CreateInvoiceLineRequest;
import com.example.backend.dto.CreateInvoiceRequest;
import com.example.backend.exceptions.invoice.*;
import com.example.backend.models.customer.Customer;
import com.example.backend.models.GlassType;
import com.example.backend.models.Invoice;
import com.example.backend.models.InvoiceLine;
import com.example.backend.models.enums.CuttingType;
import com.example.backend.models.enums.InvoiceStatus;
import com.example.backend.repositories.InvoiceLineRepository;
import com.example.backend.repositories.InvoiceRepository;
import com.example.backend.services.cutting.CuttingContext;
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
        System.out.println("Inside createInvoice method" + request.toString());
        Long invoiceId = null;

        try {
            log.info("Starting invoice creation for customer: {}", request.getCustomerName());

            // 1. Validate request
            validateCreateInvoiceRequest(request);

            // 2. Find or create customer with error handling
            Customer customer;
            try {
                customer = customerService.findOrCreateCustomer(
                        request.getCustomerName(),
                        request.getCustomerPhone(),
                        request.getCustomerAddress()
                );
                log.debug("Customer resolved: ID={}, Name={}", customer.getId(), customer.getName());
            } catch (Exception e) {
                log.error("Failed to resolve customer: {}", e.getMessage(), e);
                throw new CustomerResolutionException("فشل في إنشاء أو العثور على العميل: " + e.getMessage(), e);
            }

            // 3. Create invoice with error handling
            Invoice invoice;
            try {
                invoice = new Invoice(customer);
                invoice = invoiceRepository.save(invoice);
                invoiceId = invoice.getId();
                log.debug("Invoice created with ID: {}", invoiceId);
            } catch (DataAccessException e) {
                log.error("Database error while creating invoice: {}", e.getMessage(), e);
                throw new InvoiceCreationException("خطأ في قاعدة البيانات أثناء إنشاء الفاتورة", e);
            } catch (Exception e) {
                log.error("Unexpected error while creating invoice: {}", e.getMessage(), e);
                throw new InvoiceCreationException("خطأ غير متوقع أثناء إنشاء الفاتورة", e);
            }

            // 4. Add invoice lines with individual error handling
            double totalPrice = 0.0;
            List<String> lineErrors = new ArrayList<>();

            for (int i = 0; i < request.getInvoiceLines().size(); i++) {
                CreateInvoiceLineRequest lineRequest = request.getInvoiceLines().get(i);
                try {
                    InvoiceLine line = createInvoiceLine(invoice, lineRequest);
                    totalPrice += line.getLineTotal();
                    log.debug("Invoice line {} created successfully with total: {}", i + 1, line.getLineTotal());
                } catch (GlassTypeNotFoundException e) {
                    String error = String.format("البند %d: نوع الزجاج غير موجود (ID: %d)",
                            i + 1, lineRequest.getGlassTypeId());
                    lineErrors.add(error);
                    log.error("Glass type not found for line {}: {}", i + 1, e.getMessage());
                } catch (InvalidDimensionsException e) {
                    String error = String.format("البند %d: أبعاد غير صالحة - %s", i + 1, e.getMessage());
                    lineErrors.add(error);
                    log.error("Invalid dimensions for line {}: {}", i + 1, e.getMessage());
                } catch (CuttingCalculationException e) {
                    String error = String.format("البند %d: خطأ في حساب القطع - %s", i + 1, e.getMessage());
                    lineErrors.add(error);
                    log.error("Cutting calculation error for line {}: {}", i + 1, e.getMessage());
                } catch (Exception e) {
                    String error = String.format("البند %d: خطأ غير متوقع - %s", i + 1, e.getMessage());
                    lineErrors.add(error);

                    log.error("Unexpected error for invoice line {}: {}", i + 1, e.getMessage(), e);
                }
            }

            // Check if we have any invoice lines created
            if (totalPrice == 0.0 && !lineErrors.isEmpty()) {
                throw new InvoiceLineCreationException("فشل في إنشاء جميع بنود الفاتورة: " + String.join(", ", lineErrors));
            }

            // Log warnings for partial failures
            if (!lineErrors.isEmpty()) {
                log.warn("Invoice {} created with {} line errors: {}", invoiceId, lineErrors.size(), lineErrors);
            }

            // 5. Update total price
            try {
                invoice.setTotalPrice(totalPrice);
                invoice = invoiceRepository.save(invoice);
                log.debug("Invoice total updated: {}", totalPrice);
            } catch (DataAccessException e) {
                log.error("Failed to update invoice total: {}", e.getMessage(), e);
                throw new InvoiceUpdateException("فشل في تحديث إجمالي الفاتورة", e);
            }

            // 6. Reload invoice with lines and glass types
            try {
                Long finalInvoiceId = invoiceId;
                invoice = invoiceRepository.findByIdWithLines(invoiceId)
                        .orElseThrow(() -> new InvoiceNotFoundException("الفاتورة غير موجودة بعد الإنشاء: " + finalInvoiceId));
                log.debug("Invoice reloaded successfully with {} lines", (int) Optional.ofNullable(invoice.getInvoiceLines()).orElse(List.of()).size());
            } catch (DataAccessException e) {
                log.error("Failed to reload invoice {}: {}", invoiceId, e.getMessage(), e);
                throw new InvoiceReloadException("فشل في إعادة تحميل الفاتورة بعد الإنشاء", e);
            }

            // 7. Create print jobs (non-critical - don't fail invoice creation)
            try {
                printJobService.createPrintJobs(invoice);
                log.debug("Print jobs created successfully for invoice {}", invoiceId);
            } catch (Exception e) {
                log.error("Failed to create print jobs for invoice {}: {}", invoiceId, e.getMessage(), e);
                // Don't throw - print jobs are not critical for invoice creation
                // Could notify admin or add to retry queue
                notifyPrintJobFailure(invoiceId, e);
            }

            // 8. Notify factory screen (non-critical - don't fail invoice creation)
            try {
                webSocketService.notifyNewInvoice(invoice);
                log.debug("Factory notification sent successfully for invoice {}", invoiceId);
            } catch (Exception e) {
                log.error("Failed to notify factory for invoice {}: {}", invoiceId, e.getMessage(), e);
                // Don't throw - notification failure shouldn't fail invoice creation
                // Could add to retry queue or use alternative notification method
                scheduleFactoryNotificationRetry(invoice);
            }

            log.info("Invoice {} created successfully with total: {} EGP", invoiceId, totalPrice);
            return invoice;

        } catch (ValidationException e) {
            log.error("Validation failed for invoice creation: {}", e.getMessage());
            throw e; // Re-throw validation exceptions as-is
        } catch (CustomerResolutionException | InvoiceCreationException |
                 InvoiceLineCreationException | InvoiceUpdateException |
                 InvoiceReloadException e) {
            log.error("Invoice creation failed: {}", e.getMessage(), e);
            throw e; // Re-throw our custom exceptions
        } catch (DataAccessException e) {
            log.error("Database error during invoice creation: {}", e.getMessage(), e);
            throw new InvoiceCreationException("خطأ في قاعدة البيانات أثناء إنشاء الفاتورة", e);
        } catch (Exception e) {
            System.out.println(request);
            log.error("Unexpected error during invoice creation: {}", e.getMessage(), e);
            throw new InvoiceCreationException("خطأ غير متوقع أثناء إنشاء الفاتورة: " + e.getMessage(), e);
        }
    }

    /**
     * Handle print job failure (non-critical)
     */
    private void notifyPrintJobFailure(Long invoiceId, Exception error) {
        try {
            // Could send email to admin, log to separate error table, etc.
            log.warn("Adding print job failure notification for invoice {}", invoiceId);
            // Example: emailService.notifyAdminPrintJobFailure(invoiceId, error);
        } catch (Exception e) {
            log.error("Failed to notify print job failure: {}", e.getMessage());
        }
    }

    /**
     * Schedule retry for factory notification (non-critical)
     */
    private void scheduleFactoryNotificationRetry(Invoice invoice) {
        try {
            // Could add to retry queue, schedule delayed notification, etc.
            log.warn("Scheduling factory notification retry for invoice {}", invoice.getId());
            // Example: retryService.scheduleFactoryNotification(invoice, 5); // retry in 5 minutes
        } catch (Exception e) {
            log.error("Failed to schedule factory notification retry: {}", e.getMessage());
        }
    }

    /**
     * Enhanced validation with detailed error messages
     */


    /**
     * Validate individual invoice line
     */
    private void validateInvoiceLine(CreateInvoiceLineRequest line, int lineNumber, List<String> errors) {
        String prefix = "البند " + lineNumber + ": ";

        if (line.getGlassTypeId() == null) {
            errors.add(prefix + "نوع الزجاج مطلوب");
        }
        if (line.getWidth() == null || line.getWidth() <= 0) {
            errors.add(prefix + "العرض يجب أن يكون أكبر من صفر");
        }
        if (line.getHeight() == null || line.getHeight() <= 0) {
            errors.add(prefix + "الارتفاع يجب أن يكون أكبر من صفر");
        }
        if (line.getCuttingType() == null) {
            errors.add(prefix + "نوع القطع مطلوب");
        }

        // Validate manual cutting price for laser
        if (CuttingType.LASER.equals(line.getCuttingType())) {
            if (line.getManualCuttingPrice() == null || line.getManualCuttingPrice() < 0) {
                errors.add(prefix + "سعر القطع اليدوي مطلوب للقطع بالليزر");
            }
        }

        // Validate dimensions are reasonable
        if (line.getWidth() != null && line.getWidth() > MAX_GLASS_WIDTH) {
            errors.add(prefix + "العرض كبير جداً (الحد الأقصى: " + MAX_GLASS_WIDTH + " مم)");
        }
        if (line.getHeight() != null && line.getHeight() > MAX_GLASS_HEIGHT) {
            errors.add(prefix + "الارتفاع كبير جداً (الحد الأقصى: " + MAX_GLASS_HEIGHT + " مم)");
        }
    }

    /**
     * Validate phone number format
     */
    private boolean isValidPhoneNumber(String phone) {
        // Egyptian phone number validation
        String cleanPhone = phone.replaceAll("[\\s\\-\\+\\(\\)]", "");
        return cleanPhone.matches("^(010|011|012|015)\\d{8}$") ||
                cleanPhone.matches("^20(10|11|12|15)\\d{8}$");
    }

    // Constants for validation
    private static final double MAX_GLASS_WIDTH = 5000.0;  // 5 meters
    private static final double MAX_GLASS_HEIGHT = 3000.0; // 3 meters

    private InvoiceLine createInvoiceLine(Invoice invoice, CreateInvoiceLineRequest request) {
        GlassType glassType = glassTypeService.findById(request.getGlassTypeId())
                .orElseThrow(() -> new RuntimeException("Glass type not found: " + request.getGlassTypeId()));



        InvoiceLine line = new InvoiceLine(invoice, glassType,
                request.getWidth(), request.getHeight(), request.getCuttingType());

        // Calculate glass price
        double glassPrice = line.getQuantityForPricing() * glassType.getPricePerMeter();

        // Calculate cutting price using strategy pattern
        double cuttingPrice;
        if (request.getCuttingType() == CuttingType.LASER) {
            if (request.getManualCuttingPrice() == null) {
                throw new IllegalArgumentException("Manual cutting price is required for Laser cutting");
            }
            cuttingPrice = request.getManualCuttingPrice();
            line.setCuttingPrice(cuttingPrice);
        } else {
            cuttingPrice = cuttingContext.calculateCuttingPrice(line);
            line.setCuttingPrice(cuttingPrice);
        }


        line.setLineTotal(glassPrice + cuttingPrice);

        return invoiceLineRepository.save(line);
    }

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
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceId));

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaymentDate(LocalDateTime.now());

        return invoiceRepository.save(invoice);
    }

    public Invoice markAsCancelled(Long invoiceId) {
        Invoice invoice = findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceId));

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

    private void validateCreateInvoiceRequest(CreateInvoiceRequest request) {
        if (request.getCustomerName() == null || request.getCustomerName().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer name is required");
        }

        if (request.getInvoiceLines() == null || request.getInvoiceLines().isEmpty()) {
            throw new IllegalArgumentException("Invoice must have at least one line item");
        }

        for (CreateInvoiceLineRequest line : request.getInvoiceLines()) {
            validateInvoiceLineRequest(line);
        }
    }

    private void validateInvoiceLineRequest(CreateInvoiceLineRequest line) {
        if (line.getGlassTypeId() == null) {
            throw new IllegalArgumentException("Glass type is required");
        }

        if (line.getWidth() == null || line.getWidth() <= 0) {
            throw new IllegalArgumentException("Width must be positive");
        }

        if (line.getHeight() == null || line.getHeight() <= 0) {
            throw new IllegalArgumentException("Height must be positive");
        }

        if (line.getCuttingType() == null) {
            throw new IllegalArgumentException("Cutting type is required");
        }

        if (line.getCuttingType() == CuttingType.LASER &&
                line.getManualCuttingPrice() != null &&
                line.getManualCuttingPrice() < 0) {
            throw new IllegalArgumentException("Manual cutting price cannot be negative");
        }
    }
}
