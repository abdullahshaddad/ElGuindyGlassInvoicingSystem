package com.example.backend.controllers;

import com.example.backend.models.PrintJobStatus;
import com.example.backend.services.PrintJobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

// Print Job Management Controller
@RestController
@RequestMapping("/api/admin/print-jobs")
public class PrintJobManagementController {

    @Autowired
    private PrintJobService printJobService;

    /**
     * Retry failed print jobs for an invoice
     */
    @PostMapping("/retry/{invoiceId}")
    public ResponseEntity<String> retryPrintJobs(@PathVariable Long invoiceId) {
        try {
            printJobService.retryFailedPrintJobs(invoiceId);
            return ResponseEntity.ok("تم إعادة محاولة مهام الطباعة بنجاح");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("فشل في إعادة المحاولة: " + e.getMessage());
        }
    }

    /**
     * Check print job status for an invoice
     */
    @GetMapping("/status/{invoiceId}")
    public ResponseEntity<PrintJobStatus> checkStatus(@PathVariable Long invoiceId) {
        try {
            PrintJobStatus status = printJobService.checkPrintJobStatus(invoiceId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            PrintJobStatus errorStatus = PrintJobStatus.builder()
                    .invoiceId(invoiceId)
                    .error("خطأ في فحص الحالة: " + e.getMessage())
                    .build();
            return ResponseEntity.internalServerError().body(errorStatus);
        }
    }

    /**
     * Get all failed print jobs
     */
    @GetMapping("/failed")
    public ResponseEntity<List<PrintJobStatus>> getFailedJobs() {
        try {
            // Implementation to find invoices with missing print jobs
            List<PrintJobStatus> failedJobs = findInvoicesWithMissingPrintJobs();
            return ResponseEntity.ok(failedJobs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private List<PrintJobStatus> findInvoicesWithMissingPrintJobs() {
        // Implementation to find invoices that don't have all 3 print job types
        // This would query the database to find such cases
        return new ArrayList<>();
    }
}
