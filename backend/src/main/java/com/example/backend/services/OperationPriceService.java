package com.example.backend.services;

import com.example.backend.models.OperationPrice;
import com.example.backend.models.enums.OperationType;
import com.example.backend.repositories.OperationPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing operation prices
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OperationPriceService {

    private final OperationPriceRepository operationPriceRepository;

    /**
     * Get all operation prices
     */
    public List<OperationPrice> getAllOperationPrices() {
        log.debug("Fetching all operation prices");
        return operationPriceRepository.findAllByOrderByDisplayOrderAsc();
    }

    /**
     * Get all active operation prices
     */
    public List<OperationPrice> getActiveOperationPrices() {
        log.debug("Fetching active operation prices");
        return operationPriceRepository.findByActiveTrue();
    }

    /**
     * Get operation prices by type
     */
    public List<OperationPrice> getOperationPricesByType(OperationType operationType) {
        log.debug("Fetching operation prices for type: {}", operationType);
        return operationPriceRepository.findByOperationType(operationType);
    }

    /**
     * Get active operation prices by type
     */
    public List<OperationPrice> getActiveOperationPricesByType(OperationType operationType) {
        log.debug("Fetching active operation prices for type: {}", operationType);
        return operationPriceRepository.findByOperationTypeAndActiveTrue(operationType);
    }

    /**
     * Get operation price by ID
     */
    public Optional<OperationPrice> getOperationPriceById(Long id) {
        log.debug("Fetching operation price with ID: {}", id);
        return operationPriceRepository.findById(id);
    }

    /**
     * Get operation price by type and subtype
     */
    public Optional<OperationPrice> getOperationPriceByTypeAndSubtype(OperationType operationType, String subtype) {
        log.debug("Fetching operation price for type: {} and subtype: {}", operationType, subtype);
        return operationPriceRepository.findByOperationTypeAndSubtype(operationType, subtype);
    }

    /**
     * Create new operation price
     */
    @Transactional
    public OperationPrice createOperationPrice(OperationPrice operationPrice) {
        log.info("Creating new operation price: {} - {}", operationPrice.getOperationType(), operationPrice.getSubtype());

        // Check for duplicates
        if (operationPriceRepository.existsByOperationTypeAndSubtype(
                operationPrice.getOperationType(),
                operationPrice.getSubtype()
        )) {
            throw new IllegalArgumentException(
                    String.format("Operation price already exists for type: %s and subtype: %s",
                            operationPrice.getOperationType(), operationPrice.getSubtype())
            );
        }

        // Set display order if not provided
        if (operationPrice.getDisplayOrder() == null) {
            long count = operationPriceRepository.count();
            operationPrice.setDisplayOrder((int) count + 1);
        }

        OperationPrice savedPrice = operationPriceRepository.save(operationPrice);
        log.info("Successfully created operation price with ID: {}", savedPrice.getId());
        return savedPrice;
    }

    /**
     * Update existing operation price
     */
    @Transactional
    public OperationPrice updateOperationPrice(Long id, OperationPrice updatedPrice) {
        log.info("Updating operation price with ID: {}", id);

        OperationPrice existingPrice = operationPriceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operation price not found with ID: " + id));

        // Check for duplicates if type or subtype changed
        if (!existingPrice.getOperationType().equals(updatedPrice.getOperationType()) ||
            !existingPrice.getSubtype().equals(updatedPrice.getSubtype())) {
            if (operationPriceRepository.existsByOperationTypeAndSubtype(
                    updatedPrice.getOperationType(),
                    updatedPrice.getSubtype()
            )) {
                throw new IllegalArgumentException(
                        String.format("Operation price already exists for type: %s and subtype: %s",
                                updatedPrice.getOperationType(), updatedPrice.getSubtype())
                );
            }
        }

        // Update fields
        existingPrice.setOperationType(updatedPrice.getOperationType());
        existingPrice.setSubtype(updatedPrice.getSubtype());
        existingPrice.setArabicName(updatedPrice.getArabicName());
        existingPrice.setEnglishName(updatedPrice.getEnglishName());
        existingPrice.setBasePrice(updatedPrice.getBasePrice());
        existingPrice.setUnit(updatedPrice.getUnit());
        existingPrice.setDescription(updatedPrice.getDescription());
        existingPrice.setActive(updatedPrice.getActive());
        if (updatedPrice.getDisplayOrder() != null) {
            existingPrice.setDisplayOrder(updatedPrice.getDisplayOrder());
        }

        OperationPrice savedPrice = operationPriceRepository.save(existingPrice);
        log.info("Successfully updated operation price with ID: {}", savedPrice.getId());
        return savedPrice;
    }

    /**
     * Toggle operation price active status
     */
    @Transactional
    public OperationPrice toggleActiveStatus(Long id) {
        log.info("Toggling active status for operation price with ID: {}", id);

        OperationPrice operationPrice = operationPriceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operation price not found with ID: " + id));

        operationPrice.setActive(!operationPrice.getActive());
        return operationPriceRepository.save(operationPrice);
    }

    /**
     * Delete operation price
     */
    @Transactional
    public void deleteOperationPrice(Long id) {
        log.info("Deleting operation price with ID: {}", id);

        if (!operationPriceRepository.existsById(id)) {
            throw new IllegalArgumentException("Operation price not found with ID: " + id);
        }

        operationPriceRepository.deleteById(id);
        log.info("Successfully deleted operation price with ID: {}", id);
    }

    /**
     * Initialize default laser operation prices if none exist
     */
    @Transactional
    public void initializeDefaultPrices() {
        log.info("Checking for default operation prices");

        if (operationPriceRepository.count() == 0) {
            log.info("No operation prices found, initializing defaults");

            // Default laser types
            createOperationPrice(OperationPrice.builder()
                    .operationType(OperationType.LASER)
                    .subtype("NORMAL")
                    .arabicName("ليزر عادي")
                    .englishName("Normal Laser")
                    .basePrice(50.0)
                    .unit("per piece")
                    .description("Standard laser cutting operation")
                    .active(true)
                    .displayOrder(1)
                    .build());

            createOperationPrice(OperationPrice.builder()
                    .operationType(OperationType.LASER)
                    .subtype("DEEP")
                    .arabicName("ليزر عميق")
                    .englishName("Deep Laser")
                    .basePrice(100.0)
                    .unit("per piece")
                    .description("Deep laser cutting operation")
                    .active(true)
                    .displayOrder(2)
                    .build());

            createOperationPrice(OperationPrice.builder()
                    .operationType(OperationType.LASER)
                    .subtype("ENGRAVE")
                    .arabicName("حفر ليزر")
                    .englishName("Laser Engraving")
                    .basePrice(150.0)
                    .unit("per piece")
                    .description("Laser engraving operation")
                    .active(true)
                    .displayOrder(3)
                    .build());

            createOperationPrice(OperationPrice.builder()
                    .operationType(OperationType.LASER)
                    .subtype("POLISH")
                    .arabicName("تلميع ليزر")
                    .englishName("Laser Polish")
                    .basePrice(75.0)
                    .unit("per piece")
                    .description("Laser polishing operation")
                    .active(true)
                    .displayOrder(4)
                    .build());

            log.info("Default operation prices initialized successfully");
        }
    }
}
