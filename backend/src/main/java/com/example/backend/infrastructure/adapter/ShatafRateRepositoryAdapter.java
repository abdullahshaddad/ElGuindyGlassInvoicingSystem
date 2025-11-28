package com.example.backend.infrastructure.adapter;

import com.example.backend.domain.shataf.model.ShatafRate;
import com.example.backend.domain.shataf.repository.ShatafRateRepository;
import com.example.backend.domain.shared.valueobject.Money;
import com.example.backend.models.enums.ShatafType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Repository Adapter for ShatafRate
 * Implements the domain repository port using JPA repository
 * Maps between JPA entities and domain entities
 */
@Component
@RequiredArgsConstructor
public class ShatafRateRepositoryAdapter implements ShatafRateRepository {

    private final com.example.backend.repositories.ShatafRateRepository jpaRepository;

    @Override
    public ShatafRate save(ShatafRate domainRate) {
        com.example.backend.models.ShatafRate jpaRate = toJpa(domainRate);
        com.example.backend.models.ShatafRate savedJpaRate = jpaRepository.save(jpaRate);
        return toDomain(savedJpaRate);
    }

    @Override
    public Optional<ShatafRate> findById(Long id) {
        return jpaRepository.findById(id)
                .map(this::toDomain);
    }

    @Override
    public Optional<ShatafRate> findByShatafTypeAndThickness(ShatafType shatafType, double thickness) {
        return jpaRepository.findRateByShatafTypeAndThickness(shatafType, thickness)
                .map(this::toDomain);
    }

    @Override
    public List<ShatafRate> findByShatafType(ShatafType shatafType) {
        return jpaRepository.findByShatafType(shatafType).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<ShatafRate> findAll() {
        return jpaRepository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        jpaRepository.deleteById(id);
    }

    // Mapping methods

    /**
     * Convert JPA entity to Domain entity
     */
    private ShatafRate toDomain(com.example.backend.models.ShatafRate jpaRate) {
        if (jpaRate == null) return null;

        return ShatafRate.reconstitute(
                jpaRate.getId(),
                jpaRate.getShatafType(),
                jpaRate.getMinThickness(),
                jpaRate.getMaxThickness(),
                Money.of(jpaRate.getRatePerMeter()),
                jpaRate.getActive() != null ? jpaRate.getActive() : true
        );
    }

    /**
     * Convert Domain entity to JPA entity
     */
    private com.example.backend.models.ShatafRate toJpa(ShatafRate domainRate) {
        if (domainRate == null) return null;

        return com.example.backend.models.ShatafRate.builder()
                .id(domainRate.getId())
                .shatafType(domainRate.getShatafType())
                .minThickness(domainRate.getMinThickness())
                .maxThickness(domainRate.getMaxThickness())
                .ratePerMeter(domainRate.getRatePerMeter().toDouble())
                .active(domainRate.isActive())
                .build();
    }
}
