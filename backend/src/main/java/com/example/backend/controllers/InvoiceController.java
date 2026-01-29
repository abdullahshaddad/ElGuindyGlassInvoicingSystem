package com.example.backend.controllers;

import com.example.backend.dto.CreateInvoiceRequest;
import com.example.backend.dto.invoice.InvoiceDTO;
import com.example.backend.dto.invoice.LinePreviewDTO;
import com.example.backend.dto.invoice.PreviewLineRequest;
import com.example.backend.exceptions.customer.CustomerNotFoundException;
import com.example.backend.exceptions.invoice.CuttingCalculationException;
import com.example.backend.exceptions.invoice.GlassTypeNotFoundException;
import com.example.backend.exceptions.invoice.InvalidDimensionsException;
import com.example.backend.models.Invoice;
import com.example.backend.models.enums.InvoiceStatus;
import com.example.backend.services.ExportService;
import com.example.backend.services.InvoiceService;
import com.example.backend.services.PdfGenerationService;
import com.example.backend.services.PrintJobService;
import com.example.backend.repositories.InvoiceRepository;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/v1/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final ExportService exportService;
    private final PrintJobService printJobService;
    private final PdfGenerationService pdfGenerationService;
    private final InvoiceRepository invoiceRepository;

    @Autowired
    public InvoiceController(InvoiceService invoiceService, ExportService exportService,
            PrintJobService printJobService, PdfGenerationService pdfGenerationService,
            InvoiceRepository invoiceRepository) {
        this.invoiceService = invoiceService;
        this.exportService = exportService;
        this.printJobService = printJobService;
        this.pdfGenerationService = pdfGenerationService;
        this.invoiceRepository = invoiceRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<Invoice> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        Invoice invoice = invoiceService.createInvoice(request);
        return ResponseEntity.ok(invoice);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<Invoice> getInvoice(@PathVariable String id) {
        return invoiceService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<Page<InvoiceDTO>> getInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "issueDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) InvoiceStatus status) {

        try {
            // Validate page parameters
            if (page < 0) {
                log.warn("Invalid page number: {}", page);
                return ResponseEntity.badRequest().build();
            }
            if (size < 1 || size > 100) {
                log.warn("Invalid page size: {}, defaulting to 20", size);
                size = 20;
            }

            // Create pageable with sorting
            Sort.Direction direction = "DESC".equalsIgnoreCase(sortDirection)
                    ? Sort.Direction.DESC
                    : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            Page<Invoice> invoices;

            // Priority 1: Filter by customer ID (most precise)
            if (customerId != null) {
                log.debug("Fetching invoices for customer ID: {}", customerId);
                invoices = invoiceService.findInvoicesByCustomerId(customerId, pageable);
            }
            // Priority 2: Filter by customer name/phone
            else if (customerName != null && !customerName.trim().isEmpty()) {
                log.debug("Fetching invoices for customer name/phone: {}", customerName);
                invoices = invoiceService.findInvoicesByCustomer(customerName.trim(), pageable);
            }
            // Priority 3: Filter by date range
            else if (startDate != null && endDate != null) {
                // Validate date range
                if (startDate.isAfter(endDate)) {
                    log.warn("Invalid date range: startDate ({}) is after endDate ({})", startDate, endDate);
                    return ResponseEntity.badRequest().build();
                }
                log.debug("Fetching invoices between {} and {}", startDate, endDate);
                invoices = invoiceService.findInvoicesByDateRange(startDate, endDate, pageable);
            }
            // Priority 4: Filter by status only
            else if (status != null) {
                log.debug("Fetching invoices with status: {}", status);
                invoices = invoiceService.findInvoicesByStatus(status, pageable);
            }
            // Default: Recent invoices (last 30 days)
            else {
                LocalDateTime defaultEnd = LocalDateTime.now();
                LocalDateTime defaultStart = defaultEnd.minusDays(30);
                log.debug("Fetching recent invoices (last 30 days)");
                invoices = invoiceService.findInvoicesByDateRange(defaultStart, defaultEnd, pageable);
            }

            // Convert to DTOs (without invoice lines for performance in list view)
            Page<InvoiceDTO> invoiceDTOs = invoices.map(InvoiceDTO::fromWithoutLines);

            log.info("Retrieved {} invoices (page {} of {})",
                    invoiceDTOs.getNumberOfElements(),
                    invoiceDTOs.getNumber() + 1,
                    invoiceDTOs.getTotalPages());

            return ResponseEntity.ok(invoiceDTOs);

        } catch (CustomerNotFoundException e) {
            log.error("Customer not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            log.error("Invalid request parameters: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error retrieving invoices: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/pay")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<Invoice> markAsPaid(@PathVariable String id) {
        Invoice invoice = invoiceService.markAsPaid(id);
        return ResponseEntity.ok(invoice);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteInvoice(@PathVariable String id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Double> getRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        Double revenue = invoiceService.getTotalRevenue(startDate, endDate);
        return ResponseEntity.ok(revenue != null ? revenue : 0.0);
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<byte[]> exportInvoices(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        if (startDate == null || endDate == null) {
            LocalDateTime now = LocalDateTime.now();
            endDate = now;
            startDate = now.minusDays(30);
        }

        byte[] csvData = exportService.exportInvoicesToCsv(startDate, endDate);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoices_export.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    @PostMapping("/preview-line-total")
    public ResponseEntity<LinePreviewDTO> previewLineTotal(
            @RequestBody PreviewLineRequest request) {
        LinePreviewDTO preview = invoiceService.calculateLinePreview(request);
        return ResponseEntity.ok(preview);
    }

    /**
     * Preview line calculation before creating invoice
     */
    @PostMapping("/preview-line")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<LinePreviewDTO> previewLineCalculation(@Valid @RequestBody PreviewLineRequest request) {
        log.info("Previewing line calculation for glass type: {}, dimensions: {}x{}, cutting: {}",
                request.getGlassTypeId(), request.getWidth(), request.getHeight(), request.getCuttingType());

        try {
            LinePreviewDTO preview = invoiceService.calculateLinePreview(request);
            return ResponseEntity.ok(preview);
        } catch (GlassTypeNotFoundException e) {
            log.error("Glass type not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (InvalidDimensionsException e) {
            log.error("Invalid dimensions: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (CuttingCalculationException e) {
            log.error("Cutting calculation error: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error previewing line calculation: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Stream invoice PDF on-demand (no storage)
     * Returns 2-page Arabic RTL PDF with نسخة الشركة and نسخة العميل
     * GET /api/v1/invoices/{id}/pdf
     */
    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER') or hasRole('WORKER')")
    public ResponseEntity<byte[]> getInvoicePdf(@PathVariable String id) {
        try {
            log.info("Streaming on-demand PDF for invoice {}", id);

            // Load invoice with all details
            Invoice invoice = invoiceRepository.findByIdWithDetails(id)
                    .orElse(null);

            if (invoice == null) {
                log.warn("Invoice not found: {}", id);
                return ResponseEntity.notFound().build();
            }

            // Generate PDF on-demand (no storage)
            byte[] pdfBytes = pdfGenerationService.generateInvoicePdfOnDemand(invoice);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", "invoice_" + id + ".pdf");
            headers.setContentLength(pdfBytes.length);

            log.info("PDF streamed successfully for invoice {}, size: {} bytes", id, pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Error generating PDF for invoice {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Download invoice PDF (triggers download instead of inline view)
     * GET /api/v1/invoices/{id}/pdf/download
     */
    @GetMapping("/{id}/pdf/download")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable String id) {
        try {
            log.info("Downloading PDF for invoice {}", id);

            Invoice invoice = invoiceRepository.findByIdWithDetails(id)
                    .orElse(null);

            if (invoice == null) {
                return ResponseEntity.notFound().build();
            }

            byte[] pdfBytes = pdfGenerationService.generateInvoicePdfOnDemand(invoice);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "فاتورة_" + id + ".pdf");
            headers.setContentLength(pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Error downloading PDF for invoice {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Stream invoice sticker PDF on-demand (no storage)
     * One A5 page per invoice line, sorted by thickness
     * GET /api/v1/invoices/{id}/sticker
     */
    @GetMapping("/{id}/sticker")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER') or hasRole('WORKER')")
    public ResponseEntity<byte[]> getInvoiceSticker(@PathVariable String id) {
        try {
            log.info("Streaming on-demand sticker PDF for invoice {}", id);

            Invoice invoice = invoiceRepository.findByIdWithDetails(id)
                    .orElse(null);

            if (invoice == null) {
                log.warn("Invoice not found: {}", id);
                return ResponseEntity.notFound().build();
            }

            byte[] pdfBytes = pdfGenerationService.generateStickerPdfOnDemand(invoice);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", "sticker_" + id + ".pdf");
            headers.setContentLength(pdfBytes.length);

            log.info("Sticker PDF streamed successfully for invoice {}, size: {} bytes", id, pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Error generating sticker for invoice {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Download invoice sticker PDF
     * GET /api/v1/invoices/{id}/sticker/download
     */
    @GetMapping("/{id}/sticker/download")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER') or hasRole('WORKER')")
    public ResponseEntity<byte[]> downloadInvoiceSticker(@PathVariable String id) {
        try {
            log.info("Downloading sticker PDF for invoice {}", id);

            Invoice invoice = invoiceRepository.findByIdWithDetails(id)
                    .orElse(null);

            if (invoice == null) {
                return ResponseEntity.notFound().build();
            }

            byte[] pdfBytes = pdfGenerationService.generateStickerPdfOnDemand(invoice);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "ملصق_" + id + ".pdf");
            headers.setContentLength(pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Error downloading sticker for invoice {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
