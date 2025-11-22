package com.example.backend.controllers;

import com.example.backend.dto.*;
import com.example.backend.models.ShatafRate;
import com.example.backend.models.enums.ShatafType;
import com.example.backend.services.cutting.ShatafRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller for Shataf Rate management
 */
@RestController
@RequestMapping("/api/shataf-rates")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ShatafRateController {

    private final ShatafRateService shatafRateService;

    /**
     * Get all shataf types with their metadata
     */
    @GetMapping("/types")
    public ResponseEntity<List<ShatafTypeInfo>> getShatafTypes() {
        List<ShatafTypeInfo> types = Arrays.stream(ShatafType.values())
                .map(ShatafTypeInfo::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(types);
    }
    /**
     * Get all active shataf rates
     */
    @GetMapping
    public ResponseEntity<List<ShatafRateDTO>> getAllActiveRates() {
        try {
            List<ShatafRate> rates = shatafRateService.getAllActiveRates();
            List<ShatafRateDTO> dtos = ShatafRateDTO.fromList(rates);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching shataf rates: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get rates by shataf type
     */
    @GetMapping("/type/{shatafType}")
    public ResponseEntity<List<ShatafRateDTO>> getRatesByType(@PathVariable ShatafType shatafType) {
        try {
            if (shatafType.isManualInput()) {
                return ResponseEntity.badRequest().build();
            }

            List<ShatafRate> rates = shatafRateService.getRatesByType(shatafType);
            List<ShatafRateDTO> dtos = ShatafRateDTO.fromList(rates);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching rates for {}: {}", shatafType, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get rate for specific shataf type and thickness
     */
    @GetMapping("/rate")
    public ResponseEntity<Double> getRateForThickness(
            @RequestParam ShatafType shatafType,
            @RequestParam Double thickness) {
        try {
            if (shatafType.isManualInput()) {
                return ResponseEntity.badRequest().build();
            }

            Double rate = shatafRateService.getRateForThickness(shatafType, thickness);
            return ResponseEntity.ok(rate);
        } catch (Exception e) {
            log.error("Error fetching rate for {} at {} mm: {}",
                shatafType, thickness, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Initialize default shataf rates
     */
    @PostMapping("/initialize-defaults")
    public ResponseEntity<List<ShatafRateDTO>> initializeDefaults() {
        try {
            log.info("Initializing default shataf rates");
            List<ShatafRate> rates = shatafRateService.initializeDefaultRates();
            List<ShatafRateDTO> dtos = ShatafRateDTO.fromList(rates);
            return ResponseEntity.status(HttpStatus.CREATED).body(dtos);
        } catch (Exception e) {
            log.error("Error initializing default rates: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Create a new shataf rate
     */
    @PostMapping
    public ResponseEntity<?> createRate(@RequestBody CreateShatafRateRequest request) {
        try {
            ShatafRate rate = request.toEntity();
            ShatafRate created = shatafRateService.createRate(rate);
            ShatafRateDTO dto = ShatafRateDTO.from(created);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalArgumentException e) {
            log.error("Validation error creating rate: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating rate: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "فشل إنشاء السعر"));
        }
    }

    /**
     * Update an existing shataf rate
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRate(
            @PathVariable Long id,
            @RequestBody UpdateShatafRateRequest request) {
        try {
            ShatafRate rate = ShatafRate.builder()
                .shatafType(request.getShatafType())
                .minThickness(request.getMinThickness())
                .maxThickness(request.getMaxThickness())
                .ratePerMeter(request.getRatePerMeter())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

            ShatafRate updated = shatafRateService.updateRate(id, rate);
            ShatafRateDTO dto = ShatafRateDTO.from(updated);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            log.error("Validation error updating rate {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating rate {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "فشل تحديث السعر"));
        }
    }

    /**
     * Delete a shataf rate
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRate(@PathVariable Long id) {
        try {
            shatafRateService.deleteRate(id);
            return ResponseEntity.ok(Map.of("message", "تم حذف السعر بنجاح"));
        } catch (Exception e) {
            log.error("Error deleting rate {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "فشل حذف السعر"));
        }
    }

    /**
     * Bulk update rates for a shataf type across thickness ranges
     */
    @PostMapping("/bulk-update")
    public ResponseEntity<?> bulkUpdateRates(@RequestBody BulkUpdateShatafRatesRequest request) {
        try {
            ShatafType shatafType = request.getShatafType();
            List<ShatafRate> updatedRates = request.getRates().stream()
                .map(mapping -> {
                    ShatafRate rate = ShatafRate.builder()
                        .shatafType(shatafType)
                        .minThickness(mapping.getMinThickness())
                        .maxThickness(mapping.getMaxThickness())
                        .ratePerMeter(mapping.getRatePerMeter())
                        .active(true)
                        .build();
                    return shatafRateService.createRate(rate);
                })
                .collect(Collectors.toList());

            List<ShatafRateDTO> dtos = ShatafRateDTO.fromList(updatedRates);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error in bulk update: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "فشل التحديث الجماعي"));
        }
    }
}
