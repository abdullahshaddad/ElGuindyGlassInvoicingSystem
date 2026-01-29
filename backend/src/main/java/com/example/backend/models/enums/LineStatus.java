package com.example.backend.models.enums;

public enum LineStatus {
    PENDING("معلق"),
    IN_PROGRESS("قيد التنفيذ"),
    COMPLETED("مكتمل"),
    CANCELLED("ملغي");

    private final String arabicName;

    LineStatus(String arabicName) {
        this.arabicName = arabicName;
    }

    public String getArabicName() {
        return arabicName;
    }
}
