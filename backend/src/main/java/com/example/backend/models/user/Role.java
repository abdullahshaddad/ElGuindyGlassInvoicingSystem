package com.example.backend.models.user;


import lombok.Getter;

@Getter
public enum Role {
    CASHIER("كاشير"),
    OWNER("مالك"),
    WORKER("عامل");

    private final String arabicName;

    Role(String arabicName) {
        this.arabicName = arabicName;
    }

}
