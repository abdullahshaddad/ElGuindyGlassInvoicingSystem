package com.example.backend.domain.glass.repository;

import com.example.backend.domain.glass.model.GlassType;
import com.example.backend.domain.glass.model.GlassTypeId;

import java.util.List;
import java.util.Optional;

/**
 * GlassType Repository Port (Interface)
 */
public interface GlassTypeRepository {

    GlassType save(GlassType glassType);

    Optional<GlassType> findById(GlassTypeId id);

    List<GlassType> findAll();

    List<GlassType> findByActive(boolean active);

    void delete(GlassTypeId id);
}
