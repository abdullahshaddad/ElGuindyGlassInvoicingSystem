package com.example.backend.models.enums;

public enum PrintType {
    CLIENT("عميل"),
    OWNER("مالك"),
    STICKER("ملصق");

    private final String arabicName;

    PrintType(String arabicName) {
        this.arabicName = arabicName;
    }

    public String getArabicName() {
        return arabicName;
    }
}
