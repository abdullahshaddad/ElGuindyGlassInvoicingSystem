package com.example.backend.models.enums;

public enum InvoiceStatus {
    PENDING("معلق"),
    PAID("مدفوع"),
    PARTIALLY_PAID("مدفوع جزئياً"),
    CANCELLED("ملغي");

    private final String arabicName;

    InvoiceStatus(String arabicName) {
        this.arabicName = arabicName;
    }

    public String getArabicName() {
        return arabicName;
    }
}