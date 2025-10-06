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
    public void createPrintJobs(Invoice invoice) {
        List<String> errors = new ArrayList<>();
        List<PrintJob> successfulJobs = new ArrayList<>();
        int totalJobs = 3; // CLIENT, OWNER, STICKER

        try {
            // إنشاء مهمة طباعة العميل (CLIENT)
            try {
                PrintJob clientJob = createSinglePrintJob(invoice, PrintType.CLIENT);
                successfulJobs.add(clientJob);
            } catch (Exception e) {
                errors.add("فشل في إنشاء مهمة طباعة العميل: " + e.getMessage());
            }

            // إنشاء مهمة طباعة المالك (OWNER)
            try {
                PrintJob ownerJob = createSinglePrintJob(invoice, PrintType.OWNER);
                successfulJobs.add(ownerJob);
            } catch (Exception e) {
                errors.add("فشل في إنشاء مهمة طباعة المالك: " + e.getMessage());
            }

            // إنشاء مهمة طباعة الملصق (STICKER)
            try {
                PrintJob stickerJob = createStickerPrintJob(invoice);
                successfulJobs.add(stickerJob);
            } catch (Exception e) {
                errors.add("فشل في إنشاء مهمة طباعة الملصق: " + e.getMessage());
            }

            // تقييم النتائج
            if (successfulJobs.isEmpty()) {
                // فشل كامل - جميع المهام فشلت
                String allErrors = String.join(", ", errors);
                throw new PrintJobCreationException("فشل في إنشاء جميع مهام الطباعة: " + allErrors);
            }

            if (!errors.isEmpty()) {
                // نجاح جزئي - بعض المهام فشلت
                log.warn("Partial success creating print jobs for invoice {}: {} successful, {} failed",
                        invoice.getId(), successfulJobs.size(), errors.size());
                notifyPrintJobPartialFailure(invoice.getId(), successfulJobs.size(), totalJobs, errors);
            }

            // إرسال إشعار بالمهام الناجحة
            String message = String.format("تم إنشاء %d من %d مهام طباعة", successfulJobs.size(), totalJobs);
            webSocketService.notifyPrintJobUpdate(invoice.getId(), message);

        } catch (PrintJobCreationException e) {
            throw e;
        } catch (Exception e) {
            throw new PrintJobCreationException("خطأ غير متوقع أثناء إنشاء مهام الطباعة: " + e.getMessage(), e);
        }
    } /**
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

    /**
     * Get all queued print jobs ordered by creation time
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

    /**
     * بناء PDF ملصق المصنع - نمط Dr. Greiche
     * يشبه الملصق في الصورة المرفقة
     */
    private void buildStickerPdf(Document document, Invoice invoice,
                                 Font titleFont, Font headerFont,
                                 Font normalFont, Font boldFont) throws DocumentException {

        // حجم صغير للملصق (A5 أو A6)
        document.setPageSize(PageSize.A5);
        document.setMargins(20, 20, 20, 20);

        // ===== رأس الشركة مع Logo =====
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{1, 3});
        headerTable.setSpacingAfter(10);

        // Logo placeholder (يمكن إضافة صورة لاحقاً)
        PdfPCell logoCell = new PdfPCell();
        logoCell.setBackgroundColor(new BaseColor(66, 133, 244)); // أزرق
        logoCell.setFixedHeight(50);
        logoCell.setBorder(Rectangle.BOX);
        logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        Paragraph logoText = new Paragraph("EG", new Font(boldFont.getBaseFont(), 20, Font.BOLD, BaseColor.WHITE));
        logoText.setAlignment(Element.ALIGN_CENTER);
        logoCell.addElement(logoText);
        headerTable.addCell(logoCell);

        // اسم الشركة
        PdfPCell companyCell = new PdfPCell();
        companyCell.setBorder(Rectangle.BOX);
        companyCell.setPadding(5);
        Paragraph companyName = new Paragraph("شركة الجندي للزجاج",
                new Font(boldFont.getBaseFont(), 16, Font.BOLD));
        companyName.setAlignment(Element.ALIGN_RIGHT);
        companyCell.addElement(companyName);
        Paragraph companySubtitle = new Paragraph("ELGUINDY GLASS",
                new Font(normalFont.getBaseFont(), 10, Font.NORMAL, BaseColor.GRAY));
        companySubtitle.setAlignment(Element.ALIGN_RIGHT);
        companyCell.addElement(companySubtitle);
        Paragraph companyDesc = new Paragraph("شركة دولية لصناعة الزجاج",
                new Font(normalFont.getBaseFont(), 8, Font.NORMAL, BaseColor.GRAY));
        companyDesc.setAlignment(Element.ALIGN_RIGHT);
        companyCell.addElement(companyDesc);
        headerTable.addCell(companyCell);

        document.add(headerTable);

        // خط فاصل
        document.add(new LineSeparator(1, 100, BaseColor.BLACK, Element.ALIGN_CENTER, -2));
        document.add(Chunk.NEWLINE);

        // ===== جدول المعلومات الرئيسي =====
        PdfPTable mainTable = new PdfPTable(2);
        mainTable.setWidthPercentage(100);
        mainTable.setWidths(new float[]{1, 2});
        mainTable.setSpacingAfter(10);

        Font labelFont = new Font(boldFont.getBaseFont(), 11, Font.BOLD);
        Font valueFont = new Font(normalFont.getBaseFont(), 11, Font.NORMAL);
        Font largeValueFont = new Font(boldFont.getBaseFont(), 14, Font.BOLD);

        // الحصول على أول بند من الفاتورة
        InvoiceLine firstLine = invoice.getInvoiceLines().get(0);
        String glassTypeName = firstLine.getGlassType().getName();

        // Product (نوع الزجاج)
        addStickerRow(mainTable, "المنتج", glassTypeName, labelFont, valueFont, true);

        // Thickness (السماكة)
        String thickness = String.format("%.0f مم", firstLine.getGlassType().getThickness());
        addStickerRow(mainTable, "السماكة", thickness, labelFont, largeValueFont, false);

        // Size (المقاس)
        String size = String.format("%.0f × %.0f %s",
                firstLine.getWidth(),
                firstLine.getHeight(),
                firstLine.getDimensionUnit());

        addStickerRow(mainTable, "المقاس", size, labelFont, largeValueFont, true);

        // Color (اللون) - من خصائص الزجاج
        String color = "شفاف"; // يمكن تعديله حسب نوع الزجاج
        PdfPCell colorLabelCell = new PdfPCell(new Phrase("اللون", labelFont));
        colorLabelCell.setBorder(Rectangle.BOX);
        colorLabelCell.setPadding(8);
        colorLabelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        mainTable.addCell(colorLabelCell);

        PdfPCell colorValueCell = new PdfPCell();
        colorValueCell.setBorder(Rectangle.BOX);
        colorValueCell.setPadding(8);

        // Checkbox style
        Chunk checkClear = new Chunk("☑ شفاف    ", valueFont);
        Chunk checkColored = new Chunk("☐ ملون", valueFont);
        Paragraph colorPara = new Paragraph();
        colorPara.add(checkClear);
        colorPara.add(checkColored);
        colorPara.setAlignment(Element.ALIGN_RIGHT);
        colorValueCell.addElement(colorPara);
        mainTable.addCell(colorValueCell);

        // Unit (الوحدة)
        addStickerRow(mainTable, "الوحدة", "لوح", labelFont, valueFont, false);

        // Quantity (الكمية)
        String quantity = String.valueOf(invoice.getInvoiceLines().size());
        addStickerRow(mainTable, "الكمية", quantity, labelFont, largeValueFont, true);

        // Packing Date (تاريخ التعبئة)
        String packingDate = invoice.getIssueDate().format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        addStickerRow(mainTable, "تاريخ التعبئة", packingDate, labelFont, valueFont, false);

        // Customer (العميل)
        PdfPCell customerLabelCell = new PdfPCell(new Phrase("العميل", labelFont));
        customerLabelCell.setBorder(Rectangle.BOX);
        customerLabelCell.setPadding(8);
        customerLabelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        mainTable.addCell(customerLabelCell);

        PdfPCell customerValueCell = new PdfPCell();
        customerValueCell.setBorder(Rectangle.BOX);
        customerValueCell.setPadding(8);

        Chunk checkLocal = new Chunk("☑ محلي    ", valueFont);
        Chunk checkExport = new Chunk("☐ تصدير", valueFont);
        Paragraph customerPara = new Paragraph();
        customerPara.add(checkLocal);
        customerPara.add(checkExport);
        customerPara.setAlignment(Element.ALIGN_RIGHT);
        customerValueCell.addElement(customerPara);
        mainTable.addCell(customerValueCell);

        // QC (مراقبة الجودة)
        PdfPCell qcLabelCell = new PdfPCell(new Phrase("مراقبة الجودة", labelFont));
        qcLabelCell.setBorder(Rectangle.BOX);
        qcLabelCell.setPadding(8);
        qcLabelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        mainTable.addCell(qcLabelCell);

        PdfPCell qcValueCell = new PdfPCell(new Phrase("OK ✓",
                new Font(boldFont.getBaseFont(), 12, Font.BOLD, new BaseColor(76, 175, 80))));
        qcValueCell.setBorder(Rectangle.BOX);
        qcValueCell.setPadding(8);
        qcValueCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        qcValueCell.setBackgroundColor(new BaseColor(232, 245, 233));
        mainTable.addCell(qcValueCell);

        document.add(mainTable);

        // ===== معلومات إضافية في الأسفل =====
        document.add(new LineSeparator(1, 100, BaseColor.LIGHT_GRAY, Element.ALIGN_CENTER, -2));
        document.add(Chunk.NEWLINE);

        // اسم العميل
        Paragraph customerName = new Paragraph(
                "العميل: " + invoice.getCustomer().getName(),
                new Font(boldFont.getBaseFont(), 10, Font.BOLD));
        customerName.setAlignment(Element.ALIGN_RIGHT);
        document.add(customerName);

        // رقم الفاتورة
        Paragraph invoiceNum = new Paragraph(
                "رقم الفاتورة: #" + invoice.getId(),
                new Font(normalFont.getBaseFont(), 9, Font.NORMAL, BaseColor.GRAY));
        invoiceNum.setAlignment(Element.ALIGN_RIGHT);
        invoiceNum.setSpacingAfter(5);
        document.add(invoiceNum);

        // ملاحظات إن وجدت
        if (invoice.getNotes() != null && !invoice.getNotes().trim().isEmpty()) {
            Paragraph notes = new Paragraph(
                    "ملاحظات: " + invoice.getNotes(),
                    new Font(normalFont.getBaseFont(), 8, Font.ITALIC));
            notes.setAlignment(Element.ALIGN_RIGHT);
            notes.setSpacingAfter(10);
            document.add(notes);
        }

        // ===== Footer =====
        PdfPTable footerTable = new PdfPTable(2);
        footerTable.setWidthPercentage(100);
        footerTable.setWidths(new float[]{1, 1});

        // Contact info
        PdfPCell contactCell = new PdfPCell();
        contactCell.setBorder(Rectangle.NO_BORDER);
        Paragraph hotline = new Paragraph("الخط الساخن: 19864",
                new Font(normalFont.getBaseFont(), 7, Font.NORMAL));
        hotline.setAlignment(Element.ALIGN_LEFT);
        contactCell.addElement(hotline);
        Paragraph website = new Paragraph("www.elguindyglass.com",
                new Font(normalFont.getBaseFont(), 7, Font.NORMAL, BaseColor.BLUE));
        website.setAlignment(Element.ALIGN_LEFT);
        contactCell.addElement(website);
        Paragraph email = new Paragraph("info@elguindyglass.com",
                new Font(normalFont.getBaseFont(), 7, Font.NORMAL));
        email.setAlignment(Element.ALIGN_LEFT);
        contactCell.addElement(email);
        footerTable.addCell(contactCell);

        // Document number and version
        PdfPCell docCell = new PdfPCell();
        docCell.setBorder(Rectangle.NO_BORDER);
        Paragraph docNum = new Paragraph("GMF-70950-09",
                new Font(normalFont.getBaseFont(), 7, Font.NORMAL));
        docNum.setAlignment(Element.ALIGN_RIGHT);
        docCell.addElement(docNum);
        Paragraph version = new Paragraph(
                "VER 3 " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                new Font(normalFont.getBaseFont(), 7, Font.NORMAL));
        version.setAlignment(Element.ALIGN_RIGHT);
        docCell.addElement(version);
        footerTable.addCell(docCell);

        document.add(footerTable);
    }

    /**
     * دالة مساعدة لإضافة صف في جدول الملصق
     */
    private void addStickerRow(PdfPTable table, String label, String value,
                               Font labelFont, Font valueFont, boolean highlightValue) {
        // Label cell
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.BOX);
        labelCell.setPadding(8);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        labelCell.setBackgroundColor(new BaseColor(245, 245, 245));
        table.addCell(labelCell);

        // Value cell
        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorder(Rectangle.BOX);
        valueCell.setPadding(8);
        valueCell.setHorizontalAlignment(Element.ALIGN_CENTER);

        if (highlightValue) {
            valueCell.setBackgroundColor(new BaseColor(255, 253, 231)); // أصفر فاتح
        }

        table.addCell(valueCell);
    }


    // أضف هذه الدوال في PrintJobService.java

    /**
     * الحصول على حالة مهام الطباعة لفاتورة معينة
     */
    public PrintJobStatusDTO getPrintJobStatus(Long invoiceId) {
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
    public PrintJob retryPrintJob(Long invoiceId, PrintType printType) {
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
}