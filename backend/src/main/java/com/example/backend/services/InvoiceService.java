package com.example.backend.services;

import com.example.backend.dto.CreateInvoiceLineRequest;
import com.example.backend.dto.CreateInvoiceRequest;
import com.example.backend.models.customer.Customer;
import com.example.backend.models.GlassType;
import com.example.backend.models.Invoice;
import com.example.backend.models.InvoiceLine;
import com.example.backend.models.enums.CuttingType;
import com.example.backend.models.enums.InvoiceStatus;
import com.example.backend.repositories.InvoiceLineRepository;
import com.example.backend.repositories.InvoiceRepository;
import com.example.backend.services.cutting.CuttingContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
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

    public Invoice createInvoice(CreateInvoiceRequest request) {
        validateCreateInvoiceRequest(request);

        // Find or create customer
        Customer customer = customerService.findOrCreateCustomer(
                request.getCustomerName(),
                request.getCustomerPhone(),
                request.getCustomerAddress()
        );

        // Create invoice
        Invoice invoice = new Invoice(customer);
        invoice = invoiceRepository.save(invoice);

        // Add invoice lines
        double totalPrice = 0.0;
        for (CreateInvoiceLineRequest lineRequest : request.getInvoiceLines()) {
            InvoiceLine line = createInvoiceLine(invoice, lineRequest);
            totalPrice += line.getLineTotal();
        }

        // Update total price
        invoice.setTotalPrice(totalPrice);
        invoice = invoiceRepository.save(invoice);

        // Create print jobs for all 3 copies
        printJobService.createPrintJobs(invoice);

        // Notify factory screen via WebSocket
        webSocketService.notifyNewInvoice(invoice);

        return invoice;
    }

    private InvoiceLine createInvoiceLine(Invoice invoice, CreateInvoiceLineRequest request) {
        GlassType glassType = glassTypeService.findById(request.getGlassTypeId())
                .orElseThrow(() -> new RuntimeException("Glass type not found: " + request.getGlassTypeId()));



        InvoiceLine line = new InvoiceLine(invoice, glassType,
                request.getWidth(), request.getHeight(), request.getCuttingType());

        // Calculate glass price
        double glassPrice = line.getQuantityForPricing() * glassType.getPricePerMeter();

        // Calculate cutting price using strategy pattern
        double cuttingPrice;
        if (request.getCuttingType() == CuttingType.LASER && request.getManualCuttingPrice() != null) {
            // Manual input for laser cutting
            cuttingPrice = request.getManualCuttingPrice();
            line.setCuttingPrice(cuttingPrice);
        } else {
            // Auto-calculation for شطف or laser without manual input
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
