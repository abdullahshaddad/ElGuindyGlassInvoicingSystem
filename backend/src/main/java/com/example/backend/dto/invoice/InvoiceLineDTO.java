package com.example.backend.dto.invoice;

import com.example.backend.dto.GlassTypeDTO;
import com.example.backend.models.InvoiceLine;
import com.example.backend.models.enums.CuttingType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class InvoiceLineDTO {
    private Long id;
    private Double width;
    private Double height;
    private String dimensionUnit;
    private Double areaM2;
    private Double lengthM;
    private CuttingType cuttingType;
    private Double cuttingPrice;
    private Double lineTotal;
    private GlassTypeDTO glassType;
    private java.util.List<InvoiceLineOperationDTO> operations;

    public static InvoiceLineDTO from(InvoiceLine line) {
        if (line == null)
            return null;

        return InvoiceLineDTO.builder()
                .id(line.getId())
                .width(line.getWidth())
                .height(line.getHeight())
                .dimensionUnit(line.getDimensionUnit().toString())
                .areaM2(line.getAreaM2())
                .lengthM(line.getLengthM())
                .cuttingType(line.getCuttingType())
                .cuttingPrice(line.getCuttingPrice())
                .lineTotal(line.getLineTotal())
                .glassType(GlassTypeDTO.from(line.getGlassType()))
                .operations(line.getOperations() != null ? line.getOperations().stream()
                        .map(InvoiceLineOperationDTO::from)
                        .collect(java.util.stream.Collectors.toList())
                        : java.util.List.of())
                .build();
    }
}