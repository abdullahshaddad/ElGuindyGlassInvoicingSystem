package com.example.backend.models.enums;

public enum CuttingType {
    SHATF("شطف"),
    LASER("ليزر");

    private final String arabicName;

    CuttingType(String arabicName) {
        this.arabicName = arabicName;
    }

    public String getArabicName() {
        return arabicName;
    }
}
