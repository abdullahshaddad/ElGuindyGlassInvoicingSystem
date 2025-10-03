package com.example.backend.models.enums;

public enum DimensionUnit {
    MM("مليمتر", 0.001),    // millimeters
    CM("سنتيمتر", 0.01),     // centimeters
    M("متر", 1.0);           // meters
    
    private final String arabicName;
    private final double conversionToMeters;
    
    DimensionUnit(String arabicName, double conversionToMeters) {
        this.arabicName = arabicName;
        this.conversionToMeters = conversionToMeters;
    }
    
    public String getArabicName() {
        return arabicName;
    }
    
    public double toMeters(double value) {
        return value * conversionToMeters;
    }
    
    public double fromMeters(double valueInMeters) {
        return valueInMeters / conversionToMeters;
    }
}