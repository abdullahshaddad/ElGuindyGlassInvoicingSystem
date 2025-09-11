package com.example.backend.services;


import com.example.backend.models.GlassType;
import com.example.backend.models.enums.CalculationMethod;
import com.example.backend.repositories.GlassTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class GlassTypeService {

    private final GlassTypeRepository glassTypeRepository;

    @Autowired
    public GlassTypeService(GlassTypeRepository glassTypeRepository) {
        this.glassTypeRepository = glassTypeRepository;
    }

    public GlassType saveGlassType(GlassType glassType) {
        validateGlassType(glassType);
        return glassTypeRepository.save(glassType);
    }

    public Optional<GlassType> findById(Long id) {
        return glassTypeRepository.findById(id);
    }

    public List<GlassType> findAll() {
        return glassTypeRepository.findAll();
    }

    public List<GlassType> findByThickness(Double thickness) {
        return glassTypeRepository.findByThickness(thickness);
    }

    public List<GlassType> findByColor(String color) {
        return glassTypeRepository.findByColor(color);
    }

    public List<GlassType> findByName(String name) {
        return glassTypeRepository.findByNameContainingIgnoreCase(name);
    }

    public void deleteById(Long id) {
        glassTypeRepository.deleteById(id);
    }

    private void validateGlassType(GlassType glassType) {
        if (glassType.getName() == null || glassType.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Glass type name is required");
        }

        if (glassType.getThickness() == null || glassType.getThickness() <= 0) {
            throw new IllegalArgumentException("Glass thickness must be positive");
        }

        if (glassType.getPricePerMeter() == null || glassType.getPricePerMeter() <= 0) {
            throw new IllegalArgumentException("Price per meter must be positive");
        }
        if (glassType.getCalculationMethod() == null) {
            glassType.setCalculationMethod(CalculationMethod.AREA); // Default to area
        }
    }


}