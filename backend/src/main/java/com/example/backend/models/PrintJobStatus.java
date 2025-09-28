// backend/src/main/java/com/example/backend/models/PrintJobStatus.java
package com.example.backend.models;

import com.example.backend.models.enums.PrintType;
import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrintJobStatus {
    private Long invoiceId;
    private int totalJobs;
    private int expectedJobs;
    private boolean allJobsComplete;
    private List<PrintType> missingJobTypes;
    private List<PrintJob> existingJobs;
    private String error;
}