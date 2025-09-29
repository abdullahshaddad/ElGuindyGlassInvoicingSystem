package com.example.backend.services;

import com.example.backend.exceptions.printjob.PdfGenerationException;
import com.example.backend.exceptions.printjob.PrintJobCreationException;
import com.example.backend.exceptions.printjob.PrintJobDatabaseException;
import com.example.backend.models.Invoice;
import com.example.backend.models.PrintJob;
import com.example.backend.models.enums.PrintStatus;
import com.example.backend.models.enums.PrintType;
import com.example.backend.repositories.InvoiceRepository;
import com.example.backend.repositories.PrintJobRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class PrintJobService {

    private final PrintJobRepository printJobRepository;
    private final PdfGenerationService pdfGenerationService;
    private final WebSocketNotificationService webSocketService;
private final InvoiceRepository invoiceRepository;


    @Autowired
    public PrintJobService(PrintJobRepository printJobRepository,
                           PdfGenerationService pdfGenerationService,
                           WebSocketNotificationService webSocketService, InvoiceRepository invoiceRepository) {
        this.printJobRepository = printJobRepository;
        this.pdfGenerationService = pdfGenerationService;
        this.webSocketService = webSocketService;
        this.invoiceRepository = invoiceRepository;
    }

    /**
     * Create print jobs with comprehensive error handling
     * Continues with partial success if some jobs fail
     */
    @Transactional(rollbackFor = Exception.class)
    public void createPrintJobs(Invoice invoice) {
        if (invoice == null) {
            log.error("Cannot create print jobs: invoice is null");
            throw new IllegalArgumentException("Invoice cannot be null");
        }

        if (invoice.getId() == null) {
            log.error("Cannot create print jobs: invoice ID is null");
            throw new IllegalArgumentException("Invoice ID cannot be null");
        }

        log.info("Starting print job creation for invoice: {}", invoice.getId());

        List<String> errors = new ArrayList<>();
        List<PrintJob> successfulJobs = new ArrayList<>();
        int totalJobs = 3; // CLIENT, OWNER, STICKER

        try {
            // Create CLIENT print job
            try {
                PrintJob clientJob = createSinglePrintJob(invoice, PrintType.CLIENT);
                if (clientJob != null) {
                    successfulJobs.add(clientJob);
                    log.debug("CLIENT print job created successfully for invoice {}", invoice.getId());
                }
            } catch (Exception e) {
                String error = "فشل في إنشاء مهمة طباعة العميل: " + e.getMessage();
                errors.add(error);
                log.error("Failed to create CLIENT print job for invoice {}: {}", invoice.getId(), e.getMessage(), e);
            }

            // Create OWNER print job
            try {
                PrintJob ownerJob = createSinglePrintJob(invoice, PrintType.OWNER);
                if (ownerJob != null) {
                    successfulJobs.add(ownerJob);
                    log.debug("OWNER print job created successfully for invoice {}", invoice.getId());
                }
            } catch (Exception e) {
                String error = "فشل في إنشاء مهمة طباعة المالك: " + e.getMessage();
                errors.add(error);
                log.error("Failed to create OWNER print job for invoice {}: {}", invoice.getId(), e.getMessage(), e);
            }

            // Create STICKER print job (special handling for different PDF type)
            try {
                PrintJob stickerJob = createStickerPrintJob(invoice);
                if (stickerJob != null) {
                    successfulJobs.add(stickerJob);
                    log.debug("STICKER print job created successfully for invoice {}", invoice.getId());
                }
            } catch (Exception e) {
                String error = "فشل في إنشاء مهمة طباعة الملصق: " + e.getMessage();
                errors.add(error);
                log.error("Failed to create STICKER print job for invoice {}: {}", invoice.getId(), e.getMessage(), e);
            }

            // Evaluate results
            if (successfulJobs.isEmpty()) {
                // Complete failure - all jobs failed
                String allErrors = String.join(", ", errors);
                log.error("All print jobs failed for invoice {}: {}", invoice.getId(), allErrors);
                throw new PrintJobCreationException("فشل في إنشاء جميع مهام الطباعة: " + allErrors);
            }

            if (!errors.isEmpty()) {
                // Partial success - some jobs failed
                log.warn("Partial success creating print jobs for invoice {}: {} successful, {} failed",
                        invoice.getId(), successfulJobs.size(), errors.size());
                log.warn("Failed jobs errors: {}", String.join("; ", errors));
            }

            // Notify about successful jobs (non-critical)
            try {
                String message = String.format("تم إنشاء %d من %d مهام طباعة", successfulJobs.size(), totalJobs);
                webSocketService.notifyPrintJobUpdate(invoice.getId(), message);
                log.debug("Print job notification sent successfully for invoice {}", invoice.getId());
            } catch (Exception e) {
                log.warn("Failed to send print job notification for invoice {}: {}", invoice.getId(), e.getMessage());
                // Don't fail the whole operation for notification issues
            }

            // Send partial failure alerts if needed
            if (!errors.isEmpty()) {
                notifyPrintJobPartialFailure(invoice.getId(), successfulJobs.size(), totalJobs, errors);
            }

            log.info("Print job creation completed for invoice {}: {} successful jobs",
                    invoice.getId(), successfulJobs.size());

        } catch (PrintJobCreationException e) {
            // Re-throw our custom exceptions
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during print job creation for invoice {}: {}",
                    invoice.getId(), e.getMessage(), e);
            throw new PrintJobCreationException("خطأ غير متوقع أثناء إنشاء مهام الطباعة: " + e.getMessage(), e);
        }
    }
    /**
     * Create a single print job (CLIENT or OWNER type)
     */
    private PrintJob createSinglePrintJob(Invoice invoice, PrintType printType) {
        try {
            log.debug("Creating {} print job for invoice {}", printType, invoice.getId());

            // Create the print job entity
            PrintJob printJob = new PrintJob(invoice, printType);

            // Generate PDF
            String pdfPath;
            try {
                pdfPath = pdfGenerationService.generateInvoicePdf(invoice, printType);
                if (pdfPath == null || pdfPath.trim().isEmpty()) {
                    throw new PdfGenerationException("PDF path is null or empty for " + printType);
                }
                printJob.setPdfPath(pdfPath);
                log.debug("PDF generated successfully for {} job: {}", printType, pdfPath);
            } catch (Exception e) {
                log.error("PDF generation failed for {} job: {}", printType, e.getMessage());
                throw new PdfGenerationException("فشل في إنشاء ملف PDF لنوع " + printType + ": " + e.getMessage(), e);
            }

            // Save to database
            try {
                PrintJob savedJob = printJobRepository.save(printJob);
                log.debug("Print job saved to database: {} (ID: {})", printType, savedJob.getId());
                return savedJob;
            } catch (DataAccessException e) {
                log.error("Database error saving {} print job: {}", printType, e.getMessage());
                throw new PrintJobDatabaseException("فشل في حفظ مهمة الطباعة في قاعدة البيانات: " + e.getMessage(), e);
            }

        } catch (PrintJobCreationException | PdfGenerationException | PrintJobDatabaseException e) {
            // Re-throw our custom exceptions
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error creating {} print job: {}", printType, e.getMessage(), e);
            throw new PrintJobCreationException("خطأ غير متوقع في إنشاء مهمة طباعة " + printType, e);
        }
    }

    /**
     * Create sticker print job (special handling)
     */
    private PrintJob createStickerPrintJob(Invoice invoice) {
        try {
            log.debug("Creating STICKER print job for invoice {}", invoice.getId());

            PrintJob stickerJob = new PrintJob(invoice, PrintType.STICKER);

            // Generate sticker PDF (different method)
            String pdfPath;
            try {
                pdfPath = pdfGenerationService.generateStickerPdf(invoice);
                if (pdfPath == null || pdfPath.trim().isEmpty()) {
                    throw new PdfGenerationException("Sticker PDF path is null or empty");
                }
                stickerJob.setPdfPath(pdfPath);
                log.debug("Sticker PDF generated successfully: {}", pdfPath);
            } catch (Exception e) {
                log.error("Sticker PDF generation failed: {}", e.getMessage());
                throw new PdfGenerationException("فشل في إنشاء ملف PDF للملصق: " + e.getMessage(), e);
            }

            // Save to database
            try {
                PrintJob savedJob = printJobRepository.save(stickerJob);
                log.debug("Sticker print job saved to database (ID: {})", savedJob.getId());
                return savedJob;
            } catch (DataAccessException e) {
                log.error("Database error saving sticker print job: {}", e.getMessage());
                throw new PrintJobDatabaseException("فشل في حفظ مهمة طباعة الملصق: " + e.getMessage(), e);
            }

        } catch (PdfGenerationException | PrintJobDatabaseException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error creating sticker print job: {}", e.getMessage(), e);
            throw new PrintJobCreationException("خطأ غير متوقع في إنشاء مهمة طباعة الملصق", e);
        }
    }
    /**
     * Handle partial failure notifications
     */
    private void notifyPrintJobPartialFailure(Long invoiceId, int successCount, int totalCount, List<String> errors) {
        try {
            log.info("Notifying partial print job failure for invoice {}: {}/{} successful",
                    invoiceId, successCount, totalCount);

            // Could send email, create alert, etc.
            String message = String.format("تم إنشاء %d من %d مهام طباعة للفاتورة %d. الأخطاء: %s",
                    successCount, totalCount, invoiceId, String.join(", ", errors));

            // Example: emailService.notifyAdminPartialFailure(invoiceId, message);
            // Example: alertService.createPrintJobAlert(invoiceId, message);

            log.debug("Partial failure notification prepared for invoice {}", invoiceId);
        } catch (Exception e) {
            log.error("Failed to notify partial print job failure for invoice {}: {}", invoiceId, e.getMessage());
        }
    }

    /**
     * Retry failed print jobs
     */
    public void retryFailedPrintJobs(Long invoiceId) {
        try {
            log.info("Retrying failed print jobs for invoice {}", invoiceId);

            Optional<Invoice> invoiceOpt = invoiceRepository.findById(invoiceId);
            if (invoiceOpt.isEmpty()) {
                log.error("Cannot retry print jobs: invoice {} not found", invoiceId);
                return;
            }

            Invoice invoice = invoiceOpt.get();

            // Check which print job types are missing
            List<PrintJob> existingJobs = printJobRepository.findByInvoiceId(invoiceId);
            Set<PrintType> existingTypes = existingJobs.stream()
                    .map(PrintJob::getPrintType)
                    .collect(Collectors.toSet());

            List<PrintType> missingTypes = Arrays.stream(PrintType.values())
                    .filter(type -> !existingTypes.contains(type))
                    .collect(Collectors.toList());

            if (missingTypes.isEmpty()) {
                log.info("No missing print jobs found for invoice {}", invoiceId);
                return;
            }

            log.info("Retrying {} missing print job types for invoice {}: {}",
                    missingTypes.size(), invoiceId, missingTypes);

            // Retry missing jobs
            for (PrintType missingType : missingTypes) {
                try {
                    if (missingType == PrintType.STICKER) {
                        createStickerPrintJob(invoice);
                    } else {
                        createSinglePrintJob(invoice, missingType);
                    }
                    log.info("Successfully retried {} print job for invoice {}", missingType, invoiceId);
                } catch (Exception e) {
                    log.error("Retry failed for {} print job on invoice {}: {}",
                            missingType, invoiceId, e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Error during print job retry for invoice {}: {}", invoiceId, e.getMessage(), e);
        }
    }

    /**
     * Check print job status and health
     */
    public PrintJobStatus checkPrintJobStatus(Long invoiceId) {
        try {
            List<PrintJob> jobs = printJobRepository.findByInvoiceId(invoiceId);

            Set<PrintType> expectedTypes = Set.of(PrintType.CLIENT, PrintType.OWNER, PrintType.STICKER);
            Set<PrintType> existingTypes = jobs.stream()
                    .map(PrintJob::getPrintType)
                    .collect(Collectors.toSet());

            boolean allJobsExist = expectedTypes.equals(existingTypes);
            List<PrintType> missingTypes = expectedTypes.stream()
                    .filter(type -> !existingTypes.contains(type))
                    .collect(Collectors.toList());

            return PrintJobStatus.builder()
                    .invoiceId(invoiceId)
                    .totalJobs(jobs.size())
                    .expectedJobs(expectedTypes.size())
                    .allJobsComplete(allJobsExist)
                    .missingJobTypes(missingTypes)
                    .existingJobs(jobs)
                    .build();

        } catch (Exception e) {
            log.error("Error checking print job status for invoice {}: {}", invoiceId, e.getMessage());
            return PrintJobStatus.builder()
                    .invoiceId(invoiceId)
                    .error("خطأ في فحص حالة مهام الطباعة: " + e.getMessage())
                    .build();
        }
    }

    public List<PrintJob> getQueuedJobs() {
        return printJobRepository.findQueuedJobsOrderedByCreation(PrintStatus.QUEUED);
    }

    public PrintJob markAsPrinting(Long jobId) {
        PrintJob job = printJobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Print job not found: " + jobId));

        job.setStatus(PrintStatus.PRINTING);
        return printJobRepository.save(job);
    }

    public PrintJob markAsPrinted(Long jobId) {
        PrintJob job = printJobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Print job not found: " + jobId));

        job.setStatus(PrintStatus.PRINTED);
        job.setPrintedAt(LocalDateTime.now());

        PrintJob savedJob = printJobRepository.save(job);

        // Notify about successful print
        webSocketService.notifyPrintJobUpdate(job.getInvoice().getId(), "PRINTED");

        return savedJob;
    }

    public PrintJob markAsFailed(Long jobId, String errorMessage) {
        PrintJob job = printJobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Print job not found: " + jobId));

        job.setStatus(PrintStatus.FAILED);
        job.setErrorMessage(errorMessage);

        PrintJob savedJob = printJobRepository.save(job);

        // Notify about failed print
        webSocketService.notifyPrintJobUpdate(job.getInvoice().getId(), "FAILED");

        return savedJob;
    }

    public List<PrintJob> findByInvoiceId(Long invoiceId) {
        return printJobRepository.findByInvoiceId(invoiceId);
    }

    public Optional<PrintJob> findById(Long id) {
        return printJobRepository.findById(id);
    }

    public PrintJob createStickerPrintJob(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceId));

        PrintJob stickerJob = new PrintJob(invoice, PrintType.STICKER);
        stickerJob.setPdfPath(pdfGenerationService.generateStickerPdf(invoice));
        return printJobRepository.save(stickerJob);
    }
    public List<PrintJob> findFailedJobs() {
        return printJobRepository.findByStatus(PrintStatus.FAILED);
    }

    public void retryFailedJob(Long jobId) {
        PrintJob job = printJobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Print job not found: " + jobId));

        if (job.getStatus() != PrintStatus.FAILED) {
            throw new IllegalStateException("Job is not in failed state: " + jobId);
        }

        // Reset job status
        job.setStatus(PrintStatus.QUEUED);
        job.setErrorMessage(null);
        job.setPrintedAt(null);

        printJobRepository.save(job);

        // Notify print agent about retry
        webSocketService.notifyPrintJobUpdate(job.getInvoice().getId(), "RETRY_REQUESTED");
    }


    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrintJobStatus {
        private Long invoiceId;
        private int totalJobs;
        private int expectedJobs;
        private boolean allJobsComplete;
        private List<PrintType> missingJobTypes;
        private List<PrintJob> existingJobs;
        private String error;
    }
}