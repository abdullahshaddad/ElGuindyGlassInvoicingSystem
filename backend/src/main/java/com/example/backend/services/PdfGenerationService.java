// ====== FIXED PDF GENERATION SERVICE ======
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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

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
    private static final DateTimeFormatter DATE_FORMATTER_SHORT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public String generateInvoicePdf(Invoice invoice, PrintType printType) {
        try {
            log.info("Generating PDF for invoice {} with type {}", invoice.getId(), printType);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4);
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            document.open();

            BaseFont arabicFont = getArabicFont();
            Font titleFont = new Font(arabicFont, 18, Font.BOLD);
            Font headerFont = new Font(arabicFont, 14, Font.BOLD);
            Font normalFont = new Font(arabicFont, 12, Font.NORMAL);
            Font boldFont = new Font(arabicFont, 12, Font.BOLD);

            writer.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

            addCompanyHeader(document, titleFont, normalFont);
            addInvoiceInfo(document, invoice, headerFont, normalFont, boldFont);
            addCustomerInfo(document, invoice, headerFont, normalFont);
            addInvoiceLinesTable(document, invoice, boldFont, normalFont);
            addTotals(document, invoice, titleFont, normalFont);
            addFooter(document, printType, normalFont);

            document.close();

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
            Document document = new Document(PageSize.A5, 20, 20, 20, 20);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);
            document.open();

            BaseFont arabicFont = getArabicFont();
            Font titleFont = new Font(arabicFont, 16, Font.BOLD);
            Font headerFont = new Font(arabicFont, 13, Font.BOLD);
            Font normalFont = new Font(arabicFont, 11, Font.NORMAL);
            Font boldFont = new Font(arabicFont, 11, Font.BOLD);
            Font smallFont = new Font(arabicFont, 8, Font.NORMAL);

            buildStickerPdf(document, invoice, titleFont, headerFont, normalFont, boldFont, smallFont);

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
        String fontPath = java.nio.file.Paths.get(assetsPath, "fonts", "NotoSansArabic-Regular.ttf").toString();
        try {
            return BaseFont.createFont(fontPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
        } catch (Exception e) {
            log.warn("Arabic font not found, using fallback font");
            return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
        }
    }

    private void addCompanyHeader(Document document, Font titleFont, Font normalFont) throws DocumentException {
        Paragraph header = new Paragraph("ELGUINDY GLASS GROUP", titleFont);
        header.setAlignment(Element.ALIGN_CENTER);
        header.setSpacingAfter(10);
        document.add(header);

        Paragraph subHeader = new Paragraph("Invoice Management System", normalFont);
        subHeader.setAlignment(Element.ALIGN_CENTER);
        subHeader.setSpacingAfter(20);
        document.add(subHeader);

        LineSeparator line = new LineSeparator();
        document.add(line);
        document.add(new Paragraph(" "));
    }

    private void addInvoiceInfo(Document document, Invoice invoice, Font headerFont, Font normalFont, Font boldFont) throws DocumentException {
        Paragraph invoiceTitle = new Paragraph("INVOICE", headerFont);
        invoiceTitle.setAlignment(Element.ALIGN_CENTER);
        invoiceTitle.setSpacingAfter(15);
        document.add(invoiceTitle);

        PdfPTable invoiceInfoTable = new PdfPTable(2);
        invoiceInfoTable.setWidthPercentage(100);

        PdfPCell cell1 = new PdfPCell(new Phrase("Invoice Number: " + invoice.getId(), boldFont));
        cell1.setBorder(Rectangle.NO_BORDER);
        cell1.setHorizontalAlignment(Element.ALIGN_LEFT);
        invoiceInfoTable.addCell(cell1);

        PdfPCell cell2 = new PdfPCell(new Phrase("Date: " +
                invoice.getIssueDate().format(DATE_FORMATTER), normalFont));
        cell2.setBorder(Rectangle.NO_BORDER);
        cell2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        invoiceInfoTable.addCell(cell2);

        String statusText = "";
        switch (invoice.getStatus().name()) {
            case "PAID": statusText = "Paid"; break;
            case "PENDING": statusText = "Pending"; break;
            case "CANCELLED": statusText = "Cancelled"; break;
            default: statusText = invoice.getStatus().name();
        }

        PdfPCell cell3 = new PdfPCell(new Phrase("Status: " + statusText, normalFont));
        cell3.setBorder(Rectangle.NO_BORDER);
        cell3.setHorizontalAlignment(Element.ALIGN_LEFT);
        invoiceInfoTable.addCell(cell3);

        if (invoice.getPaymentDate() != null) {
            PdfPCell cell4 = new PdfPCell(new Phrase("Payment Date: " +
                    invoice.getPaymentDate().format(DATE_FORMATTER), normalFont));
            cell4.setBorder(Rectangle.NO_BORDER);
            cell4.setHorizontalAlignment(Element.ALIGN_RIGHT);
            invoiceInfoTable.addCell(cell4);
        } else {
            PdfPCell cell4 = new PdfPCell(new Phrase("", normalFont));
            cell4.setBorder(Rectangle.NO_BORDER);
            invoiceInfoTable.addCell(cell4);
        }

        document.add(invoiceInfoTable);
        document.add(new Paragraph(" "));
    }

    private void addCustomerInfo(Document document, Invoice invoice, Font headerFont, Font normalFont) throws DocumentException {
        Paragraph customerTitle = new Paragraph("Customer Information", headerFont);
        customerTitle.setSpacingAfter(10);
        document.add(customerTitle);

        PdfPTable customerTable = new PdfPTable(1);
        customerTable.setWidthPercentage(100);

        PdfPCell nameCell = new PdfPCell(new Phrase("Name: " + invoice.getCustomer().getName(), normalFont));
        nameCell.setBorder(Rectangle.BOTTOM);
        nameCell.setPadding(5);
        customerTable.addCell(nameCell);

        if (invoice.getCustomer().getPhone() != null) {
            PdfPCell phoneCell = new PdfPCell(new Phrase("Phone: " + invoice.getCustomer().getPhone(), normalFont));
            phoneCell.setBorder(Rectangle.BOTTOM);
            phoneCell.setPadding(5);
            customerTable.addCell(phoneCell);
        }

        if (invoice.getCustomer().getAddress() != null) {
            PdfPCell addressCell = new PdfPCell(new Phrase("Address: " + invoice.getCustomer().getAddress(), normalFont));
            addressCell.setBorder(Rectangle.BOTTOM);
            addressCell.setPadding(5);
            customerTable.addCell(addressCell);
        }

        document.add(customerTable);
        document.add(new Paragraph(" "));
    }

    private void addInvoiceLinesTable(Document document, Invoice invoice, Font boldFont, Font normalFont) throws DocumentException {
        Paragraph itemsTitle = new Paragraph("Items", boldFont);
        itemsTitle.setSpacingAfter(10);
        document.add(itemsTitle);

        PdfPTable itemsTable = new PdfPTable(8);
        itemsTable.setWidthPercentage(100);

        float[] columnWidths = {1f, 1.5f, 0.8f, 0.8f, 0.8f, 1f, 1f, 1.2f};
        itemsTable.setWidths(columnWidths);

        String[] headers = {"#", "Glass Type", "Width", "Height", "Area m²", "Cutting", "Cut Price", "Total"};
        for (String header : headers) {
            PdfPCell headerCell = new PdfPCell(new Phrase(header, boldFont));
            headerCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
            headerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            headerCell.setPadding(5);
            itemsTable.addCell(headerCell);
        }

        int lineNumber = 1;
        double totalCuttingPrice = 0;

        for (InvoiceLine line : invoice.getInvoiceLines()) {
            totalCuttingPrice += line.getCuttingPrice();

            // Line number
            PdfPCell numCell = new PdfPCell(new Phrase(String.valueOf(lineNumber++), normalFont));
            numCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            numCell.setPadding(5);
            itemsTable.addCell(numCell);

            // Glass info
            String glassInfo = String.format("%s - %s - %.1fmm",
                    line.getGlassType().getName(),
                    line.getGlassType().getColor() != null ? line.getGlassType().getColor() : "Clear",
                    line.getGlassType().getThickness());
            PdfPCell glassCell = new PdfPCell(new Phrase(glassInfo, normalFont));
            glassCell.setPadding(5);
            itemsTable.addCell(glassCell);

            // Width
            PdfPCell widthCell = new PdfPCell(new Phrase(String.format("%.2f", line.getWidth()), normalFont));
            widthCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            widthCell.setPadding(5);
            itemsTable.addCell(widthCell);

            // Height
            PdfPCell heightCell = new PdfPCell(new Phrase(String.format("%.2f", line.getHeight()), normalFont));
            heightCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            heightCell.setPadding(5);
            itemsTable.addCell(heightCell);

            // Area
            PdfPCell areaCell = new PdfPCell(new Phrase(String.format("%.2f", line.getAreaM2()), normalFont));
            areaCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            areaCell.setPadding(5);
            itemsTable.addCell(areaCell);

            // Cutting type
            String cuttingType = line.getCuttingType().name().equals("SHATF") ? "Beveled" : "Laser";
            PdfPCell cutTypeCell = new PdfPCell(new Phrase(cuttingType, normalFont));
            cutTypeCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cutTypeCell.setPadding(5);
            itemsTable.addCell(cutTypeCell);

            // Cutting price
            PdfPCell cutPriceCell = new PdfPCell(new Phrase(String.format("%.2f", line.getCuttingPrice()), normalFont));
            cutPriceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            cutPriceCell.setPadding(5);
            itemsTable.addCell(cutPriceCell);

            // Line total
            PdfPCell totalCell = new PdfPCell(new Phrase(String.format("%.2f", line.getLineTotal()), normalFont));
            totalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalCell.setPadding(5);
            itemsTable.addCell(totalCell);
        }

        // Total row
        PdfPCell totalLabelCell = new PdfPCell(new Phrase("Total", boldFont));
        totalLabelCell.setColspan(6);
        totalLabelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalLabelCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        totalLabelCell.setPadding(5);
        itemsTable.addCell(totalLabelCell);

        PdfPCell totalCuttingCell = new PdfPCell(new Phrase(String.format("%.2f", totalCuttingPrice), boldFont));
        totalCuttingCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        totalCuttingCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalCuttingCell.setPadding(5);
        itemsTable.addCell(totalCuttingCell);

        PdfPCell grandTotalCell = new PdfPCell(new Phrase(String.format("%.2f", invoice.getTotalPrice()), boldFont));
        grandTotalCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        grandTotalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        grandTotalCell.setPadding(5);
        itemsTable.addCell(grandTotalCell);

        document.add(itemsTable);
        document.add(new Paragraph(" "));
    }

    private void addTotals(Document document, Invoice invoice, Font titleFont, Font normalFont) throws DocumentException {
        PdfPTable totalTable = new PdfPTable(2);
        totalTable.setWidthPercentage(60);
        totalTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

        PdfPCell totalLabelCell = new PdfPCell(new Phrase("Invoice Total:", titleFont));
        totalLabelCell.setBorder(Rectangle.NO_BORDER);
        totalLabelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalTable.addCell(totalLabelCell);

        PdfPCell totalValueCell = new PdfPCell(new Phrase(
                String.format("%.2f EGP", invoice.getTotalPrice()), titleFont));
        totalValueCell.setBorder(Rectangle.NO_BORDER);
        totalValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalTable.addCell(totalValueCell);

        document.add(totalTable);
        document.add(new Paragraph(" "));
    }

    private void addFooter(Document document, PrintType printType, Font normalFont) throws DocumentException {
        document.add(new Paragraph(" "));

        String footerText = "";
        switch (printType) {
            case CLIENT:
                footerText = "Client Copy - Thank you for your business\nAddress: New Cairo - Fifth Settlement\nPhone: 01234567890";
                break;
            case OWNER:
                footerText = "Owner Copy - For Review and Archive";
                break;
            case STICKER:
                footerText = "Factory Sticker";
                break;
        }

        Paragraph footer = new Paragraph(footerText, normalFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        Paragraph timestamp = new Paragraph(
                "Generated on: " + LocalDateTime.now().format(DATE_FORMATTER),
                new Font(normalFont.getBaseFont(), 8, Font.ITALIC));
        timestamp.setAlignment(Element.ALIGN_CENTER);
        timestamp.setSpacingBefore(10);
        document.add(timestamp);
    }

    private void buildStickerPdf(Document document, Invoice invoice,
                                 Font titleFont, Font headerFont,
                                 Font normalFont, Font boldFont, Font smallFont) throws DocumentException {

        // ===== Header with Logo and Company Name =====
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{1, 3});
        headerTable.setSpacingAfter(10);
        headerTable.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        // Logo
        PdfPCell logoCell = new PdfPCell();
        logoCell.setBackgroundColor(new BaseColor(66, 133, 244));
        logoCell.setFixedHeight(50);
        logoCell.setBorder(Rectangle.BOX);
        logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        Paragraph logoText = new Paragraph("EG", new Font(boldFont.getBaseFont(), 20, Font.BOLD, BaseColor.WHITE));
        logoText.setAlignment(Element.ALIGN_CENTER);
        logoCell.addElement(logoText);
        headerTable.addCell(logoCell);

        // Company Name
        PdfPCell companyCell = new PdfPCell();
        companyCell.setBorder(Rectangle.NO_BORDER);
        companyCell.setPadding(5);
        companyCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph companyName = new Paragraph("ELGUINDY GLASS",
                new Font(boldFont.getBaseFont(), 14, Font.BOLD));
        companyName.setAlignment(Element.ALIGN_RIGHT);
        companyCell.addElement(companyName);
        headerTable.addCell(companyCell);

        document.add(headerTable);
        document.add(new LineSeparator(1, 100, BaseColor.BLACK, Element.ALIGN_CENTER, -2));
        document.add(Chunk.NEWLINE);

        // ===== Main Information Table =====
        PdfPTable mainTable = new PdfPTable(2);
        mainTable.setWidthPercentage(100);
        mainTable.setWidths(new float[]{1.2f, 2f});
        mainTable.setSpacingAfter(10);
        mainTable.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        Font labelFont = new Font(boldFont.getBaseFont(), 10, Font.BOLD);
        Font valueFont = new Font(normalFont.getBaseFont(), 11, Font.BOLD);

        // Get first invoice line
        InvoiceLine firstLine = invoice.getInvoiceLines().get(0);

        // Product (المنتج)
        addStickerLabelCell(mainTable, "Product", labelFont, false);
        addStickerValueCell(mainTable, firstLine.getGlassType().getName(), valueFont, true);

        // Thickness (السماكة)
        addStickerLabelCell(mainTable, "Thickness", labelFont, false);
        addStickerValueCell(mainTable, String.format("%.0f", firstLine.getGlassType().getThickness()), valueFont, false);

        // Size (المقاس)
        addStickerLabelCell(mainTable, "Size", labelFont, false);
        String size = String.format("%.0f × %.0f %s",
                firstLine.getWidth(),
                firstLine.getHeight(),
                firstLine.getDimensionUnit());
        addStickerValueCell(mainTable, size, valueFont, true);

        // Color (اللون)
        addStickerLabelCell(mainTable, "Color", labelFont, false);
        PdfPCell colorValueCell = new PdfPCell();
        colorValueCell.setBorder(Rectangle.BOX);
        colorValueCell.setPadding(8);
        colorValueCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        Paragraph colorPara = new Paragraph("☑ Tinted     ☐ Colored", new Font(normalFont.getBaseFont(), 9, Font.NORMAL));
        colorPara.setAlignment(Element.ALIGN_CENTER);
        colorValueCell.addElement(colorPara);
        mainTable.addCell(colorValueCell);

        // Unit (الوحدة)
        addStickerLabelCell(mainTable, "Unit", labelFont, false);
        addStickerValueCell(mainTable, "Sheet", valueFont, false);

        // Quantity (الكمية)
        addStickerLabelCell(mainTable, "Quantity", labelFont, false);
        addStickerValueCell(mainTable, String.valueOf(invoice.getInvoiceLines().size()), valueFont, true);

        // Packing Date (تاريخ التعبئة)
        addStickerLabelCell(mainTable, "Packing Date", labelFont, false);
        addStickerValueCell(mainTable, invoice.getIssueDate().format(DATE_FORMATTER_SHORT), valueFont, false);

        // Customer (العميل)
        addStickerLabelCell(mainTable, "Customer", labelFont, false);
        PdfPCell customerValueCell = new PdfPCell();
        customerValueCell.setBorder(Rectangle.BOX);
        customerValueCell.setPadding(8);
        customerValueCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        Paragraph customerPara = new Paragraph("☑ Local     ☐ Export", new Font(normalFont.getBaseFont(), 9, Font.NORMAL));
        customerPara.setAlignment(Element.ALIGN_CENTER);
        customerValueCell.addElement(customerPara);
        mainTable.addCell(customerValueCell);

        // QC (مراقبة الجودة)
        addStickerLabelCell(mainTable, "QC", labelFont, false);
        PdfPCell qcValueCell = new PdfPCell(new Phrase("OK ✓",
                new Font(boldFont.getBaseFont(), 12, Font.BOLD, new BaseColor(76, 175, 80))));
        qcValueCell.setBorder(Rectangle.BOX);
        qcValueCell.setPadding(8);
        qcValueCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        qcValueCell.setBackgroundColor(new BaseColor(232, 245, 233));
        mainTable.addCell(qcValueCell);

        document.add(mainTable);

        // ===== Bottom Info =====
        document.add(new LineSeparator(1, 100, BaseColor.LIGHT_GRAY, Element.ALIGN_CENTER, -2));
        document.add(Chunk.NEWLINE);

        // Customer Name
        Paragraph customerName = new Paragraph(
                invoice.getCustomer().getName() + " :",
                new Font(boldFont.getBaseFont(), 10, Font.BOLD));
        customerName.setAlignment(Element.ALIGN_RIGHT);
        document.add(customerName);

        // Invoice Number
        Paragraph invoiceNum = new Paragraph(
                invoice.getId() + " #:",
                new Font(normalFont.getBaseFont(), 9, Font.NORMAL));
        invoiceNum.setAlignment(Element.ALIGN_RIGHT);
        invoiceNum.setSpacingAfter(5);
        document.add(invoiceNum);

        // Notes if exists
        if (invoice.getNotes() != null && !invoice.getNotes().trim().isEmpty()) {
            Paragraph notes = new Paragraph(
                    invoice.getNotes(),
                    new Font(normalFont.getBaseFont(), 8, Font.ITALIC));
            notes.setAlignment(Element.ALIGN_RIGHT);
            notes.setSpacingAfter(10);
            document.add(notes);
        }

        // ===== Footer =====
        PdfPTable footerTable = new PdfPTable(2);
        footerTable.setWidthPercentage(100);
        footerTable.setWidths(new float[]{1, 1});

        // Contact info (Left side)
        PdfPCell contactCell = new PdfPCell();
        contactCell.setBorder(Rectangle.NO_BORDER);
        Paragraph hotline = new Paragraph(": 19864",
                new Font(smallFont.getBaseFont(), 7, Font.NORMAL));
        hotline.setAlignment(Element.ALIGN_LEFT);
        contactCell.addElement(hotline);
        Paragraph website = new Paragraph("www.elguindyglass.com",
                new Font(smallFont.getBaseFont(), 7, Font.NORMAL, BaseColor.BLUE));
        website.setAlignment(Element.ALIGN_LEFT);
        contactCell.addElement(website);
        Paragraph email = new Paragraph("info@elguindyglass.com",
                new Font(smallFont.getBaseFont(), 7, Font.NORMAL));
        email.setAlignment(Element.ALIGN_LEFT);
        contactCell.addElement(email);
        footerTable.addCell(contactCell);

        // Document number and version (Right side)
        PdfPCell docCell = new PdfPCell();
        docCell.setBorder(Rectangle.NO_BORDER);
        Paragraph docNum = new Paragraph("GMF-70950-09",
                new Font(smallFont.getBaseFont(), 7, Font.NORMAL));
        docNum.setAlignment(Element.ALIGN_RIGHT);
        docCell.addElement(docNum);
        Paragraph version = new Paragraph(
                "VER 3 " + LocalDateTime.now().format(DATE_FORMATTER_SHORT),
                new Font(smallFont.getBaseFont(), 7, Font.NORMAL));
        version.setAlignment(Element.ALIGN_RIGHT);
        docCell.addElement(version);
        footerTable.addCell(docCell);

        document.add(footerTable);
    }

    private void addStickerLabelCell(PdfPTable table, String label, Font font, boolean gray) {
        PdfPCell cell = new PdfPCell(new Phrase(label, font));
        cell.setBorder(Rectangle.BOX);
        cell.setPadding(8);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        if (gray) {
            cell.setBackgroundColor(new BaseColor(245, 245, 245));
        }
        table.addCell(cell);
    }

    private void addStickerValueCell(PdfPTable table, String value, Font font, boolean highlight) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font));
        cell.setBorder(Rectangle.BOX);
        cell.setPadding(8);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        if (highlight) {
            cell.setBackgroundColor(new BaseColor(255, 253, 231)); // Light yellow
        }
        table.addCell(cell);
    }
}