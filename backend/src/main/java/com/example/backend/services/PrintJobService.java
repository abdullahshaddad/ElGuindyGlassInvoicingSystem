package com.example.backend.services;

import com.example.backend.dto.PrintJobStatusDTO;
import com.example.backend.exceptions.invoice.InvoiceNotFoundException;
import com.example.backend.exceptions.printjob.PdfGenerationException;
import com.example.backend.exceptions.printjob.PrintJobCreationException;
import com.example.backend.exceptions.printjob.PrintJobDatabaseException;
import com.example.backend.exceptions.printjob.PrintJobException;
import com.example.backend.models.Invoice;
import com.example.backend.models.InvoiceLine;
import com.example.backend.models.PrintJob;
import com.example.backend.models.PrintJobStatus;
import com.example.backend.models.enums.PrintStatus;
import com.example.backend.models.enums.PrintType;
import com.example.backend.repositories.InvoiceRepository;
import com.example.backend.repositories.PrintJobRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.draw.LineSeparator;
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
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
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
    public void createPrintJobs(Invoice invoiceParam) {
        List<String> errors = new ArrayList<>();
        List<PrintJob> successfulJobs = new ArrayList<>();
        int totalJobs = 3; // CLIENT, OWNER, STICKER

        try {
            // Reload invoice with all associations to ensure data is available
            log.debug("Reloading invoice {} with all details for print job creation", invoiceParam.getId());
            Invoice invoice = invoiceRepository.findByIdWithDetails(invoiceParam.getId())
                    .orElseThrow(() -> new InvoiceNotFoundException(
                            "الفاتورة غير موجودة: " + invoiceParam.getId()));

            // Verify invoice lines are loaded
            if (invoice.getInvoiceLines() == null || invoice.getInvoiceLines().isEmpty()) {
                log.error("Invoice {} has no invoice lines", invoice.getId());
                throw new PrintJobCreationException(
                        "لا يمكن إنشاء مهام الطباعة: الفاتورة لا تحتوي على بنود");
            }

            log.info("Creating print jobs for invoice {} with {} lines",
                    invoice.getId(), invoice.getInvoiceLines().size());

            // Create CLIENT print job
            try {
                PrintJob clientJob = createSinglePrintJob(invoice, PrintType.CLIENT);
                successfulJobs.add(clientJob);
                log.debug("CLIENT print job created: {}", clientJob.getPdfPath());
            } catch (Exception e) {
                String error = "فشل في إنشاء مهمة طباعة العميل: " + e.getMessage();
                errors.add(error);
                log.error("CLIENT print job failed: {}", e.getMessage(), e);
            }

            // Create OWNER print job
            try {
                PrintJob ownerJob = createSinglePrintJob(invoice, PrintType.OWNER);
                successfulJobs.add(ownerJob);
                log.debug("OWNER print job created: {}", ownerJob.getPdfPath());
            } catch (Exception e) {
                String error = "فشل في إنشاء مهمة طباعة المالك: " + e.getMessage();
                errors.add(error);
                log.error("OWNER print job failed: {}", e.getMessage(), e);
            }

            // Create STICKER print job
            try {
                PrintJob stickerJob = createStickerPrintJob(invoice);
                successfulJobs.add(stickerJob);
                log.debug("STICKER print job created: {}", stickerJob.getPdfPath());
            } catch (Exception e) {
                String error = "فشل في إنشاء مهمة طباعة الملصق: " + e.getMessage();
                errors.add(error);
                log.error("STICKER print job failed: {}", e.getMessage(), e);
            }

            // Evaluate results
            if (successfulJobs.isEmpty()) {
                String allErrors = String.join(", ", errors);
                log.error("All print jobs failed for invoice {}: {}", invoice.getId(), allErrors);
                throw new PrintJobCreationException("فشل في إنشاء جميع مهام الطباعة: " + allErrors);
            }

            if (!errors.isEmpty()) {
                log.warn("Partial success: {} of {} print jobs created for invoice {}",
                        successfulJobs.size(), totalJobs, invoice.getId());
                notifyPrintJobPartialFailure(invoice.getId(), successfulJobs.size(), totalJobs, errors);
            } else {
                log.info("All {} print jobs created successfully for invoice {}",
                        totalJobs, invoice.getId());
            }

            // Send WebSocket notification
            try {
                String message = String.format("تم إنشاء %d من %d مهام طباعة",
                        successfulJobs.size(), totalJobs);
                webSocketService.notifyPrintJobUpdate(invoice.getId(), message);
            } catch (Exception e) {
                log.warn("Failed to send WebSocket notification: {}", e.getMessage());
            }

        } catch (InvoiceNotFoundException e) {
            log.error("Invoice not found: {}", e.getMessage());
            throw new PrintJobCreationException("الفاتورة غير موجودة", e);
        } catch (PrintJobCreationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error creating print jobs: {}", e.getMessage(), e);
            throw new PrintJobCreationException(
                    "خطأ غير متوقع أثناء إنشاء مهام الطباعة: " + e.getMessage(), e);
        }
    }

    /**
     * Create a single print job (CLIENT or OWNER type)
     */
    /**
     * Create a single print job by type - exposed for controller use
     *
     * @param invoice   Invoice with loaded lines
     * @param printType Type of print job to create
     * @return Created PrintJob with MinIO URL
     */
    public PrintJob createSinglePrintJobByType(Invoice invoice, PrintType printType) {
        PrintJob printJob;
        if (printType == PrintType.STICKER) {
            printJob = createStickerPrintJob(invoice);
            // Notify factory when STICKER is created (send to factory)
            try {
                webSocketService.notifyNewInvoice(invoice);
                log.info("Factory notification sent for sticker creation, invoice {}", invoice.getId());
            } catch (Exception e) {
                log.warn("Failed to send factory notification for sticker: {}", e.getMessage());
            }
        } else {
            printJob = createSinglePrintJob(invoice, printType);
        }
        return printJob;
    }

    /**
     * Create a single print job (CLIENT or OWNER type)
     * PDFs are generated on-demand when requested, not stored.
     */
    private PrintJob createSinglePrintJob(Invoice invoice, PrintType printType) {
        try {
            log.debug("Creating {} print job for invoice {}", printType, invoice.getId());

            // Verify invoice lines
            if (invoice.getInvoiceLines() == null || invoice.getInvoiceLines().isEmpty()) {
                throw new PrintJobCreationException("Invoice has no lines");
            }

            // Create print job entity - PDFs are generated on-demand
            PrintJob printJob = new PrintJob(invoice, printType);
            // Set a reference path for tracking (PDF generated on-demand)
            printJob.setPdfPath(String.format("invoice_%s_%s", invoice.getId(), printType.name().toLowerCase()));

            // Save to database
            try {
                PrintJob savedJob = printJobRepository.save(printJob);
                log.info("{} print job created for invoice {}: {}",
                        printType, invoice.getId(), savedJob.getId());
                return savedJob;
            } catch (DataAccessException e) {
                log.error("Database error saving {} print job: {}", printType, e.getMessage());
                throw new PrintJobDatabaseException(
                        "فشل في حفظ مهمة الطباعة: " + e.getMessage(), e);
            }

        } catch (PrintJobCreationException | PrintJobDatabaseException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error creating {} print job: {}", printType, e.getMessage(), e);
            throw new PrintJobCreationException(
                    "خطأ غير متوقع في إنشاء مهمة طباعة " + printType, e);
        }
    }

    /**
     * Create sticker print job (special handling)
     * PDFs are generated on-demand when requested.
     */
    private PrintJob createStickerPrintJob(Invoice invoice) {
        try {
            log.debug("Creating STICKER print job for invoice {}", invoice.getId());

            PrintJob stickerJob = new PrintJob(invoice, PrintType.STICKER);
            // Set a reference path for tracking (PDF generated on-demand)
            stickerJob.setPdfPath(String.format("sticker_%s", invoice.getId()));

            // Save to database
            try {
                PrintJob savedJob = printJobRepository.save(stickerJob);
                log.debug("Sticker print job saved to database (ID: {})", savedJob.getId());

                // NOTIFY FACTORY (WebSocket)
                try {
                    String message = "تم إرسال أمر جديد للمصنع (فاتورة " + invoice.getId() + ")";
                    webSocketService.notifyPrintJobUpdate(invoice.getId(), message);
                } catch (Exception e) {
                    log.warn("Failed to send WebSocket notification for sticker job: {}", e.getMessage());
                }

                return savedJob;
            } catch (DataAccessException e) {
                log.error("Database error saving sticker print job: {}", e.getMessage());
                throw new PrintJobDatabaseException("فشل في حفظ مهمة طباعة الملصق: " + e.getMessage(), e);
            }

        } catch (PrintJobDatabaseException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error creating sticker print job: {}", e.getMessage(), e);
            throw new PrintJobCreationException("خطأ غير متوقع في إنشاء مهمة طباعة الملصق", e);
        }
    }

    /**
     * Handle partial failure notifications
     */
    private void notifyPrintJobPartialFailure(String invoiceId, int successCount, int totalCount, List<String> errors) {
        try {
            log.info("Notifying partial print job failure for invoice {}: {}/{} successful",
                    invoiceId, successCount, totalCount);

            // Could send email, create alert, etc.
            String message = String.format("تم إنشاء %d من %d مهام طباعة للفاتورة %s. الأخطاء: %s",
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
    public void retryFailedPrintJobs(String invoiceId) {
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
    public PrintJobStatus checkPrintJobStatus(String invoiceId) {
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

    /**
     * Get all queued print jobs ordered by creation time
     * 
     * @return List of queued print jobs, empty list if none found
     * @throws PrintJobException if database error occurs
     */
    public List<PrintJob> getQueuedJobs() {
        try {
            log.debug("Fetching queued print jobs with status: {}", PrintStatus.QUEUED);

            List<PrintJob> queuedJobs = printJobRepository.findQueuedJobsOrderedByCreation(PrintStatus.QUEUED);

            if (queuedJobs == null) {
                log.warn("Repository returned null for queued jobs, returning empty list");
                return new ArrayList<>();
            }

            log.info("Found {} queued print jobs", queuedJobs.size());
            return queuedJobs;

        } catch (DataAccessException e) {
            log.error("Database error while fetching queued print jobs: {}", e.getMessage(), e);
            throw new PrintJobException("فشل في تحميل قائمة المهام من قاعدة البيانات", e);
        } catch (Exception e) {
            log.error("Unexpected error while fetching queued print jobs: {}", e.getMessage(), e);
            throw new PrintJobException("خطأ غير متوقع في تحميل قائمة المهام", e);
        }
    }

    /**
     * Custom exception for print job operations
     */

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

    public List<PrintJob> findByInvoiceId(String invoiceId) {
        return printJobRepository.findByInvoiceId(invoiceId);
    }

    public Optional<PrintJob> findById(Long id) {
        return printJobRepository.findById(id);
    }

    public PrintJob createStickerPrintJob(String invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceId));

        PrintJob stickerJob = new PrintJob(invoice, PrintType.STICKER);
        stickerJob.setPdfPath(String.format("sticker_%s", invoiceId));
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

    // أضف هذه الدوال في PrintJobService.java

    /**
     * الحصول على حالة مهام الطباعة لفاتورة معينة
     */
    public PrintJobStatusDTO getPrintJobStatus(String invoiceId) {
        try {
            log.debug("Fetching print job status for invoice {}", invoiceId);

            Invoice invoice = invoiceRepository.findById(invoiceId)
                    .orElseThrow(() -> new InvoiceNotFoundException("الفاتورة غير موجودة: " + invoiceId));

            List<PrintJob> printJobs = printJobRepository.findByInvoiceId(invoiceId);

            log.debug("Found {} print jobs for invoice {}", printJobs.size(), invoiceId);

            PrintJobStatusDTO status = PrintJobStatusDTO.fromPrintJobs(invoiceId, printJobs);

            log.info("Print job status for invoice {}: {} successful, {} failed, {} missing",
                    invoiceId, status.getSuccessfulJobs(), status.getFailedJobs(),
                    status.getMissingJobTypes().size());

            return status;

        } catch (InvoiceNotFoundException e) {
            log.error("Invoice not found: {}", invoiceId);
            throw e;
        } catch (Exception e) {
            log.error("Error getting print job status for invoice {}: {}", invoiceId, e.getMessage(), e);
            throw new PrintJobException("فشل في الحصول على حالة مهام الطباعة: " + e.getMessage(), e);
        }
    }

    /**
     * إعادة محاولة إنشاء مهمة طباعة فاشلة
     */
    @Transactional(rollbackFor = Exception.class)
    public PrintJob retryPrintJob(String invoiceId, PrintType printType) {
        try {
            log.info("Retrying print job for invoice {} with type {}", invoiceId, printType);

            Invoice invoice = invoiceRepository.findById(invoiceId)
                    .orElseThrow(() -> new InvoiceNotFoundException("الفاتورة غير موجودة: " + invoiceId));

            List<PrintJob> existingJobs = printJobRepository.findByInvoiceId(invoiceId);
            existingJobs.stream()
                    .filter(job -> job.getType() == printType)
                    .peek(job -> log.debug("Deleting existing {} print job with status {}",
                            printType, job.getStatus()))
                    .forEach(printJobRepository::delete);

            PrintJob newJob;
            if (printType == PrintType.STICKER) {
                log.debug("Creating new STICKER print job");
                newJob = createStickerPrintJob(invoice);
            } else {
                log.debug("Creating new {} print job", printType);
                newJob = createSinglePrintJob(invoice, printType);
            }

            try {
                String message = String.format("تمت إعادة محاولة طباعة %s بنجاح", printType.getArabicName());
                webSocketService.notifyPrintJobUpdate(invoiceId, message);
            } catch (Exception e) {
                log.warn("Failed to send notification for retry: {}", e.getMessage());
            }

            log.info("Print job retry successful for invoice {} with type {}: new job ID {}",
                    invoiceId, printType, newJob.getId());

            return newJob;

        } catch (InvoiceNotFoundException e) {
            log.error("Invoice not found during retry: {}", invoiceId);
            throw e;
        } catch (PrintJobCreationException e) {
            log.error("Print job creation failed during retry: {}", e.getMessage());
            throw e;
        } catch (PdfGenerationException e) {
            log.error("PDF generation failed during retry for invoice {} with type {}: {}",
                    invoiceId, printType, e.getMessage(), e);
            throw new PrintJobCreationException("فشل في إنشاء ملف PDF: " + e.getMessage(), e);
        } catch (DataAccessException e) {
            log.error("Database error during retry for invoice {} with type {}: {}",
                    invoiceId, printType, e.getMessage(), e);
            throw new PrintJobException("خطأ في قاعدة البيانات أثناء إعادة المحاولة", e);
        } catch (Exception e) {
            log.error("Unexpected error during retry for invoice {} with type {}: {}",
                    invoiceId, printType, e.getMessage(), e);
            throw new PrintJobException("خطأ غير متوقع أثناء إعادة محاولة إنشاء مهمة الطباعة: " + e.getMessage(), e);
        }
    }

    public void deletePrintJob(Long jobId) {
        printJobRepository.deleteById(jobId);
        log.info("Print job {} deleted", jobId);
    }
}