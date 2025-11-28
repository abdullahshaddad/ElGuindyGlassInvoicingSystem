package com.example.backend.domain.shataf.repository;

import com.example.backend.domain.shataf.model.ShatafRate;
import com.example.backend.models.enums.ShatafType;

import java.util.List;
import java.util.Optional;

/**
 * ShatafRate Repository Port (Interface)
 */
public interface ShatafRateRepository {

    ShatafRate save(ShatafRate rate);

    Optional<ShatafRate> findById(Long id);

    Optional<ShatafRate> findByShatafTypeAndThickness(ShatafType shatafType, double thickness);

    List<ShatafRate> findByShatafType(ShatafType shatafType);

    List<ShatafRate> findAll();

    void delete(Long id);
}
