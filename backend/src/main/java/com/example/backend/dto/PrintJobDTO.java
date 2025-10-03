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
 * DTO for PrintJob to avoid Hibernate lazy loading serialization issues
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrintJobDTO {
    private Long id;
    private Long invoiceId;
    private PrintType type;
    private PrintStatus status;
    private String pdfPath;
    private LocalDateTime createdAt;
    private LocalDateTime printedAt;
    private String errorMessage;

    /**
     * Convert PrintJob entity to DTO
     */
    public static PrintJobDTO fromEntity(PrintJob printJob) {
        if (printJob == null) {
            return null;
        }

        return PrintJobDTO.builder()
                .id(printJob.getId())
                .invoiceId(printJob.getInvoice() != null ? printJob.getInvoice().getId() : null)
                .type(printJob.getType())
                .status(printJob.getStatus())
                .pdfPath(printJob.getPdfPath())
                .createdAt(printJob.getCreatedAt())
                .printedAt(printJob.getPrintedAt())
                .errorMessage(printJob.getErrorMessage())
                .build();
    }
}