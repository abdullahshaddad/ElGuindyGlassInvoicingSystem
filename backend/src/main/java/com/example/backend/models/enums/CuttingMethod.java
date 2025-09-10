package com.example.backend.models.enums;

public enum CuttingMethod {
    SHATF("شطف"),
    LASER("ليزر");

    private final String arabicName;

    CuttingMethod(String arabicName) {
        this.arabicName = arabicName;
    }

    public String getArabicName() {
        return arabicName;
    }
}
