package com.example.backend.repositories;

import com.example.backend.models.ShatafRate;
import com.example.backend.models.enums.ShatafType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Shataf Rate management
 */
@Repository
public interface ShatafRateRepository extends JpaRepository<ShatafRate, Long> {

    /**
     * Find all rates for a specific shataf type
     */
    List<ShatafRate> findByShatafType(ShatafType shatafType);

    /**
     * Find all active rates for a specific shataf type
     */
    List<ShatafRate> findByShatafTypeAndActiveTrue(ShatafType shatafType);

    /**
     * Find rate for a specific shataf type and thickness
     */
    @Query("SELECT sr FROM ShatafRate sr WHERE sr.shatafType = :shatafType " +
           "AND sr.minThickness <= :thickness AND sr.maxThickness >= :thickness " +
           "AND sr.active = true")
    Optional<ShatafRate> findRateByShatafTypeAndThickness(
        @Param("shatafType") ShatafType shatafType,
        @Param("thickness") Double thickness
    );

    /**
     * Find all active rates
     */
    List<ShatafRate> findByActiveTrue();

    /**
     * Check if a rate exists for a shataf type and thickness range
     */
    @Query("SELECT CASE WHEN COUNT(sr) > 0 THEN true ELSE false END FROM ShatafRate sr " +
           "WHERE sr.shatafType = :shatafType " +
           "AND sr.active = true " +
           "AND ((sr.minThickness <= :minThickness AND sr.maxThickness >= :minThickness) " +
           "OR (sr.minThickness <= :maxThickness AND sr.maxThickness >= :maxThickness) " +
           "OR (sr.minThickness >= :minThickness AND sr.maxThickness <= :maxThickness))")
    boolean existsOverlappingRate(
        @Param("shatafType") ShatafType shatafType,
        @Param("minThickness") Double minThickness,
        @Param("maxThickness") Double maxThickness
    );

    /**
     * Find overlapping rates for a shataf type and thickness range
     */
    @Query("SELECT sr FROM ShatafRate sr WHERE sr.shatafType = :shatafType " +
           "AND sr.active = true " +
           "AND sr.id != :excludeId " +
           "AND ((sr.minThickness <= :minThickness AND sr.maxThickness >= :minThickness) " +
           "OR (sr.minThickness <= :maxThickness AND sr.maxThickness >= :maxThickness) " +
           "OR (sr.minThickness >= :minThickness AND sr.maxThickness <= :maxThickness))")
    List<ShatafRate> findOverlappingRates(
        @Param("shatafType") ShatafType shatafType,
        @Param("minThickness") Double minThickness,
        @Param("maxThickness") Double maxThickness,
        @Param("excludeId") Long excludeId
    );

    /**
     * Delete all rates for a specific shataf type
     */
    void deleteByShatafType(ShatafType shatafType);
}
