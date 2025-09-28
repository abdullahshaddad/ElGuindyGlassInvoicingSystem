package com.example.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

/**
 * Configuration for print job settings
 */
@Configuration
@ConfigurationProperties(prefix = "app.print-jobs")
@Data
public class PrintJobConfig {

    /**
     * Maximum retry attempts for failed print jobs
     */
    private int maxRetryAttempts = 3;

    /**
     * Delay between retry attempts (in seconds)
     */
    private int retryDelaySeconds = 30;

    /**
     * Whether to fail invoice creation if all print jobs fail
     */
    private boolean failInvoiceOnAllPrintJobFailures = false;

    /**
     * Whether to send notifications for partial failures
     */
    private boolean notifyOnPartialFailures = true;

    /**
     * PDF generation timeout (in seconds)
     */
    private int pdfGenerationTimeoutSeconds = 60;

    /**
     * Directory for storing PDF files
     */
    private String pdfStorageDirectory = "/app/pdfs";

    /**
     * Maximum file size for generated PDFs (in MB)
     */
    private int maxPdfSizeMB = 10;

    /**
     * Whether to cleanup old PDF files
     */
    private boolean cleanupOldPdfs = true;

    /**
     * Days to keep PDF files before cleanup
     */
    private int pdfRetentionDays = 30;
}

