package com.example.backend.services;

import com.example.backend.models.CompanyProfile;
import com.example.backend.models.Invoice;
import com.example.backend.models.InvoiceLine;
import com.example.backend.models.InvoiceLineOperation;
import com.example.backend.models.enums.PrintType;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
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
    private CompanyProfileService companyProfileService;

    // --- Modern Professional Palette ---
    private static final BaseColor COL_HEADER_BG = new BaseColor(44, 62, 80);      // Dark Navy
    private static final BaseColor COL_HEADER_TXT = BaseColor.WHITE;               // White text on header
    private static final BaseColor COL_BOX_BG = new BaseColor(241, 243, 245);      // Light Gray (Customer Box)
    private static final BaseColor COL_ACCENT = new BaseColor(41, 128, 185);       // Professional Blue
    private static final BaseColor COL_TEXT_MAIN = new BaseColor(33, 37, 41);      // Dark Gray Text
    private static final BaseColor COL_TEXT_SEC = new BaseColor(108, 117, 125);    // Muted/Light Text
    private static final BaseColor COL_BORDER = new BaseColor(230, 230, 230);      // Subtle Border

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    // ==========================================
    //              PUBLIC METHODS
    // ==========================================

    /**
     * Entry point: Generate Invoice PDF bytes.
     * PDFs are generated on-demand and not stored.
     */
    public byte[] generateInvoicePdf(Invoice invoice, PrintType printType) {
        try {
            return generateInvoicePdfOnDemand(invoice);
        } catch (Exception e) {
            log.error("Error generating invoice PDF", e);
            throw new RuntimeException("Error generating invoice PDF", e);
        }
    }

    /**
     * Entry point: Generate Sticker PDF bytes.
     * PDFs are generated on-demand and not stored.
     */
    public byte[] generateStickerPdf(Invoice invoice) {
        try {
            return generateStickerPdfOnDemand(invoice);
        } catch (Exception e) {
            log.error("Error generating sticker PDF", e);
            throw new RuntimeException("Error generating sticker PDF", e);
        }
    }

    /**
     * Core Logic: Generate Clean RTL Invoice (Byte Array)
     */
    public byte[] generateInvoicePdfOnDemand(Invoice invoice) {
        try {
            CompanyProfile profile = companyProfileService.getProfile();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            // Setup Document (A4 with standard margins)
            // Margins: Left/Right 30, Top 30, Bottom 50 (space for footer)
            Document document = new Document(PageSize.A4, 30, 30, 30, 50);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

            document.open();

            // Load Font (Vital for Arabic)
            BaseFont bf = getArabicFont();

            // Page 1: Company Copy
            buildCleanPage(document, writer, invoice, profile, bf, "نسخة الشركة");

            document.newPage();

            // Page 2: Customer Copy
            buildCleanPage(document, writer, invoice, profile, bf, "نسخة العميل");

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("PDF Generation Failed", e);
            throw new RuntimeException("PDF Generation Failed", e);
        }
    }

    /**
     * Core Logic: Generate Stickers (Byte Array)
     */
// ==========================================
    //           STICKER GENERATION
    // ==========================================

    public byte[] generateStickerPdfOnDemand(Invoice invoice) {
        try {
            CompanyProfile profile = companyProfileService.getProfile();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            // A6 (105mm x 148mm) is standard for label printers, but using A5 per your setup.
            // Small margins (5mm) to maximize printable area for the grid.
            Document document = new Document(PageSize.A5, 10, 10, 10, 10);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            // Global LTR for technical specs (Dimensions/Codes), distinct RTL for Arabic names
            writer.setRunDirection(PdfWriter.RUN_DIRECTION_LTR);

            document.open();
            BaseFont bf = getArabicFont();

            // Fonts optimized for Label readability
            Font fHeader = new Font(bf, 14, Font.BOLD, BaseColor.BLACK);
            Font fSubHeader = new Font(bf, 9, Font.NORMAL, BaseColor.DARK_GRAY);
            Font fLabel = new Font(bf, 10, Font.BOLD, BaseColor.DARK_GRAY);
            Font fValue = new Font(bf, 11, Font.NORMAL, BaseColor.BLACK);
            Font fValueBold = new Font(bf, 12, Font.BOLD, BaseColor.BLACK);
            Font fHero = new Font(bf, 24, Font.BOLD, BaseColor.BLACK); // Huge size for Dimensions

            // Sort lines: Thickness -> Area
            List<InvoiceLine> sortedLines = new ArrayList<>(invoice.getInvoiceLines());
            sortedLines.sort((a, b) -> {
                Double t1 = (a.getGlassType() != null) ? a.getGlassType().getThickness() : 0.0;
                Double t2 = (b.getGlassType() != null) ? b.getGlassType().getThickness() : 0.0;
                int cmp = t1.compareTo(t2);
                if (cmp != 0) return cmp;
                return Double.compare(a.getWidth() * a.getHeight(), b.getWidth() * b.getHeight());
            });

            for (InvoiceLine line : sortedLines) {
                int qty = line.getQuantity() != null ? line.getQuantity() : 1;
                for (int i = 0; i < qty; i++) {
                    buildTechnicalStickerPage(document, invoice, line, profile,
                            fHeader, fSubHeader, fLabel, fValue, fValueBold, fHero, i + 1, qty);
                    document.newPage();
                }
            }

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Sticker Generation Failed", e);
            throw new RuntimeException("Sticker Generation Failed", e);
        }
    }

    private void buildTechnicalStickerPage(Document document, Invoice invoice, InvoiceLine line, CompanyProfile profile,
                                           Font fHeader, Font fSubHeader, Font fLabel, Font fVal, Font fValBold, Font fHero,
                                           int currentPiece, int totalPieces) throws DocumentException {

        // 1. Outer Container (The thick black border)
        PdfPTable mainTable = new PdfPTable(1);
        mainTable.setWidthPercentage(100);
        mainTable.getDefaultCell().setBorder(Rectangle.BOX);
        mainTable.getDefaultCell().setBorderWidth(1.5f);
        mainTable.getDefaultCell().setPadding(0);

        // --- HEADER (Logo + Company Name) ---
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{1f, 2.5f});

        // Logo Cell
        PdfPCell cLogo = new PdfPCell();
        cLogo.setBorder(Rectangle.BOTTOM | Rectangle.RIGHT);
        cLogo.setPadding(5);
        cLogo.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cLogo.setFixedHeight(50);
        try {
            byte[] logoBytes = companyProfileService.getLogoBytes();
            if (logoBytes != null) {
                Image img = Image.getInstance(logoBytes);
                img.scaleToFit(50, 40);
                img.setAlignment(Element.ALIGN_CENTER);
                cLogo.addElement(img);
            }
        } catch (Exception ignored) {}
        header.addCell(cLogo);

        // Company Name Cell
        PdfPCell cComp = new PdfPCell();
        cComp.setBorder(Rectangle.BOTTOM);
        cComp.setPadding(5);
        cComp.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Paragraph pComp = new Paragraph(profile.getCompanyName(), fHeader);
        pComp.setAlignment(Element.ALIGN_CENTER);
        cComp.addElement(pComp);

        Paragraph pSub = new Paragraph("INTERNATIONAL GLASS INDUSTRIES", fSubHeader); // Static or from profile
        pSub.setAlignment(Element.ALIGN_CENTER);
        cComp.addElement(pSub);
        header.addCell(cComp);

        // Add Header to Main
        PdfPCell headerWrapper = new PdfPCell(header);
        headerWrapper.setPadding(0);
        headerWrapper.setBorder(Rectangle.NO_BORDER);
        mainTable.addCell(headerWrapper);

        // --- DATA GRID (The rows with borders) ---
        PdfPTable grid = new PdfPTable(2);
        grid.setWidthPercentage(100);
        grid.setWidths(new float[]{1.2f, 2.8f}); // Label vs Value width

        // 1. Product
        String glassName = (line.getGlassType() != null) ? line.getGlassType().getName() : "Glass";
        addGridRow(grid, "Product", glassName, fLabel, fValBold);

        // 2. Thickness
        String thk = (line.getGlassType() != null && line.getGlassType().getThickness() != null)
                ? line.getGlassType().getThickness() + " MM" : "-";
        addGridRow(grid, "Thickness", thk, fLabel, fValBold);

        // 3. SIZE (HERO ROW)
        // Custom cell logic for the large size text
        PdfPCell lSize = new PdfPCell(new Phrase("Size", fLabel));
        lSize.setVerticalAlignment(Element.ALIGN_MIDDLE);
        lSize.setPadding(8);
        lSize.setBorder(Rectangle.BOTTOM | Rectangle.RIGHT);
        grid.addCell(lSize);

        String sizeStr = String.format("%.0f x %.0f", line.getWidth(), line.getHeight());
        PdfPCell vSize = new PdfPCell(new Phrase(sizeStr, fHero)); // Huge Font
        vSize.setHorizontalAlignment(Element.ALIGN_CENTER);
        vSize.setVerticalAlignment(Element.ALIGN_MIDDLE);
        vSize.setPadding(10);
        vSize.setBorder(Rectangle.BOTTOM);
        grid.addCell(vSize);

        // 4. Processing / Color
        String processing = "None";
        if (line.getOperations() != null && !line.getOperations().isEmpty()) {
            List<String> ops = new ArrayList<>();
            line.getOperations().forEach(o -> ops.add(o.getDescription()));
            processing = String.join(", ", ops);
        }
        addGridRow(grid, "Processing", processing, fLabel, fVal);

        // 5. Quantity / Piece Count
        addGridRow(grid, "Quantity", String.format("Piece %d of %d", currentPiece, totalPieces), fLabel, fVal);

        // 6. Packing Date (Issue Date)
        // FIX: Used %s for formatted date to avoid crash
        String dateStr = invoice.getIssueDate() != null ? invoice.getIssueDate().format(DATE_FMT) : "N/A";
        addGridRow(grid, "Packing Date", dateStr, fLabel, fVal);

        // 7. Customer (Arabic Support)
        PdfPCell lCust = new PdfPCell(new Phrase("Customer", fLabel));
        lCust.setVerticalAlignment(Element.ALIGN_MIDDLE);
        lCust.setPadding(6);
        lCust.setBorder(Rectangle.BOTTOM | Rectangle.RIGHT);
        grid.addCell(lCust);

        PdfPCell vCust = new PdfPCell(new Phrase(invoice.getCustomer().getName(), fValBold));
        vCust.setVerticalAlignment(Element.ALIGN_MIDDLE);
        vCust.setPadding(6);
        vCust.setRunDirection(PdfWriter.RUN_DIRECTION_RTL); // Force RTL for name
        vCust.setHorizontalAlignment(Element.ALIGN_RIGHT);  // Align right for Arabic
        vCust.setBorder(Rectangle.BOTTOM);
        grid.addCell(vCust);

        // 8. Order Reference (FIXED CRASH HERE by using %s for ID)
        String refData = String.format("Inv: #%s", invoice.getId());
        addGridRow(grid, "Order Ref", refData, fLabel, fVal);

        // 9. QC
        addGridRow(grid, "QC Check", "OK", fLabel, fVal);

        // Add Grid to Main
        PdfPCell gridWrapper = new PdfPCell(grid);
        gridWrapper.setPadding(0);
        gridWrapper.setBorder(Rectangle.NO_BORDER);
        mainTable.addCell(gridWrapper);

        // --- FOOTER ---
        PdfPTable footer = new PdfPTable(1);
        footer.setWidthPercentage(100);

        PdfPCell cFooter = new PdfPCell();
        cFooter.setBorder(Rectangle.TOP);
        cFooter.setPadding(5);
        cFooter.setHorizontalAlignment(Element.ALIGN_CENTER);

        String contact = "Hotline: " + (profile.getPhone() != null ? profile.getPhone() : "19xxx");
        Paragraph pContact = new Paragraph(contact, new Font(fSubHeader.getBaseFont(), 9, Font.BOLD));
        pContact.setAlignment(Element.ALIGN_CENTER);
        cFooter.addElement(pContact);

        if (profile.getAddress() != null) {
            Paragraph pWeb = new Paragraph(profile.getAddress(), new Font(fSubHeader.getBaseFont(), 8, Font.NORMAL));
            pWeb.setAlignment(Element.ALIGN_CENTER);
            cFooter.addElement(pWeb);
        }

        footer.addCell(cFooter);

        PdfPCell footerWrapper = new PdfPCell(footer);
        footerWrapper.setPadding(0);
        footerWrapper.setBorder(Rectangle.NO_BORDER);
        mainTable.addCell(footerWrapper);

        document.add(mainTable);
    }

    // Helper to draw grid rows with consistent borders
    private void addGridRow(PdfPTable table, String label, String value, Font fLabel, Font fVal) {
        // Label Cell (Left)
        PdfPCell l = new PdfPCell(new Phrase(label, fLabel));
        l.setVerticalAlignment(Element.ALIGN_MIDDLE);
        l.setPadding(6);
        l.setBorder(Rectangle.BOTTOM | Rectangle.RIGHT); // Right border to separate Label/Value
        table.addCell(l);

        // Value Cell (Right)
        PdfPCell v = new PdfPCell(new Phrase(value, fVal));
        v.setVerticalAlignment(Element.ALIGN_MIDDLE);
        v.setHorizontalAlignment(Element.ALIGN_CENTER);
        v.setPadding(6);
        v.setBorder(Rectangle.BOTTOM);
        table.addCell(v);
    }
    // ==========================================
    //           INVOICE LAYOUT BUILDER
    // ==========================================

    private void buildCleanPage(Document doc, PdfWriter writer, Invoice inv, CompanyProfile prof, BaseFont bf, String copyLabel) throws DocumentException {
        // Define Fonts
        Font fTitle = new Font(bf, 16, Font.BOLD, COL_ACCENT);
        Font fCompName = new Font(bf, 15, Font.BOLD, COL_TEXT_MAIN);
        Font fHeader = new Font(bf, 10, Font.BOLD, COL_HEADER_TXT);
        Font fLabel = new Font(bf, 9, Font.NORMAL, COL_TEXT_SEC);
        Font fVal = new Font(bf, 10, Font.BOLD, COL_TEXT_MAIN);
        Font fBody = new Font(bf, 10, Font.NORMAL, COL_TEXT_MAIN);

        // --- 1. Header Section ---
        // Right Side: Company Logo & Details | Left Side: Invoice Meta Data
        PdfPTable headerTbl = new PdfPTable(2);
        headerTbl.setWidthPercentage(100);
        headerTbl.setWidths(new float[]{1.5f, 1f});
        headerTbl.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        // >> Right Cell (Company)
        PdfPCell cComp = new PdfPCell();
        cComp.setBorder(Rectangle.NO_BORDER);

        // Logo - load from database (base64)
        try {
            byte[] logoBytes = companyProfileService.getLogoBytes();
            if (logoBytes != null && logoBytes.length > 0) {
                Image img = Image.getInstance(logoBytes);
                img.scaleToFit(130, 65);
                // In RTL, ALIGN_LEFT aligns to the visual Right (Start of line)
                img.setAlignment(Element.ALIGN_LEFT);
                cComp.addElement(img);
                log.debug("Logo loaded from database, size: {} bytes", logoBytes.length);
            }
        } catch (Exception e) {
            log.debug("Could not load logo: {}", e.getMessage());
        }

        // Company Name
        Paragraph pName = new Paragraph(prof.getCompanyName(), fCompName);
        pName.setAlignment(Element.ALIGN_LEFT); // Visual Right
        cComp.addElement(pName);

        // Address / Phone
        if (prof.getPhone() != null) {
            Paragraph pPh = new Paragraph(prof.getPhone(), fLabel);
            pPh.setAlignment(Element.ALIGN_LEFT); // Visual Right
            cComp.addElement(pPh);
        }
        headerTbl.addCell(cComp);

        // >> Left Cell (Invoice Meta)
        PdfPCell cMeta = new PdfPCell();
        cMeta.setBorder(Rectangle.NO_BORDER);

        Paragraph pInvTitle = new Paragraph("فاتورة مبيعات", fTitle);
        pInvTitle.setAlignment(Element.ALIGN_RIGHT); // Visual Left (End of line)
        cMeta.addElement(pInvTitle);

        PdfPTable metaInner = new PdfPTable(2);
        metaInner.setWidthPercentage(100);
        metaInner.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        // Meta Rows (Label on visual right, Value on visual left)
        addMetaRow(metaInner, "رقم الفاتورة", "#" + inv.getId(), fLabel, fVal);
        addMetaRow(metaInner, "التاريخ", inv.getIssueDate().format(DATE_FMT), fLabel, fVal);
        addMetaRow(metaInner, "نسخة", copyLabel, fLabel, fBody);

        cMeta.addElement(metaInner);
        headerTbl.addCell(cMeta);

        doc.add(headerTbl);
        addSpacer(doc, 20);

        // --- 2. Customer Section (Gray Box) ---
        PdfPTable boxTbl = new PdfPTable(1);
        boxTbl.setWidthPercentage(100);
        boxTbl.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        PdfPCell boxCell = new PdfPCell();
        boxCell.setBackgroundColor(COL_BOX_BG);
        boxCell.setBorderColor(COL_BORDER);
        boxCell.setPadding(12);

        // Inner table to align Label and Value strictly next to each other
        PdfPTable clientInner = new PdfPTable(2);
        clientInner.setWidthPercentage(100);
        clientInner.setWidths(new float[]{1f, 3f}); // Label col small, Value col wide
        clientInner.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        // Name
        addClientRow(clientInner, "العميل:", inv.getCustomer().getName(), fLabel, new Font(bf, 12, Font.BOLD, COL_TEXT_MAIN));
        // Phone
        if (inv.getCustomer().getPhone() != null) {
            addClientRow(clientInner, "الهاتف:", inv.getCustomer().getPhone(), fLabel, fBody);
        }

        boxCell.addElement(clientInner);
        boxTbl.addCell(boxCell);
        doc.add(boxTbl);

        addSpacer(doc, 20);

        // --- 3. Items Table ---
        PdfPTable tbl = new PdfPTable(5);
        tbl.setWidthPercentage(100);
        tbl.setWidths(new float[]{3.5f, 1.2f, 0.8f, 1.5f, 1.2f}); // Wide Description column
        tbl.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        // Headers
        addHeaderCell(tbl, "الوصف", fHeader, Element.ALIGN_LEFT); // Align Visual Right
        addHeaderCell(tbl, "المقاس", fHeader, Element.ALIGN_CENTER);
        addHeaderCell(tbl, "العدد", fHeader, Element.ALIGN_CENTER);
        addHeaderCell(tbl, "تفاصيل السعر", fHeader, Element.ALIGN_CENTER);
        addHeaderCell(tbl, "الإجمالي", fHeader, Element.ALIGN_CENTER);

        // Small fonts for breakdown
        Font fSmall = new Font(bf, 8, Font.NORMAL, COL_TEXT_SEC);
        Font fSmallBold = new Font(bf, 8, Font.BOLD, COL_TEXT_MAIN);

        // Rows
        for (InvoiceLine line : inv.getInvoiceLines()) {
            // Desc (Align Visual Right)
            PdfPCell cDesc = new PdfPCell();
            cDesc.setPaddingTop(8); cDesc.setPaddingBottom(8);
            cDesc.setBorder(Rectangle.BOTTOM);
            cDesc.setBorderColor(COL_BORDER);
            cDesc.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

            String mainTxt = (line.getGlassType() != null ? line.getGlassType().getName() : "زجاج");
            if(line.getGlassType() != null && line.getGlassType().getThickness() != null) {
                mainTxt += " " + line.getGlassType().getThickness() + "مم";
            }

            Paragraph pMain = new Paragraph(mainTxt, fVal);
            pMain.setAlignment(Element.ALIGN_LEFT); // Visual Right
            cDesc.addElement(pMain);

            // Glass price per m² info
            if(line.getGlassType() != null && line.getGlassType().getPricePerMeter() != null) {
                String priceInfo = "سعر المتر: " + fmtMoney(line.getGlassType().getPricePerMeter()) + " ج.م/م²";
                Paragraph pPrice = new Paragraph(priceInfo, fSmall);
                pPrice.setAlignment(Element.ALIGN_LEFT);
                cDesc.addElement(pPrice);
            }

            // Operations Sub-text
            if(line.getOperations() != null && !line.getOperations().isEmpty()) {
                List<String> ops = new ArrayList<>();
                line.getOperations().forEach(o -> ops.add(o.getDescription()));
                Paragraph pOps = new Paragraph("العمليات: " + String.join(" + ", ops), new Font(bf, 8, Font.NORMAL, COL_TEXT_SEC));
                pOps.setAlignment(Element.ALIGN_LEFT); // Visual Right
                cDesc.addElement(pOps);
            }
            tbl.addCell(cDesc);

            // Dims with area
            PdfPCell cDims = new PdfPCell();
            cDims.setPaddingTop(8); cDims.setPaddingBottom(8);
            cDims.setHorizontalAlignment(Element.ALIGN_CENTER);
            cDims.setBorder(Rectangle.BOTTOM);
            cDims.setBorderColor(COL_BORDER);
            cDims.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

            String dims = String.format("%.0f × %.0f سم", line.getWidth(), line.getHeight());
            Paragraph pDims = new Paragraph(dims, fBody);
            pDims.setAlignment(Element.ALIGN_CENTER);
            cDims.addElement(pDims);

            // Show area in m²
            if(line.getAreaM2() != null && line.getAreaM2() > 0) {
                String areaStr = String.format("%.3f م²", line.getAreaM2());
                Paragraph pArea = new Paragraph(areaStr, fSmall);
                pArea.setAlignment(Element.ALIGN_CENTER);
                cDims.addElement(pArea);
            }
            tbl.addCell(cDims);

            // Qty
            addBodyCell(tbl, String.valueOf(line.getQuantity()), fBody);

            // Price Breakdown Cell
            PdfPCell cBreakdown = new PdfPCell();
            cBreakdown.setPaddingTop(6); cBreakdown.setPaddingBottom(6);
            cBreakdown.setPaddingLeft(4); cBreakdown.setPaddingRight(4);
            cBreakdown.setBorder(Rectangle.BOTTOM);
            cBreakdown.setBorderColor(COL_BORDER);
            cBreakdown.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

            // Glass price breakdown
            Double glassPrice = line.getGlassPrice() != null ? line.getGlassPrice() : 0.0;
            Paragraph pGlass = new Paragraph("الزجاج: " + fmtMoney(glassPrice), fSmall);
            pGlass.setAlignment(Element.ALIGN_LEFT);
            cBreakdown.addElement(pGlass);

            // Operations breakdown
            if(line.getOperations() != null && !line.getOperations().isEmpty()) {
                for(InvoiceLineOperation op : line.getOperations()) {
                    String opName = op.getOperationType() != null ? op.getOperationType().getArabicName() : "عملية";
                    Double opPrice = op.getOperationPrice() != null ? op.getOperationPrice() : 0.0;
                    Paragraph pOp = new Paragraph(opName + ": " + fmtMoney(opPrice), fSmall);
                    pOp.setAlignment(Element.ALIGN_LEFT);
                    cBreakdown.addElement(pOp);
                }
            }

            // Unit total (per piece)
            int qty = line.getQuantity() != null && line.getQuantity() > 0 ? line.getQuantity() : 1;
            double unitPrice = line.getLineTotal() / qty;
            Paragraph pUnit = new Paragraph("سعر القطعة: " + fmtMoney(unitPrice), fSmallBold);
            pUnit.setAlignment(Element.ALIGN_LEFT);
            pUnit.setSpacingBefore(3);
            cBreakdown.addElement(pUnit);

            tbl.addCell(cBreakdown);

            // Line Total
            addBodyCell(tbl, fmtMoney(line.getLineTotal()), fVal);
        }
        doc.add(tbl);
        addSpacer(doc, 10);

        // --- 4. Footer Section (Totals & Notes) ---
        PdfPTable footerTbl = new PdfPTable(2);
        footerTbl.setWidthPercentage(100);
        footerTbl.setWidths(new float[]{1.5f, 1f}); // Left (Totals) narrower
        footerTbl.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        // Right Side: Notes
        PdfPCell cNotes = new PdfPCell();
        cNotes.setBorder(Rectangle.NO_BORDER);
        if(StringUtils.hasText(inv.getNotes())) {
            Paragraph pNoteLbl = new Paragraph("ملاحظات:", fLabel);
            pNoteLbl.setAlignment(Element.ALIGN_LEFT);
            cNotes.addElement(pNoteLbl);

            Paragraph pNoteVal = new Paragraph(inv.getNotes(), fBody);
            pNoteVal.setAlignment(Element.ALIGN_LEFT);
            cNotes.addElement(pNoteVal);
        }
        footerTbl.addCell(cNotes);

        // Left Side: Totals
        PdfPCell cTot = new PdfPCell();
        cTot.setBorder(Rectangle.NO_BORDER);

        PdfPTable totInner = new PdfPTable(2);
        totInner.setWidthPercentage(100);
        totInner.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        addTotalRow(totInner, "الإجمالي", inv.getTotalPrice(), fLabel, fVal, false);
        if(inv.getAmountPaidNow() != null && inv.getAmountPaidNow() > 0) {
            addTotalRow(totInner, "المدفوع", inv.getAmountPaidNow(), fLabel, fVal, false);
        }

        // Grand Total (Big Blue)
        double rem = inv.getRemainingBalance() != null ? inv.getRemainingBalance() : 0;
        addTotalRow(totInner, "المتبقي", rem, fLabel, new Font(bf, 14, Font.BOLD, COL_ACCENT), true);

        cTot.addElement(totInner);
        footerTbl.addCell(cTot);

        doc.add(footerTbl);

        // --- 5. Page Footer (Fixed at Bottom) ---
        addPageFooter(doc, writer, bf, prof);
    }

    // ==========================================
    //           STICKER BUILDER
    // ==========================================

    private void buildStickerPage(Document document, Invoice invoice, InvoiceLine line, CompanyProfile profile,
                                  Font fTitle, Font fLabel, Font fValue, Font fBigVal) throws DocumentException {

        PdfPTable main = new PdfPTable(1);
        main.setWidthPercentage(100);
        main.getDefaultCell().setBorder(Rectangle.NO_BORDER);

        // Header
        PdfPCell header = new PdfPCell();
        header.setBorder(Rectangle.NO_BORDER);
        header.setHorizontalAlignment(Element.ALIGN_CENTER);
        header.setPaddingBottom(5);
        Paragraph comp = new Paragraph(profile.getCompanyName() != null ? profile.getCompanyName() : "GLASS CO", fTitle);
        comp.setAlignment(Element.ALIGN_CENTER);
        header.addElement(comp);
        main.addCell(header);

        // Box
        PdfPTable box = new PdfPTable(2);
        box.setWidthPercentage(100);
        box.setWidths(new float[]{1f, 1.5f});

        addStickerRow(box, "Customer", invoice.getCustomer().getName(), fLabel, fValue);

        String glass = (line.getGlassType() != null ? line.getGlassType().getName() : "-");
        addStickerRow(box, "Type", glass, fLabel, fValue);

        String thk = (line.getGlassType() != null && line.getGlassType().getThickness() != null)
                ? line.getGlassType().getThickness() + " mm" : "-";
        addStickerRow(box, "Thk", thk, fLabel, fValue);

        String size = String.format("%.0f x %.0f", line.getWidth(), line.getHeight());
        addStickerRow(box, "Size", size, fLabel, fBigVal);

        if (line.getOperations() != null && !line.getOperations().isEmpty()) {
            StringBuilder ops = new StringBuilder();
            line.getOperations().forEach(o -> ops.append(o.getDescription()).append(" "));
            addStickerRow(box, "Ops", ops.toString(), fLabel, new Font(fValue.getBaseFont(), 9, Font.NORMAL));
        }

        // Footer Ref
        PdfPCell ref = new PdfPCell(new Phrase("Inv #" + invoice.getId(), fLabel));
        ref.setColspan(2);
        ref.setHorizontalAlignment(Element.ALIGN_CENTER);
        ref.setBorder(Rectangle.TOP);
        ref.setBorderColor(BaseColor.LIGHT_GRAY);
        ref.setPaddingTop(5);
        box.addCell(ref);

        PdfPCell boxWrapper = new PdfPCell(box);
        boxWrapper.setBorder(Rectangle.BOX);
        boxWrapper.setBorderWidth(1.5f);
        boxWrapper.setPadding(5);
        main.addCell(boxWrapper);

        document.add(main);
    }

    // ==========================================
    //           HELPER METHODS
    // ==========================================

    private void addClientRow(PdfPTable t, String lbl, String val, Font fLbl, Font fVal) {
        PdfPCell c1 = new PdfPCell(new Phrase(lbl, fLbl));
        c1.setBorder(Rectangle.NO_BORDER);
        c1.setHorizontalAlignment(Element.ALIGN_LEFT); // Visual Right
        t.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(val, fVal));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setHorizontalAlignment(Element.ALIGN_LEFT); // Visual Right (Immediately follows label)
        t.addCell(c2);
    }

    private void addMetaRow(PdfPTable t, String lbl, String val, Font fLbl, Font fVal) {
        PdfPCell c1 = new PdfPCell(new Phrase(lbl, fLbl));
        c1.setBorder(Rectangle.NO_BORDER);
        c1.setHorizontalAlignment(Element.ALIGN_LEFT); // Visual Right
        t.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(val, fVal));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT); // Visual Left (End of line)
        t.addCell(c2);
    }

    private void addHeaderCell(PdfPTable t, String txt, Font f, int align) {
        PdfPCell c = new PdfPCell(new Phrase(txt, f));
        c.setBackgroundColor(COL_HEADER_BG);
        c.setPadding(8);
        c.setHorizontalAlignment(align);
        c.setBorder(Rectangle.NO_BORDER);
        c.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);
        t.addCell(c);
    }

    private void addBodyCell(PdfPTable t, String txt, Font f) {
        PdfPCell c = new PdfPCell(new Phrase(txt, f));
        c.setPaddingTop(8); c.setPaddingBottom(8);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(COL_BORDER);
        c.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);
        t.addCell(c);
    }

    private void addTotalRow(PdfPTable t, String lbl, Double val, Font fLbl, Font fVal, boolean lineTop) {
        PdfPCell c1 = new PdfPCell(new Phrase(lbl, fLbl));
        c1.setBorder(lineTop ? Rectangle.TOP : Rectangle.NO_BORDER);
        c1.setBorderColor(COL_BORDER);
        c1.setPadding(6);
        c1.setHorizontalAlignment(Element.ALIGN_LEFT); // Visual Right
        t.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(fmtMoney(val), fVal));
        c2.setBorder(lineTop ? Rectangle.TOP : Rectangle.NO_BORDER);
        c2.setBorderColor(COL_BORDER);
        c2.setPadding(6);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT); // Visual Left
        t.addCell(c2);
    }

    private void addStickerRow(PdfPTable table, String label, String value, Font fLabel, Font fValue) {
        PdfPCell l = new PdfPCell(new Phrase(label, fLabel));
        l.setBorder(Rectangle.NO_BORDER);
        table.addCell(l);

        PdfPCell v = new PdfPCell(new Phrase(value, fValue));
        v.setBorder(Rectangle.NO_BORDER);
        table.addCell(v);
    }

    private void addPageFooter(Document doc, PdfWriter writer, BaseFont bf, CompanyProfile p) throws DocumentException {
        PdfPTable ft = new PdfPTable(1);
        ft.setTotalWidth(530);
        ft.setLockedWidth(true);
        ft.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);

        String txt = p.getFooterText() != null ? p.getFooterText() : "شكراً لتعاملكم معنا";
        PdfPCell c = new PdfPCell(new Phrase(txt, new Font(bf, 8, Font.NORMAL, COL_TEXT_SEC)));
        c.setBorder(Rectangle.TOP);
        c.setBorderColor(COL_BORDER);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setPaddingTop(10);
        ft.addCell(c);

        // Write at absolute position: x=30, y=40 (from bottom)
        ft.writeSelectedRows(0, -1, 30, 40, writer.getDirectContent());
    }

    private void addSpacer(Document d, float s) throws DocumentException {
        Paragraph p = new Paragraph("");
        p.setSpacingAfter(s);
        d.add(p);
    }

    private String fmtMoney(Double v) {
        return v == null ? "0.00" : String.format("%.2f", v);
    }

    private BaseFont getArabicFont() throws IOException, DocumentException {
        // 1. Try Assets
        try {
            String path = Paths.get(assetsPath, "fonts", "NotoSansArabic-Regular.ttf").toString();
            if (Files.exists(Paths.get(path))) return BaseFont.createFont(path, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
        } catch(Exception ignored) {}

        // 2. Try System
        String[] sysFonts = {
                "C:/Windows/Fonts/arial.ttf",
                "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
        };
        for(String s : sysFonts) {
            try { return BaseFont.createFont(s, BaseFont.IDENTITY_H, BaseFont.EMBEDDED); } catch(Exception ignored){}
        }

        // 3. Fallback (Arabic will not render, but avoids crash)
        return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
    }
}