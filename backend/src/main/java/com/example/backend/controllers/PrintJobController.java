package com.example.backend.controllers;

import com.example.backend.dto.PrintJobDTO;
import com.example.backend.exceptions.printjob.PrintJobException;
import com.example.backend.models.PrintJob;
import com.example.backend.services.PrintJobService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
     * Helper method to create consistent error responses
     */
    private Map<String, Object> createErrorResponse(String message, String details) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", message);
        error.put("details", details);
        error.put("timestamp", System.currentTimeMillis());
        return error;
    }
}