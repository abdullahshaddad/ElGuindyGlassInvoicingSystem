package com.example.backend.dto;

import com.example.backend.models.PrintJob;
import com.example.backend.models.enums.PrintType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO لحالة مهام الطباعة الخاصة بفاتورة معينة
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrintJobStatusDTO {
    
    private Long invoiceId;
    private int totalJobs;
    private int successfulJobs;
    private int failedJobs;
    private boolean allJobsComplete;
    private List<String> missingJobTypes;
    private List<PrintJobDetailDTO> jobs;
    private String message;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrintJobDetailDTO {
        private Long id;
        private String type;
        private String typeName;
        private String status;
        private String statusName;
        private String pdfPath;
        private String errorMessage;
        private String createdAt;
        private String printedAt;
        
        public static PrintJobDetailDTO fromEntity(PrintJob job) {
            return PrintJobDetailDTO.builder()
                    .id(job.getId())
                    .type(job.getType().name())
                    .typeName(job.getType().getArabicName())
                    .status(job.getStatus().name())
                    .statusName(job.getStatus().getArabicName())
                    .pdfPath(job.getPdfPath())
                    .errorMessage(job.getErrorMessage())
                    .createdAt(job.getCreatedAt() != null ? job.getCreatedAt().toString() : null)
                    .printedAt(job.getPrintedAt() != null ? job.getPrintedAt().toString() : null)
                    .build();
        }
    }
    
    public static PrintJobStatusDTO fromPrintJobs(Long invoiceId, List<PrintJob> printJobs) {
        int expectedJobs = 3;
        
        long successful = printJobs.stream()
                .filter(job -> !job.getStatus().name().equals("FAILED"))
                .count();
        
        long failed = printJobs.stream()
                .filter(job -> job.getStatus().name().equals("FAILED"))
                .count();
        
        List<String> existingTypes = printJobs.stream()
                .map(job -> job.getType().name())
                .collect(Collectors.toList());
        
        List<String> missingTypes = List.of("CLIENT", "OWNER", "STICKER").stream()
                .filter(type -> !existingTypes.contains(type))
                .collect(Collectors.toList());
        
        List<PrintJobDetailDTO> jobDetails = printJobs.stream()
                .map(PrintJobDetailDTO::fromEntity)
                .collect(Collectors.toList());
        
        String message;
        if (successful == expectedJobs && missingTypes.isEmpty()) {
            message = "تم إنشاء جميع مهام الطباعة بنجاح";
        } else if (successful > 0) {
            message = String.format("تم إنشاء %d من %d مهام طباعة", successful, expectedJobs);
        } else {
            message = "فشل في إنشاء جميع مهام الطباعة";
        }
        
        return PrintJobStatusDTO.builder()
                .invoiceId(invoiceId)
                .totalJobs(expectedJobs)
                .successfulJobs((int) successful)
                .failedJobs((int) failed)
                .allJobsComplete(printJobs.size() == expectedJobs && missingTypes.isEmpty() && failed == 0)
                .missingJobTypes(missingTypes)
                .jobs(jobDetails)
                .message(message)
                .build();
    }
}