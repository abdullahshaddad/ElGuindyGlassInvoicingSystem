package com.example.backend.controllers;

import com.example.backend.dto.PrintJobDTO;
import com.example.backend.dto.PrintJobStatusDTO;
import com.example.backend.exceptions.invoice.InvoiceNotFoundException;
import com.example.backend.exceptions.printjob.PrintJobCreationException;
import com.example.backend.exceptions.printjob.PrintJobException;
import com.example.backend.models.PrintJob;
import com.example.backend.models.enums.PrintType;
import com.example.backend.services.PrintJobService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/print-jobs")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('WORKER') or hasRole('OWNER')")
public class PrintJobController {

    private final PrintJobService printJobService;

    @Autowired
    public PrintJobController(PrintJobService printJobService) {
        this.printJobService = printJobService;
    }

    /**
     * Get all queued print jobs
     * @return List of queued print jobs as DTOs
     */
    @GetMapping("/queue")
    public ResponseEntity<?> getQueuedJobs() {
        try {
            log.debug("API: Fetching queued print jobs");

            List<PrintJob> jobs = printJobService.getQueuedJobs();

            // Convert to DTOs to avoid Hibernate serialization issues
            List<PrintJobDTO> jobDTOs = jobs.stream()
                    .map(PrintJobDTO::fromEntity)
                    .collect(Collectors.toList());

            log.info("API: Returning {} queued print jobs", jobDTOs.size());
            return ResponseEntity.ok(jobDTOs);

        } catch (PrintJobException e) {
            log.error("API: Print job service error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("فشل في تحميل قائمة الطباعة", e.getMessage()));

        } catch (Exception e) {
            log.error("API: Unexpected error fetching queued jobs: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("خطأ غير متوقع", "حدث خطأ أثناء تحميل قائمة الطباعة"));
        }
    }

    /**
     * Mark print job as printing
     * @param id Print job ID
     * @return Updated print job
     */
    @PutMapping("/{id}/printing")
    public ResponseEntity<?> markAsPrinting(@PathVariable Long id) {
        try {
            log.debug("API: Marking print job {} as PRINTING", id);

            PrintJob job = printJobService.markAsPrinting(id);
            PrintJobDTO jobDTO = PrintJobDTO.fromEntity(job);

            log.info("API: Print job {} marked as PRINTING", id);
            return ResponseEntity.ok(jobDTO);

        } catch (IllegalArgumentException e) {
            log.warn("API: Invalid print job ID: {}", id);
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("مهمة الطباعة غير موجودة", "لم يتم العثور على المهمة رقم " + id));

        } catch (IllegalStateException e) {
            log.warn("API: Invalid state transition for job {}: {}", id, e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("حالة غير صالحة", e.getMessage()));

        } catch (Exception e) {
            log.error("API: Error marking job {} as printing: {}", id, e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("فشل في تحديث الحالة", "حدث خطأ أثناء بدء الطباعة"));
        }
    }

    /**
     * Mark print job as printed
     * @param id Print job ID
     * @return Updated print job
     */
    @PutMapping("/{id}/printed")
    public ResponseEntity<?> markAsPrinted(@PathVariable Long id) {
        try {
            log.debug("API: Marking print job {} as PRINTED", id);

            PrintJob job = printJobService.markAsPrinted(id);
            PrintJobDTO jobDTO = PrintJobDTO.fromEntity(job);

            log.info("API: Print job {} marked as PRINTED", id);
            return ResponseEntity.ok(jobDTO);

        } catch (IllegalArgumentException e) {
            log.warn("API: Invalid print job ID: {}", id);
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("مهمة الطباعة غير موجودة", "لم يتم العثور على المهمة رقم " + id));

        } catch (IllegalStateException e) {
            log.warn("API: Invalid state transition for job {}: {}", id, e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("حالة غير صالحة", e.getMessage()));

        } catch (Exception e) {
            log.error("API: Error marking job {} as printed: {}", id, e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("فشل في تحديث الحالة", "حدث خطأ أثناء تسجيل الطباعة"));
        }
    }

    /**
     * Mark print job as failed
     * @param id Print job ID
     * @param errorMessage Error message from request body
     * @return Updated print job
     */
    @PutMapping("/{id}/failed")
    public ResponseEntity<?> markAsFailed(
            @PathVariable Long id,
            @RequestBody String errorMessage) {
        try {
            log.debug("API: Marking print job {} as FAILED with reason: {}", id, errorMessage);

            if (errorMessage == null || errorMessage.trim().isEmpty()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("سبب مطلوب", "يجب تحديد سبب فشل الطباعة"));
            }

            PrintJob job = printJobService.markAsFailed(id, errorMessage.trim());
            PrintJobDTO jobDTO = PrintJobDTO.fromEntity(job);

            log.info("API: Print job {} marked as FAILED", id);
            return ResponseEntity.ok(jobDTO);

        } catch (IllegalArgumentException e) {
            log.warn("API: Invalid print job ID: {}", id);
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("مهمة الطباعة غير موجودة", "لم يتم العثور على المهمة رقم " + id));

        } catch (IllegalStateException e) {
            log.warn("API: Invalid state transition for job {}: {}", id, e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("حالة غير صالحة", e.getMessage()));

        } catch (Exception e) {
            log.error("API: Error marking job {} as failed: {}", id, e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("فشل في تحديث الحالة", "حدث خطأ أثناء تسجيل الفشل"));
        }
    }

    /**
     * الحصول على حالة مهام الطباعة لفاتورة معينة
     * GET /api/v1/print-jobs/invoice/{invoiceId}/status
     */
    @GetMapping("/invoice/{invoiceId}/status")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<?> getPrintJobStatus(@PathVariable Long invoiceId) {
        try {
            log.debug("API: Fetching print job status for invoice {}", invoiceId);

            PrintJobStatusDTO status = printJobService.getPrintJobStatus(invoiceId);

            log.info("API: Returning print job status for invoice {}: {} successful jobs, {} failed jobs",
                    invoiceId, status.getSuccessfulJobs(), status.getFailedJobs());

            return ResponseEntity.ok(status);

        } catch (InvoiceNotFoundException e) {
            log.error("API: Invoice not found: {}", invoiceId);
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("الفاتورة غير موجودة", e.getMessage()));

        } catch (PrintJobException e) {
            log.error("API: Print job service error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("فشل في تحميل حالة مهام الطباعة", e.getMessage()));

        } catch (Exception e) {
            log.error("API: Unexpected error fetching print job status: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("خطأ غير متوقع", "حدث خطأ أثناء تحميل حالة مهام الطباعة"));
        }
    }

    /**
     * إعادة محاولة إنشاء مهمة طباعة فاشلة
     * POST /api/v1/print-jobs/invoice/{invoiceId}/retry/{printType}
     */
    @PostMapping("/invoice/{invoiceId}/retry/{printType}")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<?> retryPrintJob(
            @PathVariable Long invoiceId,
            @PathVariable PrintType printType) {
        try {
            log.debug("API: Retrying print job for invoice {} with type {}", invoiceId, printType);

            PrintJob newJob = printJobService.retryPrintJob(invoiceId, printType);
            PrintJobDTO jobDTO = PrintJobDTO.fromEntity(newJob);

            log.info("API: Print job retry successful for invoice {} with type {}: new job ID {}",
                    invoiceId, printType, newJob.getId());

            return ResponseEntity.ok(jobDTO);

        } catch (InvoiceNotFoundException e) {
            log.error("API: Invoice not found: {}", invoiceId);
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("الفاتورة غير موجودة", e.getMessage()));

        } catch (PrintJobCreationException e) {
            log.error("API: Print job creation failed: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("فشل في إعادة محاولة الطباعة", e.getMessage()));

        } catch (PrintJobException e) {
            log.error("API: Print job service error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("فشل في إعادة محاولة الطباعة", e.getMessage()));

        } catch (Exception e) {
            log.error("API: Unexpected error retrying print job: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("خطأ غير متوقع", "حدث خطأ أثناء إعادة محاولة الطباعة"));
        }
    }

    /**
     * دالة مساعدة لإنشاء استجابة خطأ موحدة
     */
    private Map<String, Object> createErrorResponse(String message, String details) {
        Map<String, Object> error = new HashMap<>();
        error.put("message", message);
        error.put("details", details);
        error.put("timestamp", LocalDateTime.now().toString());
        return error;

    }
}