package com.example.backend.repositories;

import com.example.backend.models.OperationPrice;
import com.example.backend.models.enums.OperationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperationPriceRepository extends JpaRepository<OperationPrice, Long> {

    /**
     * Find all operation prices by operation type
     */
    List<OperationPrice> findByOperationType(OperationType operationType);

    /**
     * Find all active operation prices
     */
    List<OperationPrice> findByActiveTrue();

    /**
     * Find all active operation prices by type
     */
    List<OperationPrice> findByOperationTypeAndActiveTrue(OperationType operationType);

    /**
     * Find specific operation price by type and subtype
     */
    Optional<OperationPrice> findByOperationTypeAndSubtype(OperationType operationType, String subtype);

    /**
     * Find all operation prices ordered by display order
     */
    List<OperationPrice> findAllByOrderByDisplayOrderAsc();

    /**
     * Check if operation price exists by type and subtype
     */
    boolean existsByOperationTypeAndSubtype(OperationType operationType, String subtype);
}
