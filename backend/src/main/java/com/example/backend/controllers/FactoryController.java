package com.example.backend.controllers;

import com.example.backend.dto.PrintJobDTO;
import com.example.backend.models.Invoice;
import com.example.backend.models.InvoiceLine;
import com.example.backend.models.PrintJob;
import com.example.backend.models.enums.LineStatus;
import com.example.backend.models.enums.WorkStatus;
import com.example.backend.repositories.InvoiceLineRepository;
import com.example.backend.repositories.InvoiceRepository;
import com.example.backend.services.InvoiceService;
import com.example.backend.services.PrintJobService;
import com.example.backend.services.WebSocketNotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/factory")
@CrossOrigin(origins = "*")
@Slf4j
public class FactoryController {

    private final InvoiceService invoiceService;
    private final PrintJobService printJobService;
    private final InvoiceLineRepository invoiceLineRepository;
    private final InvoiceRepository invoiceRepository;
    private final WebSocketNotificationService webSocketService;

    @Autowired
    public FactoryController(InvoiceService invoiceService, PrintJobService printJobService,
                            InvoiceLineRepository invoiceLineRepository,
                            InvoiceRepository invoiceRepository,
                            WebSocketNotificationService webSocketService) {
        this.invoiceService = invoiceService;
        this.printJobService = printJobService;
        this.invoiceLineRepository = invoiceLineRepository;
        this.invoiceRepository = invoiceRepository;
        this.webSocketService = webSocketService;
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
    public ResponseEntity<PrintJobDTO> printSticker(@PathVariable String invoiceId) {
        PrintJob stickerJob = printJobService.createStickerPrintJob(invoiceId);

        // Convert to DTO to avoid Hibernate lazy loading serialization issues
        PrintJobDTO dto = PrintJobDTO.fromEntity(stickerJob);

        return ResponseEntity.ok(dto);
    }

    /**
     * Update line status (for factory workers)
     * PUT /api/v1/factory/line/{lineId}/status
     *
     * @param lineId Line ID
     * @param body   Request body with newStatus field
     * @return Updated line status
     */
    @PutMapping("/line/{lineId}/status")
    @PreAuthorize("hasRole('WORKER') or hasRole('OWNER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateLineStatus(
            @PathVariable Long lineId,
            @RequestBody Map<String, String> body) {
        try {
            String newStatusStr = body.get("status");
            if (newStatusStr == null || newStatusStr.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Status is required"));
            }

            LineStatus newStatus;
            try {
                newStatus = LineStatus.valueOf(newStatusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Invalid status: " + newStatusStr));
            }

            InvoiceLine line = invoiceLineRepository.findById(lineId)
                    .orElse(null);

            if (line == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "error", "Line not found: " + lineId));
            }

            LineStatus oldStatus = line.getStatus();
            line.setStatus(newStatus);
            invoiceLineRepository.save(line);

            log.info("Line {} status changed from {} to {}", lineId, oldStatus, newStatus);

            // Update invoice work status based on all line statuses
            Invoice invoice = line.getInvoice();
            WorkStatus oldWorkStatus = invoice.getWorkStatus();

            // Fetch all lines and calculate work status without replacing the collection
            List<InvoiceLine> allLines = invoiceLineRepository.findByInvoiceId(invoice.getId());
            WorkStatus newWorkStatus = calculateWorkStatus(allLines);

            // Only update if status changed
            if (oldWorkStatus != newWorkStatus) {
                invoice.setWorkStatus(newWorkStatus);
                invoiceRepository.save(invoice);
            }
            log.info("Invoice {} work status changed from {} to {}", invoice.getId(), oldWorkStatus, newWorkStatus);

            // Send WebSocket notification for line status change
            try {
                webSocketService.notifyLineStatusChange(
                        invoice.getId(),
                        lineId,
                        oldStatus != null ? oldStatus.name() : "PENDING",
                        newStatus.name()
                );
            } catch (Exception e) {
                log.warn("Failed to send WebSocket notification for line status change: {}", e.getMessage());
            }

            // Send WebSocket notification for invoice work status change
            if (oldWorkStatus != newWorkStatus) {
                try {
                    webSocketService.notifyInvoiceWorkStatusChange(
                            invoice.getId(),
                            oldWorkStatus != null ? oldWorkStatus.name() : "PENDING",
                            newWorkStatus.name()
                    );
                } catch (Exception e) {
                    log.warn("Failed to send WebSocket notification for invoice work status change: {}", e.getMessage());
                }
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "lineId", lineId,
                    "oldStatus", oldStatus != null ? oldStatus.name() : "PENDING",
                    "newStatus", newStatus.name(),
                    "invoiceWorkStatus", newWorkStatus.name(),
                    "message", "تم تحديث حالة البند بنجاح"
            ));

        } catch (Exception e) {
            log.error("Error updating line status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Error: " + e.getMessage()));
        }
    }

    /**
     * Calculate work status based on line statuses
     */
    private WorkStatus calculateWorkStatus(List<InvoiceLine> lines) {
        if (lines == null || lines.isEmpty()) {
            return WorkStatus.PENDING;
        }

        boolean allCompleted = true;
        boolean anyInProgress = false;
        boolean anyCompleted = false;

        for (InvoiceLine line : lines) {
            LineStatus lineStatus = line.getStatus();
            if (lineStatus == null) {
                lineStatus = LineStatus.PENDING;
            }

            if (lineStatus == LineStatus.COMPLETED) {
                anyCompleted = true;
            } else if (lineStatus == LineStatus.IN_PROGRESS) {
                anyInProgress = true;
                allCompleted = false;
            } else if (lineStatus == LineStatus.PENDING) {
                allCompleted = false;
            }
        }

        if (allCompleted && (anyCompleted || !lines.isEmpty())) {
            return WorkStatus.COMPLETED;
        } else if (anyInProgress || anyCompleted) {
            return WorkStatus.IN_PROGRESS;
        } else {
            return WorkStatus.PENDING;
        }
    }
}