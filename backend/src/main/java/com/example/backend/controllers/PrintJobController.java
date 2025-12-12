package com.example.backend.controllers;

import com.example.backend.dto.PrintJobDTO;
import com.example.backend.dto.PrintJobStatusDTO;
import com.example.backend.exceptions.invoice.InvoiceNotFoundException;
import com.example.backend.exceptions.printjob.PrintJobCreationException;
import com.example.backend.exceptions.printjob.PrintJobException;
import com.example.backend.models.Invoice;
import com.example.backend.models.PrintJob;
import com.example.backend.models.enums.PrintType;
import com.example.backend.repositories.InvoiceRepository;
import com.example.backend.services.PrintJobService;
import com.example.backend.services.StorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for managing print jobs
 * Allows on-demand creation of print jobs after invoice creation
 * PDFs are generated and stored in MinIO/S3
 */
@RestController
@RequestMapping("/api/v1/print-jobs")
@Slf4j
@CrossOrigin(origins = "*")
public class PrintJobController {

    private final PrintJobService printJobService;
    private final InvoiceRepository invoiceRepository;
    private final StorageService storageService;

    @Autowired
    public PrintJobController(PrintJobService printJobService, InvoiceRepository invoiceRepository,
            StorageService storageService) {
        this.printJobService = printJobService;
        this.invoiceRepository = invoiceRepository;
        this.storageService = storageService;
    }

    /**
     * Helper to resolve PDF URL (Presigned for S3, Direct for MinIO/Public)
     */
    private String resolveUrl(String path) {
        if (path == null || path.trim().isEmpty()) {
            return null;
        }
        // If it's already a full URL, return as is
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        // Otherwise treat as object key and get public/presigned URL
        return storageService.getPublicUrl(path);
    }

    /**
     * Create all print jobs (CLIENT, OWNER, STICKER) for an invoice on-demand
     * POST /api/v1/print-jobs/invoice/{invoiceId}
     *
     * @param invoiceId Invoice ID to create print jobs for
     * @return Response with status of created print jobs
     */
    @PostMapping("/invoice/{invoiceId}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> createPrintJobsForInvoice(@PathVariable Long invoiceId) {
        try {
            log.info("REST API: Creating print jobs for invoice {}", invoiceId);

            // Reload invoice with full details (lines, glass types, customer)
            Invoice invoice = invoiceRepository.findByIdWithDetails(invoiceId)
                    .orElseThrow(() -> new InvoiceNotFoundException("الفاتورة غير موجودة: " + invoiceId));

            // Create all print jobs (CLIENT, OWNER, STICKER)
            printJobService.createPrintJobs(invoice);

            // Get status after creation
            PrintJobStatusDTO status = printJobService.getPrintJobStatus(invoiceId);

            // Resolve URLs in status jobs
            if (status.getJobs() != null) {
                status.getJobs().forEach(job -> job.setPdfPath(resolveUrl(job.getPdfPath())));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "تم إنشاء مهام الطباعة بنجاح");
            response.put("invoiceId", invoiceId);
            response.put("status", status);

            log.info("Print jobs created successfully for invoice {}: {} successful, {} failed",
                    invoiceId, status.getSuccessfulJobs(), status.getFailedJobs());

            return ResponseEntity.ok(response);

        } catch (InvoiceNotFoundException e) {
            log.error("Invoice not found: {}", invoiceId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()));
        } catch (PrintJobCreationException e) {
            log.error("Print job creation failed for invoice {}: {}", invoiceId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating print jobs for invoice {}: {}",
                    invoiceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", "خطأ غير متوقع: " + e.getMessage()));
        }
    }

    /**
     * Create a single print job (CLIENT, OWNER, or STICKER)
     * POST /api/v1/print-jobs/invoice/{invoiceId}/{printType}
     *
     * @param invoiceId Invoice ID
     * @param printType Print type (CLIENT, OWNER, STICKER)
     * @return Created print job with PDF URL
     */
    @PostMapping("/invoice/{invoiceId}/{printType}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> createSinglePrintJob(
            @PathVariable Long invoiceId,
            @PathVariable PrintType printType) {
        try {
            log.info("REST API: Creating {} print job for invoice {}", printType, invoiceId);

            // Reload invoice with full details
            Invoice invoice = invoiceRepository.findByIdWithDetails(invoiceId)
                    .orElseThrow(() -> new InvoiceNotFoundException("الفاتورة غير موجودة: " + invoiceId));

            // Create single print job
            PrintJob printJob = printJobService.createSinglePrintJobByType(invoice, printType);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("تم إنشاء مهمة طباعة %s بنجاح", printType.getArabicName()));
            response.put("printJob", Map.of(
                    "id", printJob.getId(),
                    "type", printJob.getType(),
                    "status", printJob.getStatus(),
                    "pdfPath", resolveUrl(printJob.getPdfPath()),
                    "createdAt", printJob.getCreatedAt()));

            log.info("{} print job created successfully for invoice {}: PDF at {}",
                    printType, invoiceId, printJob.getPdfPath());

            return ResponseEntity.ok(response);

        } catch (InvoiceNotFoundException e) {
            log.error("Invoice not found: {}", invoiceId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()));
        } catch (PrintJobCreationException e) {
            log.error("Error creating {} print job for invoice {}: {}",
                    printType, invoiceId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating {} print job for invoice {}: {}",
                    printType, invoiceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", "خطأ غير متوقع: " + e.getMessage()));
        }
    }

    /**
     * Get print job status for an invoice
     * GET /api/v1/print-jobs/invoice/{invoiceId}/status
     *
     * @param invoiceId Invoice ID
     * @return Status of all print jobs for the invoice
     */
    @GetMapping("/invoice/{invoiceId}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'WORKER')")
    public ResponseEntity<PrintJobStatusDTO> getPrintJobStatus(@PathVariable Long invoiceId) {
        try {
            log.debug("REST API: Getting print job status for invoice {}", invoiceId);

            PrintJobStatusDTO status = printJobService.getPrintJobStatus(invoiceId);

            // Resolve URLs
            if (status.getJobs() != null) {
                status.getJobs().forEach(job -> job.setPdfPath(resolveUrl(job.getPdfPath())));
            }

            log.debug("Print job status retrieved for invoice {}: {} total jobs",
                    invoiceId, status.getTotalJobs());

            return ResponseEntity.ok(status);

        } catch (InvoiceNotFoundException e) {
            log.error("Invoice not found: {}", invoiceId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error getting print job status for invoice {}: {}",
                    invoiceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Retry a failed print job
     * POST /api/v1/print-jobs/invoice/{invoiceId}/retry/{printType}
     *
     * @param invoiceId Invoice ID
     * @param printType Print type to retry
     * @return Newly created print job
     */
    @PostMapping("/invoice/{invoiceId}/retry/{printType}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> retryPrintJob(
            @PathVariable Long invoiceId,
            @PathVariable PrintType printType) {
        try {
            log.info("REST API: Retrying {} print job for invoice {}", printType, invoiceId);

            PrintJob printJob = printJobService.retryPrintJob(invoiceId, printType);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("تمت إعادة محاولة طباعة %s بنجاح", printType.getArabicName()));
            response.put("printJob", Map.of(
                    "id", printJob.getId(),
                    "type", printJob.getType(),
                    "status", printJob.getStatus(),
                    "pdfPath", resolveUrl(printJob.getPdfPath()),
                    "createdAt", printJob.getCreatedAt()));

            log.info("Print job retry successful for invoice {}, type {}: new job ID {}",
                    invoiceId, printType, printJob.getId());

            return ResponseEntity.ok(response);

        } catch (InvoiceNotFoundException e) {
            log.error("Invoice not found during retry: {}", invoiceId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()));
        } catch (PrintJobException e) {
            log.error("Error retrying print job for invoice {} with type {}: {}",
                    invoiceId, printType, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error retrying print job: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", "خطأ غير متوقع: " + e.getMessage()));
        }
    }

    /**
     * Get all queued print jobs
     * GET /api/v1/print-jobs/queue
     *
     * @return List of queued print jobs as DTOs
     */
    @GetMapping("/queue")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'WORKER')")
    public ResponseEntity<List<PrintJobDTO>> getQueuedJobs() {
        try {
            log.debug("REST API: Getting queued print jobs");

            List<PrintJob> queuedJobs = printJobService.getQueuedJobs();

            // Convert to DTOs to avoid lazy loading issues
            List<PrintJobDTO> queuedJobDTOs = queuedJobs.stream()
                    .map(PrintJobDTO::fromEntity)
                    .peek(dto -> dto.setPdfPath(resolveUrl(dto.getPdfPath())))
                    .toList();

            log.debug("Found {} queued print jobs", queuedJobDTOs.size());

            return ResponseEntity.ok(queuedJobDTOs);

        } catch (PrintJobException e) {
            log.error("Error getting queued jobs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            log.error("Unexpected error getting queued jobs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Mark print job as printing
     * PUT /api/v1/print-jobs/{jobId}/printing
     *
     * @param jobId Print job ID
     * @return Updated print job as DTO
     */
    @PutMapping("/{jobId}/printing")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'WORKER')")
    public ResponseEntity<PrintJobDTO> markAsPrinting(@PathVariable Long jobId) {
        try {
            log.info("REST API: Marking print job {} as PRINTING", jobId);

            PrintJob printJob = printJobService.markAsPrinting(jobId);
            PrintJobDTO dto = PrintJobDTO.fromEntity(printJob);
            dto.setPdfPath(resolveUrl(dto.getPdfPath()));

            return ResponseEntity.ok(dto);

        } catch (PrintJobException e) {
            log.error("Error marking job {} as printing: {}", jobId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Unexpected error marking job as printing: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Mark print job as printed
     * PUT /api/v1/print-jobs/{jobId}/printed
     *
     * @param jobId Print job ID
     * @return Updated print job as DTO
     */
    @PutMapping("/{jobId}/printed")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'WORKER')")
    public ResponseEntity<PrintJobDTO> markAsPrinted(@PathVariable Long jobId) {
        try {
            log.info("REST API: Marking print job {} as PRINTED", jobId);

            PrintJob printJob = printJobService.markAsPrinted(jobId);
            PrintJobDTO dto = PrintJobDTO.fromEntity(printJob);
            dto.setPdfPath(resolveUrl(dto.getPdfPath()));

            return ResponseEntity.ok(dto);

        } catch (PrintJobException e) {
            log.error("Error marking job {} as printed: {}", jobId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Unexpected error marking job as printed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Mark print job as failed
     * PUT /api/v1/print-jobs/{jobId}/failed
     *
     * @param jobId Print job ID
     * @param body  Request body with error message
     * @return Updated print job as DTO
     */
    @PutMapping("/{jobId}/failed")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'WORKER')")
    public ResponseEntity<PrintJobDTO> markAsFailed(
            @PathVariable Long jobId,
            @RequestBody Map<String, String> body) {
        try {
            String errorMessage = body.getOrDefault("errorMessage", "Unknown error");

            log.warn("REST API: Marking print job {} as FAILED: {}", jobId, errorMessage);

            PrintJob printJob = printJobService.markAsFailed(jobId, errorMessage);
            PrintJobDTO dto = PrintJobDTO.fromEntity(printJob);
            dto.setPdfPath(resolveUrl(dto.getPdfPath()));

            return ResponseEntity.ok(dto);

        } catch (PrintJobException e) {
            log.error("Error marking job {} as failed: {}", jobId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Unexpected error marking job as failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get print job by ID
     * GET /api/v1/print-jobs/{jobId}
     *
     * @param jobId Print job ID
     * @return Print job details as DTO
     */
    @GetMapping("/{jobId}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'WORKER')")
    public ResponseEntity<PrintJobDTO> getPrintJobById(@PathVariable Long jobId) {
        try {
            log.debug("REST API: Getting print job {}", jobId);

            return printJobService.findById(jobId)
                    .map(PrintJobDTO::fromEntity)
                    .map(dto -> {
                        dto.setPdfPath(resolveUrl(dto.getPdfPath()));
                        return dto;
                    })
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> {
                        log.warn("Print job {} not found", jobId);
                        return ResponseEntity.notFound().build();
                    });

        } catch (Exception e) {
            log.error("Error getting print job {}: {}", jobId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all print jobs for an invoice
     * GET /api/v1/print-jobs/invoice/{invoiceId}
     *
     * @param invoiceId Invoice ID
     * @return List of print jobs for the invoice as DTOs
     */
    @GetMapping("/invoice/{invoiceId}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'WORKER')")
    public ResponseEntity<List<PrintJobDTO>> getPrintJobsByInvoice(@PathVariable Long invoiceId) {
        try {
            log.debug("REST API: Getting print jobs for invoice {}", invoiceId);

            List<PrintJob> printJobs = printJobService.findByInvoiceId(invoiceId);
            List<PrintJobDTO> printJobDTOs = printJobs.stream()
                    .map(PrintJobDTO::fromEntity)
                    .peek(dto -> dto.setPdfPath(resolveUrl(dto.getPdfPath())))
                    .toList();

            log.debug("Found {} print jobs for invoice {}", printJobDTOs.size(), invoiceId);

            return ResponseEntity.ok(printJobDTOs);

        } catch (Exception e) {
            log.error("Error getting print jobs for invoice {}: {}",
                    invoiceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all failed print jobs
     * GET /api/v1/print-jobs/failed
     *
     * @return List of failed print jobs as DTOs
     */
    @GetMapping("/failed")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<List<PrintJobDTO>> getFailedJobs() {
        try {
            log.debug("REST API: Getting failed print jobs");

            List<PrintJob> failedJobs = printJobService.findFailedJobs();
            List<PrintJobDTO> failedJobDTOs = failedJobs.stream()
                    .map(PrintJobDTO::fromEntity)
                    .peek(dto -> dto.setPdfPath(resolveUrl(dto.getPdfPath())))
                    .toList();

            log.debug("Found {} failed print jobs", failedJobDTOs.size());

            return ResponseEntity.ok(failedJobDTOs);

        } catch (Exception e) {
            log.error("Error getting failed jobs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a print job
     * DELETE /api/v1/print-jobs/{jobId}
     *
     * @param jobId Print job ID
     * @return Success response
     */
    @DeleteMapping("/{jobId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, Object>> deletePrintJob(@PathVariable Long jobId) {
        try {
            log.info("REST API: Deleting print job {}", jobId);

            PrintJob printJob = printJobService.findById(jobId)
                    .orElseThrow(() -> new PrintJobException("Print job not found: " + jobId));

            printJobService.deletePrintJob(jobId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "تم حذف مهمة الطباعة بنجاح",
                    "jobId", jobId));

        } catch (PrintJobException e) {
            log.error("Error deleting print job {}: {}", jobId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error deleting print job {}: {}", jobId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", "خطأ غير متوقع: " + e.getMessage()));
        }
    }
}