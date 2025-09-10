package com.example.backend.services;

import com.example.backend.models.Invoice;
import com.example.backend.models.PrintJob;
import com.example.backend.models.enums.PrintStatus;
import com.example.backend.models.enums.PrintType;
import com.example.backend.repositories.PrintJobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PrintJobService {

    private final PrintJobRepository printJobRepository;
    private final PdfGenerationService pdfGenerationService;
    private final WebSocketNotificationService webSocketService;

    @Autowired
    public PrintJobService(PrintJobRepository printJobRepository,
                           PdfGenerationService pdfGenerationService,
                           WebSocketNotificationService webSocketService) {
        this.printJobRepository = printJobRepository;
        this.pdfGenerationService = pdfGenerationService;
        this.webSocketService = webSocketService;
    }

    public void createPrintJobs(Invoice invoice) {
        try {
            // Create 3 print jobs: CLIENT, OWNER, STICKER
            PrintJob clientJob = new PrintJob(invoice, PrintType.CLIENT);
            PrintJob ownerJob = new PrintJob(invoice, PrintType.OWNER);
            PrintJob stickerJob = new PrintJob(invoice, PrintType.STICKER);

            // Generate PDFs for each job
            clientJob.setPdfPath(pdfGenerationService.generateInvoicePdf(invoice, PrintType.CLIENT));
            ownerJob.setPdfPath(pdfGenerationService.generateInvoicePdf(invoice, PrintType.OWNER));
            stickerJob.setPdfPath(pdfGenerationService.generateStickerPdf(invoice));

            printJobRepository.save(clientJob);
            printJobRepository.save(ownerJob);
            printJobRepository.save(stickerJob);

            // Notify print agent about new jobs
            webSocketService.notifyPrintJobUpdate(invoice.getId(), "NEW_JOBS_CREATED");

        } catch (Exception e) {
            throw new RuntimeException("Failed to create print jobs for invoice " + invoice.getId(), e);
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
        // This method is called when factory worker clicks "Print Sticker"
        // We need to fetch the actual invoice
        Optional<Invoice> invoiceOpt = printJobRepository.findById(invoiceId)
                .map(PrintJob::getInvoice);

        if (!invoiceOpt.isPresent()) {
            throw new RuntimeException("Invoice not found for sticker print: " + invoiceId);
        }

        Invoice invoice = invoiceOpt.get();

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
}