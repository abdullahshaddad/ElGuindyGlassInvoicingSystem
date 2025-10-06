package com.example.backend.monitoring;

import com.example.backend.config.PrintJobConfig;
import com.example.backend.models.PrintJobStatus;
import com.example.backend.services.PrintJobService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// Scheduled task for monitoring and cleanup
@Component
public class PrintJobMonitor {

    private static final Logger log = LoggerFactory.getLogger(PrintJobMonitor.class);

    @Autowired
    private PrintJobService printJobService;

    @Autowired
    private PrintJobConfig config;

    /**
     * Monitor for missing print jobs and retry them
     */
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void monitorMissingPrintJobs() {
        try {
            log.debug("Running print job monitoring...");

            // Find invoices created in the last hour that might have missing print jobs
            LocalDateTime cutoff = LocalDateTime.now().minusHours(1);
            List<Long> recentInvoiceIds = findRecentInvoiceIds(cutoff);

            for (Long invoiceId : recentInvoiceIds) {
                try {
                    PrintJobStatus status = printJobService.checkPrintJobStatus(invoiceId);

                    if (!status.isAllJobsComplete() && status.getMissingJobTypes() != null) {
                        log.info("Found invoice {} with missing print jobs: {}",
                                invoiceId, status.getMissingJobTypes());

                        // Retry missing jobs
                        printJobService.retryFailedPrintJobs(invoiceId);
                    }
                } catch (Exception e) {
                    log.error("Error checking print job status for invoice {}: {}",
                            invoiceId, e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Error in print job monitoring: {}", e.getMessage());
        }
    }

    /**
     * Cleanup old PDF files
     */
    @Scheduled(cron = "0 2 * * * *") // Daily at 2 AM
    public void cleanupOldPdfs() {
        if (!config.isCleanupOldPdfs()) {
            return;
        }

        try {
            log.info("Starting PDF cleanup process...");

            LocalDateTime cutoff = LocalDateTime.now().minusDays(config.getPdfRetentionDays());

            // Implementation to find and delete old PDF files
            // This would query the database for old print jobs and delete their PDF files

            log.info("PDF cleanup completed");

        } catch (Exception e) {
            log.error("Error during PDF cleanup: {}", e.getMessage());
        }
    }

    private List<Long> findRecentInvoiceIds(LocalDateTime cutoff) {
        // Implementation to find recent invoice IDs
        // This would query the invoice repository
        return new ArrayList<>();
    }
}