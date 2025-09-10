package com.example.backend.controllers;


import com.example.backend.dto.CreateInvoiceRequest;
import com.example.backend.models.Invoice;
import com.example.backend.services.ExportService;
import com.example.backend.services.InvoiceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {
    
    private final InvoiceService invoiceService;
    private final ExportService exportService;
    
    @Autowired
    public InvoiceController(InvoiceService invoiceService, ExportService exportService) {
        this.invoiceService = invoiceService;
        this.exportService = exportService;
    }
    
    @PostMapping
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<Invoice> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        Invoice invoice = invoiceService.createInvoice(request);
        return ResponseEntity.ok(invoice);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<Invoice> getInvoice(@PathVariable Long id) {
        return invoiceService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<Page<Invoice>> getInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String customerName) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Invoice> invoices;
        
        if (customerName != null && !customerName.trim().isEmpty()) {
            invoices = invoiceService.findInvoicesByCustomer(customerName, pageable);
        } else if (startDate != null && endDate != null) {
            invoices = invoiceService.findInvoicesByDateRange(startDate, endDate, pageable);
        } else {
            // Default to last 30 days
            LocalDateTime defaultEnd = LocalDateTime.now();
            LocalDateTime defaultStart = defaultEnd.minusDays(30);
            invoices = invoiceService.findInvoicesByDateRange(defaultStart, defaultEnd, pageable);
        }
        
        return ResponseEntity.ok(invoices);
    }
    
    @PutMapping("/{id}/pay")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<Invoice> markAsPaid(@PathVariable Long id) {
        Invoice invoice = invoiceService.markAsPaid(id);
        return ResponseEntity.ok(invoice);
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
}

