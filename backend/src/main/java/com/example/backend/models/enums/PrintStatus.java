package com.example.backend.models.enums;

import lombok.Getter;

@Getter
public enum PrintStatus {
    QUEUED("في الانتظار"),
    PRINTING("يطبع"),
    PRINTED("مطبوع"),
    FAILED("فشل");

    private final String arabicName;

    PrintStatus(String arabicName) {
        this.arabicName = arabicName;
    }

}
