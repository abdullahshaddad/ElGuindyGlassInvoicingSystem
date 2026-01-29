package com.example.backend.models.enums;

/**
 * Work/Factory status for Invoice - separate from payment status (InvoiceStatus)
 */
public enum WorkStatus {
    PENDING("معلق"),           // No work started yet
    IN_PROGRESS("قيد التنفيذ"), // At least one line is in progress
    COMPLETED("مكتمل"),        // All lines completed
    CANCELLED("ملغي");          // Invoice cancelled

    private final String arabicName;

    WorkStatus(String arabicName) {
        this.arabicName = arabicName;
    }

    public String getArabicName() {
        return arabicName;
    }
}
