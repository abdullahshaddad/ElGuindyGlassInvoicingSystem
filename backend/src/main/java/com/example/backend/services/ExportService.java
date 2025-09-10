package com.example.backend.services;

import com.example.backend.models.Invoice;
import com.example.backend.models.InvoiceLine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExportService {

    private final InvoiceService invoiceService;
    private static final DateTimeFormatter CSV_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired
    public ExportService(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    public byte[] exportInvoicesToCsv(LocalDateTime startDate, LocalDateTime endDate) {
        try {
            Page<Invoice> invoicesPage = invoiceService.findInvoicesByDateRange(startDate, endDate,
                    Pageable.unpaged());
            List<Invoice> invoices = invoicesPage.getContent();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            OutputStreamWriter writer = new OutputStreamWriter(baos, StandardCharsets.UTF_8);

            // Write BOM for Excel Arabic support
            writer.write('\ufeff');

            // CSV Headers in Arabic
            writer.write("رقم الفاتورة,العميل,الهاتف,تاريخ الإصدار,تاريخ الدفع,الإجمالي,الحالة,عدد الأصناف\n");

            for (Invoice invoice : invoices) {
                writer.write(String.format("%d,%s,%s,%s,%s,%.2f,%s,%d\n",
                        invoice.getId(),
                        escapeCommas(invoice.getCustomer().getName()),
                        escapeCommas(invoice.getCustomer().getPhone()),
                        invoice.getIssueDate().format(CSV_DATE_FORMAT),
                        invoice.getPaymentDate() != null ? invoice.getPaymentDate().format(CSV_DATE_FORMAT) : "",
                        invoice.getTotalPrice(),
                        invoice.getStatus().getArabicName(),
                        invoice.getInvoiceLines() != null ? invoice.getInvoiceLines().size() : 0
                ));
            }

            writer.flush();
            writer.close();

            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generating CSV export: " + e.getMessage(), e);
        }
    }

    public byte[] exportDetailedInvoicesToCsv(LocalDateTime startDate, LocalDateTime endDate) {
        try {
            Page<Invoice> invoicesPage = invoiceService.findInvoicesByDateRange(startDate, endDate,
                    Pageable.unpaged());
            List<Invoice> invoices = invoicesPage.getContent();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            OutputStreamWriter writer = new OutputStreamWriter(baos, StandardCharsets.UTF_8);

            // Write BOM for Excel Arabic support
            writer.write('\ufeff');

            // Detailed CSV Headers
            writer.write("رقم الفاتورة,العميل,الهاتف,تاريخ الإصدار,نوع الزجاج,السماكة,اللون,العرض,الارتفاع,المساحة,نوع القص,سعر المتر,سعر القص,إجمالي الصنف,حالة الفاتورة\n");

            for (Invoice invoice : invoices) {
                if (invoice.getInvoiceLines() != null) {
                    for (InvoiceLine line : invoice.getInvoiceLines()) {
                        double glassPrice = line.getAreaM2() * line.getGlassType().getPricePerMeter();

                        writer.write(String.format("%d,%s,%s,%s,%s,%.1f,%s,%.2f,%.2f,%.2f,%s,%.2f,%.2f,%.2f,%s\n",
                                invoice.getId(),
                                escapeCommas(invoice.getCustomer().getName()),
                                escapeCommas(invoice.getCustomer().getPhone()),
                                invoice.getIssueDate().format(CSV_DATE_FORMAT),
                                escapeCommas(line.getGlassType().getName()),
                                line.getGlassType().getThickness(),
                                escapeCommas(line.getGlassType().getColor()),
                                line.getWidth(),
                                line.getHeight(),
                                line.getAreaM2(),
                                line.getCuttingType().getArabicName(),
                                line.getGlassType().getPricePerMeter(),
                                line.getCuttingPrice(),
                                line.getLineTotal(),
                                invoice.getStatus().getArabicName()
                        ));
                    }
                }
            }

            writer.flush();
            writer.close();

            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generating detailed CSV export: " + e.getMessage(), e);
        }
    }

    public byte[] exportCustomersTosCsv() {
        try {
            // This would use CustomerService to get all customers
            // Implementation depends on requirements

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            OutputStreamWriter writer = new OutputStreamWriter(baos, StandardCharsets.UTF_8);

            writer.write('\ufeff');
            writer.write("الاسم,الهاتف,العنوان,تاريخ الإنشاء,عدد الفواتير\n");

            // Add customer export logic here

            writer.flush();
            writer.close();

            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generating customers CSV export: " + e.getMessage(), e);
        }
    }

    private String escapeCommas(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
