package com.example.backend.services;

import com.example.backend.models.CompanyProfile;
import com.example.backend.models.Invoice;
import com.example.backend.models.InvoiceLine;
import com.example.backend.models.InvoiceLineOperation;
import com.example.backend.models.enums.PrintType;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.draw.LineSeparator;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class PdfGenerationService {

    @Value("${app.assets.path:/app/assets}")
    private String assetsPath;

    @Autowired
    private StorageService storageService;

    @Autowired
    private CompanyProfileService companyProfileService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    // Colors - Switched to Black & White / Grayscale
    private static final BaseColor BRAND_COLOR = BaseColor.BLACK; // Was Blue
    private static final BaseColor HEADER_BG = BaseColor.WHITE; // Was Light Gray
    private static final BaseColor BORDER_COLOR = BaseColor.DARK_GRAY; // Was Light Gray
    private static final BaseColor TEXT_COLOR = BaseColor.BLACK;
    private static final BaseColor SUB_BG = BaseColor.WHITE; // Was Very Light Gray

    public String generateInvoicePdf(Invoice invoice, PrintType printType) {
        try {
            log.info("Generating PDF for invoice {} with type {}", invoice.getId(), printType);

            CompanyProfile profile = companyProfileService.getProfile();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 30, 30, 30, 30);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setRunDirection(PdfWriter.RUN_DIRECTION_LTR);

            document.open();

            // Fonts
            BaseFont arBaseFont = getArabicFont();
            // Use standard font for branding/static English, or use the Arabic font for
            // consistency if needed.
            // Using the Arabic-capable font for everything allows mixed content.
            Font brandFont = new Font(arBaseFont, 24, Font.BOLD, BRAND_COLOR); // Increased size
            Font titleFont = new Font(arBaseFont, 16, Font.BOLD, TEXT_COLOR);
            Font headerFont = new Font(arBaseFont, 10, Font.BOLD, BaseColor.BLACK); // Black Text for headers
            Font labelFont = new Font(arBaseFont, 9, Font.BOLD, BaseColor.DARK_GRAY);
            Font normalFont = new Font(arBaseFont, 10, Font.NORMAL, TEXT_COLOR);
            Font smallFont = new Font(arBaseFont, 8, Font.NORMAL, BaseColor.GRAY);
            Font boldFont = new Font(arBaseFont, 10, Font.BOLD, TEXT_COLOR);

            PrintType[] pages = { PrintType.CLIENT, PrintType.OWNER };

            for (PrintType pageType : pages) {
                // 1. Header
                addHeader(document, invoice, profile, brandFont, labelFont, boldFont);
                addSpacer(document, 10);

                // 2. Info Section
                addSupplierCustomerSection(document, invoice, profile, titleFont, labelFont, normalFont, boldFont);
                addSpacer(document, 15);

                // 3. Items Table
                addItemsTable(document, invoice, headerFont, normalFont, boldFont, smallFont);

                // 4. Totals (Bank Details Removed)
                addTotalsSection(document, invoice, labelFont, boldFont, brandFont);

                // 5. Notes
                if (invoice.getNotes() != null && !invoice.getNotes().trim().isEmpty()) {
                    addSpacer(document, 10);
                    document.add(new Paragraph("Notes:", labelFont));
                    document.add(new Paragraph(invoice.getNotes(), normalFont));
                }

                // 6. Footer
                addFooter(document, pageType, profile, smallFont);

                if (pageType == PrintType.CLIENT) {
                    document.newPage();
                }
            }

            document.close();

            String fileName = String.format("invoice_%d_%s.pdf", invoice.getId(), printType.name().toLowerCase());
            String publicUrl = null;
            if (storageService != null) {
                publicUrl = storageService.storePdf(baos.toByteArray(), fileName, "invoices");
            }
            return publicUrl;

        } catch (Exception e) {
            log.error("Error generating invoice PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating invoice PDF: " + e.getMessage(), e);
        }
    }

    public String generateStickerPdf(Invoice invoice) {
        try {
            log.info("Generating sticker PDF for invoice {}", invoice.getId());

            CompanyProfile profile = companyProfileService.getProfile();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            // A5 size
            Document document = new Document(PageSize.A5, 15, 15, 15, 15);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setRunDirection(PdfWriter.RUN_DIRECTION_LTR);
            document.open();

            // Fonts
            BaseFont arBaseFont = getArabicFont();
            Font titleFont = new Font(arBaseFont, 18, Font.BOLD, BaseColor.BLACK);
            Font labelFont = new Font(arBaseFont, 10, Font.NORMAL, BaseColor.GRAY);
            Font valueFont = new Font(arBaseFont, 12, Font.BOLD, BaseColor.BLACK);
            Font smallFont = new Font(arBaseFont, 9, Font.NORMAL, BaseColor.DARK_GRAY);

            // Sort lines (Thickness, then Size)
            List<InvoiceLine> sortedLines = new ArrayList<>(invoice.getInvoiceLines());
            sortedLines.sort((l1, l2) -> {
                Double t1 = (l1.getGlassType() != null && l1.getGlassType().getThickness() != null)
                        ? l1.getGlassType().getThickness()
                        : 0.0;
                Double t2 = (l2.getGlassType() != null && l2.getGlassType().getThickness() != null)
                        ? l2.getGlassType().getThickness()
                        : 0.0;
                return t1.compareTo(t2);
            });

            for (InvoiceLine line : sortedLines) {
                buildStickerPage(document, invoice, line, profile, titleFont, labelFont, valueFont, smallFont);
                document.newPage();
            }

            document.close();

            String fileName = String.format("sticker_%d.pdf", invoice.getId());
            String publicUrl = null;
            if (storageService != null) {
                publicUrl = storageService.storePdf(baos.toByteArray(), fileName, "stickers");
            }
            return publicUrl;

        } catch (Exception e) {
            log.error("Error generating sticker PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating sticker PDF", e);
        }
    }

    private BaseFont getArabicFont() throws DocumentException, IOException {
        String[] fontPaths = {
                Paths.get(assetsPath, "fonts", "NotoSansArabic-Regular.ttf").toString(), // Original path
                "C:/Windows/Fonts/arial.ttf", // Windows standard
                "C:/Windows/Fonts/calibri.ttf",
                "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf" // Linux standard
        };

        for (String path : fontPaths) {
            try {
                // IDENTITY_H is crucial for Arabic support
                return BaseFont.createFont(path, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            } catch (Exception e) {
                // Continue to next font
            }
        }

        log.warn("Arabic font not found, using fallback Helvetica (Arabic will not render)");
        return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
    }

    // ================= HELPER METHODS =================

    private void addHeader(Document document, Invoice invoice, CompanyProfile profile, Font brandFont, Font labelFont,
            Font valFont) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 1.5f, 0.5f }); // Adjusted to give more space/prominence to logo
        table.setRunDirection(PdfWriter.RUN_DIRECTION_LTR);

        // Logo / Brand
        PdfPCell left = new PdfPCell();
        left.setBorder(Rectangle.NO_BORDER);
        left.setVerticalAlignment(Element.ALIGN_MIDDLE);
        left.setFixedHeight(80f); // Increased height for larger logo

        boolean logoAdded = false;
        if (StringUtils.hasText(profile.getLogoUrl())) {
            try {
                String objectName = storageService.extractObjectName(profile.getLogoUrl());
                if (objectName != null) {
                    try (InputStream is = storageService.getFile(objectName)) {
                        byte[] bytes = is.readAllBytes();
                        Image img = Image.getInstance(bytes);
                        img.scaleToFit(200, 75); // Increased max size (was 150, 50)
                        left.addElement(img);
                        logoAdded = true;
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to load logo from URL: {}", profile.getLogoUrl(), e);
            }
        }

        if (!logoAdded) {
            left.addElement(new Paragraph(
                    profile.getCompanyName() != null ? profile.getCompanyName() : "ELGUINDY GLASS", brandFont));
        }

        table.addCell(left);

        // Invoice Info
        PdfPCell right = new PdfPCell();
        right.setBorder(Rectangle.NO_BORDER);
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        right.setVerticalAlignment(Element.ALIGN_MIDDLE);

        PdfPTable info = new PdfPTable(2);
        info.setWidthPercentage(100);
        info.setHorizontalAlignment(Element.ALIGN_RIGHT);
        info.setRunDirection(PdfWriter.RUN_DIRECTION_LTR);

        addCompactRow(info, "INVOICE #", String.valueOf(invoice.getId()), labelFont, valFont);
        addCompactRow(info, "DATE", invoice.getIssueDate().format(DATE_FORMATTER), labelFont, valFont);

        right.addElement(info);
        table.addCell(right);

        document.add(table);

        // Separator
        LineSeparator ls = new LineSeparator();
        ls.setLineColor(BORDER_COLOR);
        document.add(new Paragraph(" "));
        document.add(ls);
    }

    private void addSupplierCustomerSection(Document document, Invoice invoice, CompanyProfile profile, Font title,
            Font label, Font normal, Font bold) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);
        table.setWidths(new float[] { 1, 1 });
        table.setRunDirection(PdfWriter.RUN_DIRECTION_LTR);

        // From
        PdfPCell from = new PdfPCell();
        from.setBorder(Rectangle.NO_BORDER);
        from.addElement(new Paragraph("FROM", label));
        from.addElement(new Paragraph(
                profile.getCompanyName() != null ? profile.getCompanyName() : "ElGuindy Glass Co.", bold));
        if (profile.getAddress() != null) {
            from.addElement(new Paragraph(profile.getAddress(), normal));
        }
        if (profile.getPhone() != null) {
            from.addElement(new Paragraph(profile.getPhone(), normal));
        }
        if (profile.getEmail() != null) {
            from.addElement(new Paragraph(profile.getEmail(), normal));
        }
        table.addCell(from);

        // To
        PdfPCell to = new PdfPCell();
        to.setBorder(Rectangle.NO_BORDER);
        to.setPaddingLeft(20);
        to.addElement(new Paragraph("BILL TO", label));
        to.addElement(new Paragraph(invoice.getCustomer().getName(), bold));
        if (invoice.getCustomer().getPhone() != null) {
            to.addElement(new Paragraph(invoice.getCustomer().getPhone(), normal));
        }
        if (invoice.getCustomer().getAddress() != null) {
            to.addElement(new Paragraph(invoice.getCustomer().getAddress(), normal));
        }
        table.addCell(to);

        document.add(table);
    }

    private void addItemsTable(Document document, Invoice invoice, Font headerFont, Font normalFont, Font boldFont,
            Font smallFont) throws DocumentException {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingBefore(20);
        table.setWidths(new float[] { 4f, 1.2f, 1f, 1.5f }); // Adjusted widths
        table.setRunDirection(PdfWriter.RUN_DIRECTION_LTR);

        // Headers
        String[] headers = { "Description", "Unit Price", "Qty", "Total" };
        for (String h : headers) {
            PdfPCell c = new PdfPCell(new Phrase(h, headerFont));
            c.setBackgroundColor(HEADER_BG); // White (no color) but maybe light gray border? No, keeping clean.
            c.setPadding(8);
            c.setHorizontalAlignment(Element.ALIGN_CENTER);
            c.setBorderColor(BORDER_COLOR);
            c.setBorderWidthBottom(1.5f); // Thicker bottom border for header
            table.addCell(c);
        }

        // Rows
        for (InvoiceLine line : invoice.getInvoiceLines()) {
            addInvoiceLineRows(table, line, normalFont, boldFont, smallFont);
        }

        document.add(table);
    }

    private void addInvoiceLineRows(PdfPTable table, InvoiceLine line, Font normal, Font bold, Font small) {
        // 1. Main Item
        String glassName = line.getGlassType() != null ? line.getGlassType().getName() : "Glass";
        String thickness = (line.getGlassType() != null && line.getGlassType().getThickness() != null)
                ? line.getGlassType().getThickness() + "mm"
                : "";
        String desc = glassName + " " + thickness;

        double unitPrice = line.getGlassPrice() / (line.getQuantityForPricing() > 0 ? line.getQuantityForPricing() : 1);

        addRow(table, desc,
                formatCurrency(unitPrice),
                String.format("%.2f", line.getQuantityForPricing()),
                formatCurrency(line.getGlassPrice()),
                bold, normal, false);

        // 2. Operations (Legacy & New Mixed)
        List<OpDisplay> operations = getDisplayOperations(line);
        if (!operations.isEmpty()) {
            for (OpDisplay op : operations) {
                // If price is 0, don't show 0.00, just show blank or included
                String priceStr = (op.price != null && op.price > 0) ? formatCurrency(op.price) : "";
                String totalStr = (op.price != null && op.price > 0) ? formatCurrency(op.price) : "";

                addRow(table, "  - " + op.name,
                        "-", // No unit price for op usually
                        "-", // No qty
                        totalStr,
                        small, small, true);
            }
        }
    }

    private void addRow(PdfPTable table, String desc, String price, String qty, String total, Font dFont, Font vFont,
            boolean isSub) {
        PdfPCell d = new PdfPCell(new Phrase(desc, dFont));
        d.setPadding(6);
        d.setVerticalAlignment(Element.ALIGN_MIDDLE);
        d.setBorderColor(BORDER_COLOR);
        d.setRunDirection(PdfWriter.RUN_DIRECTION_LTR); // Ensure LTR for cells

        PdfPCell p = new PdfPCell(new Phrase(price, vFont));
        p.setPadding(6);
        p.setHorizontalAlignment(Element.ALIGN_CENTER);
        p.setVerticalAlignment(Element.ALIGN_MIDDLE);
        p.setBorderColor(BORDER_COLOR);

        PdfPCell q = new PdfPCell(new Phrase(qty, vFont));
        q.setPadding(6);
        q.setHorizontalAlignment(Element.ALIGN_CENTER);
        q.setVerticalAlignment(Element.ALIGN_MIDDLE);
        q.setBorderColor(BORDER_COLOR);

        PdfPCell t = new PdfPCell(new Phrase(total, vFont));
        t.setPadding(6);
        t.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.setVerticalAlignment(Element.ALIGN_MIDDLE);
        t.setBorderColor(BORDER_COLOR);

        if (isSub) {
            // Keep background white for sub-items too in colorless mode
            d.setBackgroundColor(BaseColor.WHITE);
            p.setBackgroundColor(BaseColor.WHITE);
            q.setBackgroundColor(BaseColor.WHITE);
            t.setBackgroundColor(BaseColor.WHITE);
            // Remove top border to merge visually with parent
            d.setBorderWidthTop(0);
            p.setBorderWidthTop(0);
            q.setBorderWidthTop(0);
            t.setBorderWidthTop(0);
        }

        table.addCell(d);
        table.addCell(p);
        table.addCell(q);
        table.addCell(t);
    }

    private void addTotalsSection(Document document, Invoice invoice, Font labelFont, Font boldFont, Font bigFont)
            throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingBefore(20);
        table.setWidths(new float[] { 1f, 1f });
        table.setRunDirection(PdfWriter.RUN_DIRECTION_LTR);

        // Left side empty (Removed Bank Details)
        PdfPCell left = new PdfPCell(new Phrase(""));
        left.setBorder(Rectangle.NO_BORDER);
        table.addCell(left);

        // Right side Totals
        PdfPTable totals = new PdfPTable(2);
        totals.setWidthPercentage(100);
        totals.setWidths(new float[] { 1f, 1.5f });
        totals.setRunDirection(PdfWriter.RUN_DIRECTION_LTR);

        // Net Total
        addCompactRow(totals, "Net Total:", formatCurrency(invoice.getTotalPrice()), labelFont, boldFont);

        // Grand Total
        PdfPCell l = new PdfPCell(new Phrase("TOTAL", labelFont));
        l.setBorder(Rectangle.TOP);
        l.setBorderColor(BORDER_COLOR);
        l.setPadding(10);
        totals.addCell(l);

        PdfPCell v = new PdfPCell(new Phrase(formatCurrency(invoice.getTotalPrice()) + " EGP", bigFont));
        v.setBorder(Rectangle.TOP);
        v.setBorderColor(BORDER_COLOR);
        v.setHorizontalAlignment(Element.ALIGN_RIGHT);
        v.setPadding(10);
        totals.addCell(v);

        PdfPCell wrapper = new PdfPCell(totals);
        wrapper.setBorder(Rectangle.NO_BORDER);
        table.addCell(wrapper);

        document.add(table);
    }

    private void addFooter(Document document, PrintType type, CompanyProfile profile, Font font)
            throws DocumentException {
        document.add(new Paragraph(" "));
        LineSeparator ls = new LineSeparator();
        ls.setLineColor(BORDER_COLOR);
        document.add(ls);

        String footerText = profile.getFooterText() != null
                ? profile.getFooterText()
                : "ElGuindy Glass Co. | New Cairo | +20 123 456 789";

        Paragraph p = new Paragraph(footerText, font);
        p.setAlignment(Element.ALIGN_CENTER);
        p.setSpacingBefore(5);
        document.add(p);

        if (type == PrintType.OWNER) {
            // Keeping RED for internal copy notion is standard, but if "colorless" implies
            // EVERYTHING:
            // I'll keep it RED as it is an internal marker, usually acceptable even in B&W
            // printing.
            // Or make it BLACK BOLD. Let's make it BLACK BOLD to strictly follow
            // instructions.
            Paragraph internal = new Paragraph("INTERNAL COPY",
                    new Font(font.getBaseFont(), 8, Font.BOLD, BaseColor.BLACK));
            internal.setAlignment(Element.ALIGN_CENTER);
            document.add(internal);
        }
    }

    // ============= STICKER HELPERS =============

    private void buildStickerPage(Document document, Invoice invoice, InvoiceLine line, CompanyProfile profile,
            Font titleF, Font labelF, Font valF, Font smallF) throws DocumentException {
        // Container
        PdfPTable main = new PdfPTable(1);
        main.setWidthPercentage(100);

        // Header (Logo + Company)
        PdfPCell headerCell = new PdfPCell();
        headerCell.setBorder(Rectangle.NO_BORDER);
        // Removed Colored Background
        headerCell.setPadding(10);
        headerCell.setHorizontalAlignment(Element.ALIGN_CENTER);

        // Add Logo if available
        boolean logoAdded = false;
        if (StringUtils.hasText(profile.getLogoUrl())) {
            try {
                String objectName = storageService.extractObjectName(profile.getLogoUrl());
                if (objectName != null) {
                    try (InputStream is = storageService.getFile(objectName)) {
                        byte[] bytes = is.readAllBytes();
                        Image img = Image.getInstance(bytes);
                        // Make sticker logo reasonably big but fitting header
                        img.scaleToFit(120, 60);
                        img.setAlignment(Element.ALIGN_CENTER);
                        headerCell.addElement(img);
                        logoAdded = true;
                    }
                }
            } catch (Exception e) {
                // Ignore
            }
        }

        if (!logoAdded) {
            Paragraph h = new Paragraph(profile.getCompanyName() != null ? profile.getCompanyName() : "ELGUINDY GLASS",
                    new Font(titleF.getBaseFont(), 14, Font.BOLD, BaseColor.BLACK));
            h.setAlignment(Element.ALIGN_CENTER);
            headerCell.addElement(h);
        }

        main.addCell(headerCell);

        // Content Table
        PdfPTable content = new PdfPTable(2);
        content.setWidthPercentage(100);
        content.setWidths(new float[] { 1f, 1.5f });
        content.setRunDirection(PdfWriter.RUN_DIRECTION_LTR);

        // Customer
        addStickerRow(content, "Customer", invoice.getCustomer().getName(), labelF, valF);

        // Product
        String product = (line.getGlassType() != null ? line.getGlassType().getName() : "-");
        addStickerRow(content, "Product", product, labelF, valF);

        // Thickness
        String thk = (line.getGlassType() != null && line.getGlassType().getThickness() != null)
                ? line.getGlassType().getThickness() + " MM"
                : "-";
        addStickerRow(content, "Thickness", thk, labelF, valF);

        // Size
        String size = String.format("%.0f x %.0f mm", line.getWidth(), line.getHeight());
        // Highlight Size
        PdfPCell l = new PdfPCell(new Phrase("Size", labelF));
        l.setPadding(5);
        l.setBorderColor(BORDER_COLOR);
        content.addCell(l);

        PdfPCell v = new PdfPCell(new Phrase(size, new Font(valF.getBaseFont(), 16, Font.BOLD, BaseColor.BLACK)));
        v.setPadding(5);
        v.setBorderColor(BORDER_COLOR);
        content.addCell(v);

        // Operations
        List<OpDisplay> ops = getDisplayOperations(line);
        if (!ops.isEmpty()) {
            PdfPCell opLabel = new PdfPCell(new Phrase("Processing", labelF));
            opLabel.setPadding(5);
            opLabel.setBorderColor(BORDER_COLOR);
            content.addCell(opLabel);

            PdfPCell opVal = new PdfPCell();
            opVal.setPadding(5);
            opVal.setBorderColor(BORDER_COLOR);
            com.itextpdf.text.List list = new com.itextpdf.text.List(com.itextpdf.text.List.UNORDERED);
            list.setListSymbol("\u2022 "); // Bullet
            for (OpDisplay op : ops) {
                list.add(new ListItem(op.name, smallF));
            }
            opVal.addElement(list);
            content.addCell(opVal);
        }

        // Invoice Ref
        PdfPCell refCell = new PdfPCell(new Phrase("Inv #" + invoice.getId(), smallF));
        refCell.setColspan(2);
        refCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        refCell.setBorder(Rectangle.TOP);
        refCell.setBorderColor(BORDER_COLOR);
        refCell.setPadding(5);
        content.addCell(refCell);

        PdfPCell contentWrapper = new PdfPCell(content);
        contentWrapper.setBorder(Rectangle.BOX);
        contentWrapper.setBorderColor(BaseColor.BLACK);
        contentWrapper.setBorderWidth(1.5f); // Thicker border for sticker
        main.addCell(contentWrapper);

        document.add(main);
    }

    private void addStickerRow(PdfPTable table, String label, String value, Font lFont, Font vFont) {
        PdfPCell l = new PdfPCell(new Phrase(label, lFont));
        l.setPadding(5);
        l.setBorderColor(BORDER_COLOR);
        table.addCell(l);

        PdfPCell v = new PdfPCell(new Phrase(value, vFont));
        v.setPadding(5);
        v.setBorderColor(BORDER_COLOR);
        table.addCell(v);
    }

    private void addCompactRow(PdfPTable table, String label, String value, Font lFont, Font vFont) {
        PdfPCell l = new PdfPCell(new Phrase(label, lFont));
        l.setBorder(Rectangle.NO_BORDER);
        table.addCell(l);

        PdfPCell v = new PdfPCell(new Phrase(value, vFont));
        v.setBorder(Rectangle.NO_BORDER);
        v.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(v);
    }

    private void addSpacer(Document doc, float size) throws DocumentException {
        Paragraph p = new Paragraph("");
        p.setSpacingAfter(size);
        doc.add(p);
    }

    private String formatCurrency(Double val) {
        return val != null ? String.format("%.2f", val) : "0.00";
    }

    // Helper class for operations
    @Data
    @AllArgsConstructor
    private static class OpDisplay {
        String name;
        Double price;
    }

    private List<OpDisplay> getDisplayOperations(InvoiceLine line) {
        List<OpDisplay> ops = new ArrayList<>();

        // 1. New Operations List
        if (line.getOperations() != null && !line.getOperations().isEmpty()) {
            for (InvoiceLineOperation op : line.getOperations()) {
                ops.add(new OpDisplay(op.getDescription(), op.getOperationPrice()));
            }
        }
        // 2. Legacy Fallback
        else {
            if (line.getShatafType() != null) {
                ops.add(new OpDisplay("Shataf: " + line.getShatafType().name(), null));
            }
            if (line.getFarmaType() != null) {
                ops.add(new OpDisplay("Farma: " + line.getFarmaType().name(), null));
            }
            // Check legacy manual cutting price if no specific type but price exists?
            if (line.getCuttingType() != null) {
                // Avoid duplicates if cutting type is same as shataf
                boolean alreadyAdded = false;
                if (line.getShatafType() != null
                        && line.getShatafType().name().contains(line.getCuttingType().name())) {
                    alreadyAdded = true;
                }
                if (!alreadyAdded) {
                    ops.add(new OpDisplay("Cut: " + line.getCuttingType().name(), line.getCuttingPrice()));
                }
            }
        }
        return ops;
    }
}