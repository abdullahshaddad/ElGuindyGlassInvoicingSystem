package com.example.backend.dto;

import com.example.backend.models.enums.ShatafType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// في ShatafRateDTO.java أضف:
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShatafTypeInfo {
    private String value;
    private String arabicName;
    private Boolean isFormulaBased;
    private Boolean isManualInput;
    private Boolean isAreaBased;
    private Boolean requiresThicknessRate;
    private Boolean requiresManualPrice;

    public static ShatafTypeInfo from(ShatafType type) {
        return ShatafTypeInfo.builder()
                .value(type.name())
                .arabicName(type.getArabicName())
                .isFormulaBased(type.isFormulaBased())
                .isManualInput(type.isManualInput())
                .isAreaBased(type.isAreaBased())
                .requiresThicknessRate(type.requiresThicknessRate())
                .requiresManualPrice(type.requiresManualPrice())
                .build();
    }
}
