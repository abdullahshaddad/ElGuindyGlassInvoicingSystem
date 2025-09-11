package com.example.backend.controllers;

import com.example.backend.models.CuttingRate;
import com.example.backend.models.enums.CuttingType;
import com.example.backend.services.cutting.CuttingRateService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cutting-rates")
@CrossOrigin(origins = "*")
public class CuttingRateController {

    private final CuttingRateService cuttingRateService;

    @Autowired
    public CuttingRateController(CuttingRateService cuttingRateService) {
        this.cuttingRateService = cuttingRateService;
    }

    @GetMapping
    @PreAuthorize("hasRole('OWNER') or hasRole('CASHIER')")
    public ResponseEntity<List<CuttingRate>> getAllRates() {
        List<CuttingRate> rates = cuttingRateService.findAllActive();
        return ResponseEntity.ok(rates);
    }

    @GetMapping("/type/{cuttingType}")
    @PreAuthorize("hasRole('OWNER') or hasRole('CASHIER')")
    public ResponseEntity<List<CuttingRate>> getRatesByType(@PathVariable CuttingType cuttingType) {
        List<CuttingRate> rates = cuttingRateService.findByType(cuttingType);
        return ResponseEntity.ok(rates);
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<CuttingRate> createRate(@Valid @RequestBody CuttingRate cuttingRate) {
        CuttingRate savedRate = cuttingRateService.save(cuttingRate);
        return ResponseEntity.ok(savedRate);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<CuttingRate> updateRate(@PathVariable Long id, @Valid @RequestBody CuttingRate cuttingRate) {
        cuttingRate.setId(id);
        CuttingRate updatedRate = cuttingRateService.save(cuttingRate);
        return ResponseEntity.ok(updatedRate);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteRate(@PathVariable Long id) {
        cuttingRateService.deactivate(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/initialize-default")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<CuttingRate>> initializeDefaultRates() {
        List<CuttingRate> defaultRates = cuttingRateService.initializeDefaultRates();
        return ResponseEntity.ok(defaultRates);
    }

    @GetMapping("/calculate")
    @PreAuthorize("hasRole('OWNER') or hasRole('CASHIER')")
    public ResponseEntity<Double> calculateRate(@RequestParam CuttingType cuttingType, @RequestParam Double thickness) {
        Double rate = cuttingRateService.getRateForThickness(cuttingType, thickness);
        return ResponseEntity.ok(rate);
    }
}