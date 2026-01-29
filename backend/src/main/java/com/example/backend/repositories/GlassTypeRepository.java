package com.example.backend.repositories;

import com.example.backend.models.GlassType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GlassTypeRepository extends JpaRepository<GlassType, Long> {
    List<GlassType> findByThickness(Double thickness);

    List<GlassType> findByColor(String color);

    List<GlassType> findByNameContainingIgnoreCase(String name);

    @org.springframework.data.jpa.repository.Query("SELECT MAX(g.id) FROM GlassType g")
    Long findMaxNumericId();
}
