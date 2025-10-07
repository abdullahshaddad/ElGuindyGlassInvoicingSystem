// ====== PDF GENERATION SERVICE ======
package com.example.backend.services;

import com.example.backend.models.Invoice;
import com.example.backend.models.InvoiceLine;
import com.example.backend.models.enums.PrintType;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.draw.LineSeparator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@Slf4j
public class PdfGenerationService {

    @Value("${app.pdf.output.path:/tmp/pdfs}")
    private String pdfOutputPath;

    @Value("${app.assets.path:/app/assets}")
    private String assetsPath;

    @Autowired
    private StorageService storageService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm");

    public String generateInvoicePdf(Invoice invoice, PrintType printType) {
        try {
            log.info("Generating PDF for invoice {} with type {}", invoice.getId(), printType);

            // Generate PDF content in memory
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4);
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            document.open();

            // Add Arabic font support
            BaseFont arabicFont = getArabicFont();
            Font titleFont = new Font(arabicFont, 18, Font.BOLD);
            Font headerFont = new Font(arabicFont, 14, Font.BOLD);
            Font normalFont = new Font(arabicFont, 12, Font.NORMAL);
            Font boldFont = new Font(arabicFont, 12, Font.BOLD);
            Font smallFont = new Font(arabicFont, 10, Font.NORMAL);

            // Set document to RTL
            writer.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

            // Company Header
            addCompanyHeader(document, titleFont, normalFont);

            // Invoice Info
            addInvoiceInfo(document, invoice, headerFont, normalFont, boldFont);

            // Customer Info
            addCustomerInfo(document, invoice, headerFont, normalFont);

            // Invoice Lines Table
            addInvoiceLinesTable(document, invoice, boldFont, normalFont);

            // Totals
            addTotals(document, invoice, titleFont, normalFont);

            // Footer based on print type
            addFooter(document, printType, normalFont);

            document.close();

            // Store PDF in MinIO/S3
            String fileName = String.format("invoice_%d_%s.pdf",
                invoice.getId(), printType.name().toLowerCase());
            
            String publicUrl = storageService.storePdf(baos.toByteArray(), fileName, "invoices");
            
            log.info("PDF generated and stored successfully: {}", publicUrl);
            return publicUrl;

        } catch (Exception e) {
            log.error("Error generating invoice PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating invoice PDF: " + e.getMessage(), e);
        }
    }

    public String generateStickerPdf(Invoice invoice) {
        try {
            log.info("Generating sticker PDF for invoice {}", invoice.getId());

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A5);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);
            document.open();

            BaseFont arabicFont = getArabicFont();
            Font titleFont = new Font(arabicFont, 16, Font.BOLD);
            Font headerFont = new Font(arabicFont, 13, Font.BOLD);
            Font normalFont = new Font(arabicFont, 11, Font.NORMAL);
            Font boldFont = new Font(arabicFont, 11, Font.BOLD);

            // Build the new sticker layout
            buildStickerPdf(document, invoice, titleFont, headerFont, normalFont, boldFont);

            document.close();

            String fileName = String.format("sticker_%d.pdf", invoice.getId());
            String publicUrl = storageService.storePdf(baos.toByteArray(), fileName, "stickers");

            log.info("Sticker PDF generated successfully: {}", publicUrl);
            return publicUrl;

        } catch (Exception e) {
            log.error("Error generating sticker PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating sticker PDF", e);
        }
    }

    private BaseFont getArabicFont() throws DocumentException, IOException {
        String fontPath = Paths.get(assetsPath, "fonts", "NotoSansArabic-Regular.ttf").toString();
        try {
            return BaseFont.createFont(fontPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
        } catch (Exception e) {
            // Fallback to default font if Arabic font not found
            return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
        }
    }

    private void addCompanyHeader(Document document, Font titleFont, Font normalFont) throws DocumentException {
        // Company logo and header
        Paragraph header = new Paragraph("مجموعة الجندي للزجاج", titleFont);
        header.setAlignment(Element.ALIGN_CENTER);
        header.setSpacingAfter(10);
        document.add(header);

        Paragraph subHeader = new Paragraph("نظام إدارة الفواتير", normalFont);
        subHeader.setAlignment(Element.ALIGN_CENTER);
        subHeader.setSpacingAfter(20);
        document.add(subHeader);

        // Add a line separator
        LineSeparator line = new LineSeparator();
        document.add(line);
        document.add(new Paragraph(" ")); // Space
    }

    private void addInvoiceInfo(Document document, Invoice invoice, Font headerFont, Font normalFont, Font boldFont) throws DocumentException {
        Paragraph invoiceTitle = new Paragraph("فاتورة", headerFont);
        invoiceTitle.setAlignment(Element.ALIGN_CENTER);
        invoiceTitle.setSpacingAfter(15);
        document.add(invoiceTitle);

        PdfPTable invoiceInfoTable = new PdfPTable(2);
        invoiceInfoTable.setWidthPercentage(100);
        invoiceInfoTable.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        PdfPCell cell1 = new PdfPCell(new Phrase("رقم الفاتورة: " + invoice.getId(), boldFont));
        cell1.setBorder(Rectangle.NO_BORDER);
        invoiceInfoTable.addCell(cell1);

        PdfPCell cell2 = new PdfPCell(new Phrase("التاريخ: " +
            invoice.getIssueDate().format(DATE_FORMATTER), normalFont));
        cell2.setBorder(Rectangle.NO_BORDER);
        invoiceInfoTable.addCell(cell2);

        PdfPCell cell3 = new PdfPCell(new Phrase("الحالة: " + invoice.getStatus().getArabicName(), normalFont));
        cell3.setBorder(Rectangle.NO_BORDER);
        invoiceInfoTable.addCell(cell3);

        if (invoice.getPaymentDate() != null) {
            PdfPCell cell4 = new PdfPCell(new Phrase("تاريخ الدفع: " +
                invoice.getPaymentDate().format(DATE_FORMATTER), normalFont));
            cell4.setBorder(Rectangle.NO_BORDER);
            invoiceInfoTable.addCell(cell4);
        } else {
            PdfPCell cell4 = new PdfPCell(new Phrase("", normalFont));
            cell4.setBorder(Rectangle.NO_BORDER);
            invoiceInfoTable.addCell(cell4);
        }

        document.add(invoiceInfoTable);
        document.add(new Paragraph(" ")); // Space
    }

    private void addCustomerInfo(Document document, Invoice invoice, Font headerFont, Font normalFont) throws DocumentException {
        Paragraph customerTitle = new Paragraph("بيانات العميل", headerFont);
        customerTitle.setSpacingAfter(10);
        document.add(customerTitle);

        PdfPTable customerTable = new PdfPTable(1);
        customerTable.setWidthPercentage(100);
        customerTable.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        PdfPCell nameCell = new PdfPCell(new Phrase("الاسم: " + invoice.getCustomer().getName(), normalFont));
        nameCell.setBorder(Rectangle.BOTTOM);
        nameCell.setPadding(5);
        customerTable.addCell(nameCell);

        if (invoice.getCustomer().getPhone() != null) {
            PdfPCell phoneCell = new PdfPCell(new Phrase("الهاتف: " + invoice.getCustomer().getPhone(), normalFont));
            phoneCell.setBorder(Rectangle.BOTTOM);
            phoneCell.setPadding(5);
            customerTable.addCell(phoneCell);
        }

        if (invoice.getCustomer().getAddress() != null) {
            PdfPCell addressCell = new PdfPCell(new Phrase("العنوان: " + invoice.getCustomer().getAddress(), normalFont));
            addressCell.setBorder(Rectangle.BOTTOM);
            addressCell.setPadding(5);
            customerTable.addCell(addressCell);
        }

        document.add(customerTable);
        document.add(new Paragraph(" ")); // Space
    }

    private void addInvoiceLinesTable(Document document, Invoice invoice, Font boldFont, Font normalFont) throws DocumentException {
        Paragraph itemsTitle = new Paragraph("الأصناف", boldFont);
        itemsTitle.setSpacingAfter(10);
        document.add(itemsTitle);

        PdfPTable itemsTable = new PdfPTable(8);
        itemsTable.setWidthPercentage(100);
        itemsTable.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        // Set column widths
        float[] columnWidths = {1f, 1.5f, 0.8f, 0.8f, 0.8f, 1f, 1f, 1.2f};
        itemsTable.setWidths(columnWidths);

        // Headers
        String[] headers = {"م", "نوع الزجاج", "العرض", "الارتفاع", "المساحة م²", "نوع القص", "سعر القص", "الإجمالي"};
        for (String header : headers) {
            PdfPCell headerCell = new PdfPCell(new Phrase(header, boldFont));
            headerCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
            headerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            headerCell.setPadding(5);
            itemsTable.addCell(headerCell);
        }

        // Add invoice lines
        int lineNumber = 1;
        double totalGlassPrice = 0;
        double totalCuttingPrice = 0;

        for (InvoiceLine line : invoice.getInvoiceLines()) {
            double glassPrice = line.getAreaM2() * line.getGlassType().getPricePerMeter();
            totalGlassPrice += glassPrice;
            totalCuttingPrice += line.getCuttingPrice();

            itemsTable.addCell(new PdfPCell(new Phrase(String.valueOf(lineNumber++), normalFont)));

            String glassInfo = String.format("%s - %s - %.1fمم",
                line.getGlassType().getName(),
                line.getGlassType().getColor() != null ? line.getGlassType().getColor() : "",
                line.getGlassType().getThickness());
            itemsTable.addCell(new PdfPCell(new Phrase(glassInfo, normalFont)));

            itemsTable.addCell(new PdfPCell(new Phrase(String.format("%.2f", line.getWidth()), normalFont)));
            itemsTable.addCell(new PdfPCell(new Phrase(String.format("%.2f", line.getHeight()), normalFont)));
            itemsTable.addCell(new PdfPCell(new Phrase(String.format("%.2f", line.getAreaM2()), normalFont)));
            itemsTable.addCell(new PdfPCell(new Phrase(line.getCuttingType().getArabicName(), normalFont)));
            itemsTable.addCell(new PdfPCell(new Phrase(String.format("%.2f", line.getCuttingPrice()), normalFont)));
            itemsTable.addCell(new PdfPCell(new Phrase(String.format("%.2f", line.getLineTotal()), normalFont)));
        }

        // Add totals row
        PdfPCell totalLabelCell = new PdfPCell(new Phrase("الإجمالي", boldFont));
        totalLabelCell.setColspan(6);
        totalLabelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalLabelCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        itemsTable.addCell(totalLabelCell);

        PdfPCell totalCuttingCell = new PdfPCell(new Phrase(String.format("%.2f", totalCuttingPrice), boldFont));
        totalCuttingCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        itemsTable.addCell(totalCuttingCell);

        PdfPCell grandTotalCell = new PdfPCell(new Phrase(String.format("%.2f", invoice.getTotalPrice()), boldFont));
        grandTotalCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        itemsTable.addCell(grandTotalCell);

        document.add(itemsTable);
        document.add(new Paragraph(" ")); // Space
    }

    private void addTotals(Document document, Invoice invoice, Font titleFont, Font normalFont) throws DocumentException {
        // Total section
        PdfPTable totalTable = new PdfPTable(2);
        totalTable.setWidthPercentage(60);
        totalTable.setHorizontalAlignment(Element.ALIGN_LEFT);
        totalTable.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        PdfPCell totalLabelCell = new PdfPCell(new Phrase("إجمالي الفاتورة:", titleFont));
        totalLabelCell.setBorder(Rectangle.NO_BORDER);
        totalLabelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalTable.addCell(totalLabelCell);

        PdfPCell totalValueCell = new PdfPCell(new Phrase(
            String.format("%.2f جنيه مصري", invoice.getTotalPrice()), titleFont));
        totalValueCell.setBorder(Rectangle.NO_BORDER);
        totalValueCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        totalTable.addCell(totalValueCell);

        document.add(totalTable);
        document.add(new Paragraph(" ")); // Space
    }

    private void addFooter(Document document, PrintType printType, Font normalFont) throws DocumentException {
        document.add(new Paragraph(" "));

        String footerText = "";
        switch (printType) {
            case CLIENT:
                footerText = "نسخة العميل - شكراً لتعاملكم معنا\nالعنوان: القاهرة الجديدة - التجمع الخامس\nهاتف: 01234567890";
                break;
            case OWNER:
                footerText = "نسخة المالك - للمراجعة والأرشفة";
                break;
            case STICKER:
                footerText = "ملصق المصنع";
                break;
        }

        Paragraph footer = new Paragraph(footerText, normalFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        // Add generation timestamp
        Paragraph timestamp = new Paragraph(
            "تم إنشاء هذه النسخة في: " + java.time.LocalDateTime.now().format(DATE_FORMATTER),
            new Font(normalFont.getBaseFont(), 8, Font.ITALIC));
        timestamp.setAlignment(Element.ALIGN_CENTER);
        timestamp.setSpacingBefore(10);
        document.add(timestamp);
    }

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


}
