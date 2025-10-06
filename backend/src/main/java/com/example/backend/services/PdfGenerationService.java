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

            // Generate PDF content in memory
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            // Small sticker size (10cm x 5cm)
            Rectangle stickerSize = new Rectangle(283, 142); // 10cm x 5cm at 72 DPI
            Document document = new Document(stickerSize, 10, 10, 10, 10);
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            document.open();

            BaseFont arabicFont = getArabicFont();
            Font titleFont = new Font(arabicFont, 14, Font.BOLD);
            Font normalFont = new Font(arabicFont, 10, Font.NORMAL);
            Font smallFont = new Font(arabicFont, 8, Font.NORMAL);

            writer.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

            // Company name
            Paragraph company = new Paragraph("مجموعة الجندي للزجاج", titleFont);
            company.setAlignment(Element.ALIGN_CENTER);
            document.add(company);

            // Invoice number
            Paragraph invoiceNum = new Paragraph("فاتورة #" + invoice.getId(), normalFont);
            invoiceNum.setAlignment(Element.ALIGN_CENTER);
            document.add(invoiceNum);

            // Customer name
            Paragraph customer = new Paragraph(invoice.getCustomer().getName(), normalFont);
            customer.setAlignment(Element.ALIGN_CENTER);
            document.add(customer);

            // Date
            Paragraph date = new Paragraph(
                invoice.getIssueDate().format(DateTimeFormatter.ofPattern("yyyy/MM/dd")), smallFont);
            date.setAlignment(Element.ALIGN_CENTER);
            document.add(date);

            // Total amount
            Paragraph total = new Paragraph(
                String.format("%.2f ج.م", invoice.getTotalPrice()), normalFont);
            total.setAlignment(Element.ALIGN_CENTER);
            document.add(total);

            document.close();

            // Store PDF in MinIO/S3
            String fileName = String.format("sticker_%d.pdf", invoice.getId());
            String publicUrl = storageService.storePdf(baos.toByteArray(), fileName, "stickers");
            
            log.info("Sticker PDF generated and stored successfully: {}", publicUrl);
            return publicUrl;

        } catch (Exception e) {
            log.error("Error generating sticker PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating sticker PDF: " + e.getMessage(), e);
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
}
