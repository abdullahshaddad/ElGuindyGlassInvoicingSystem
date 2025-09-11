package com.example.backend.controllers;

import com.example.backend.models.GlassType;
import com.example.backend.models.enums.CalculationMethod;
import com.example.backend.services.GlassTypeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/glass-types")
@CrossOrigin(origins = "*")
public class GlassTypeController {

    private final GlassTypeService glassTypeService;

    @Autowired
    public GlassTypeController(GlassTypeService glassTypeService) {
        this.glassTypeService = glassTypeService;
    }

    @GetMapping
    public ResponseEntity<List<GlassType>> getAllGlassTypes() {
        List<GlassType> glassTypes = glassTypeService.findAll();
        return ResponseEntity.ok(glassTypes);
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<GlassType> createGlassType(@Valid @RequestBody GlassType glassType) {
        GlassType savedGlassType = glassTypeService.saveGlassType(glassType);
        return ResponseEntity.ok(savedGlassType);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<GlassType> updateGlassType(@PathVariable Long id, @Valid @RequestBody GlassType glassType) {
        glassType.setId(id);
        GlassType updatedGlassType = glassTypeService.saveGlassType(glassType);
        return ResponseEntity.ok(updatedGlassType);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteGlassType(@PathVariable Long id) {
        glassTypeService.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/calculation-methods")
    public ResponseEntity<CalculationMethod[]> getCalculationMethods() {
        return ResponseEntity.ok(CalculationMethod.values());
    }
}

