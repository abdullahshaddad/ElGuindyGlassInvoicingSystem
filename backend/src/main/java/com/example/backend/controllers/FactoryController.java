package com.example.backend.controllers;

import com.example.backend.dto.PrintJobDTO;
import com.example.backend.models.Invoice;
import com.example.backend.models.PrintJob;
import com.example.backend.services.InvoiceService;
import com.example.backend.services.PrintJobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/factory")
@CrossOrigin(origins = "*")
public class FactoryController {

    private final InvoiceService invoiceService;
    private final PrintJobService printJobService;

    @Autowired
    public FactoryController(InvoiceService invoiceService, PrintJobService printJobService) {
        this.invoiceService = invoiceService;
        this.printJobService = printJobService;
    }

    @GetMapping("/invoices/recent")
    @PreAuthorize("hasRole('WORKER') or hasRole('OWNER')")
    public ResponseEntity<List<Invoice>> getRecentInvoices() {
        // Get invoices from today
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);

        Page<Invoice> invoices = invoiceService.findInvoicesByDateRange(
                startOfDay, endOfDay, PageRequest.of(0, 50));

        return ResponseEntity.ok(invoices.getContent());
    }

    @PostMapping("/print-sticker/{invoiceId}")
    @PreAuthorize("hasRole('WORKER') or hasRole('OWNER')")
    public ResponseEntity<PrintJobDTO> printSticker(@PathVariable Long invoiceId) {
        PrintJob stickerJob = printJobService.createStickerPrintJob(invoiceId);

        // Convert to DTO to avoid Hibernate lazy loading serialization issues
        PrintJobDTO dto = PrintJobDTO.fromEntity(stickerJob);

        return ResponseEntity.ok(dto);
    }
}