package com.example.backend.repositories;

import com.example.backend.models.CuttingRate;
import com.example.backend.models.enums.CuttingType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CuttingRateRepository extends JpaRepository<CuttingRate, Long> {
    @Query("SELECT cr FROM CuttingRate cr WHERE cr.cuttingType = :cuttingType AND cr.active = true AND :thickness >= cr.minThickness AND :thickness <= cr.maxThickness ORDER BY cr.minThickness")
    Optional<CuttingRate> findRateByTypeAndThickness(@Param("cuttingType") CuttingType cuttingType, @Param("thickness") Double thickness);

    List<CuttingRate> findByCuttingTypeAndActiveTrue(CuttingType cuttingType);
}