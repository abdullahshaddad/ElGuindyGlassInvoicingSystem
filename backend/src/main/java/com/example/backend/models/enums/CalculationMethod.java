package com.example.backend.models.enums;

public enum CalculationMethod {
      AREA("مساحة"),      // Standard area calculation (width × height)
      LENGTH("طول");      // Length-based calculation (for special glass types)
  
              private final String arabicName;
  
              CalculationMethod(String arabicName) {
                  this.arabicName = arabicName;
              }
  
              public String getArabicName() {
                  return arabicName;
              }
  }