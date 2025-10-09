package com.example.backend.dto;

import com.example.backend.models.PrintJob;
import com.example.backend.models.enums.PrintStatus;
import com.example.backend.models.enums.PrintType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for PrintJob responses
 * Avoids Hibernate lazy loading serialization issues
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrintJobDTO {

    private Long id;
    private Long invoiceId;
    private String invoiceNumber; // e.g., "INV-000025"
    private String customerName;
    private PrintType type;
    private PrintStatus status;
    private String pdfPath;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime printedAt;

    /**
     * Convert PrintJob entity to DTO
     */
    public static PrintJobDTO fromEntity(PrintJob printJob) {
        if (printJob == null) {
            return null;
        }

        PrintJobDTOBuilder builder = PrintJobDTO.builder()
                .id(printJob.getId())
                .type(printJob.getType())
                .status(printJob.getStatus())
                .pdfPath(printJob.getPdfPath())
                .errorMessage(printJob.getErrorMessage())
                .createdAt(printJob.getCreatedAt())
                .printedAt(printJob.getPrintedAt());

        // Safely extract invoice information
        if (printJob.getInvoice() != null) {
            builder.invoiceId(printJob.getInvoice().getId());
            builder.invoiceNumber(String.format("INV-%06d", printJob.getInvoice().getId()));

            // Safely extract customer information
            if (printJob.getInvoice().getCustomer() != null) {
                builder.customerName(printJob.getInvoice().getCustomer().getName());
            }
        }

        return builder.build();
    }

    /**
     * Get status text in Arabic
     */
    public String getStatusTextArabic() {
        if (status == null) return "";
        return switch (status) {
            case QUEUED -> "في الانتظار";
            case PRINTING -> "قيد الطباعة";
            case PRINTED -> "مطبوع";
            case FAILED -> "فشل";
        };
    }

    /**
     * Get type text in Arabic
     */
    public String getTypeTextArabic() {
        if (type == null) return "";
        return switch (type) {
            case CLIENT -> "نسخة العميل";
            case OWNER -> "نسخة المالك";
            case STICKER -> "ملصق المصنع";
        };
    }
}