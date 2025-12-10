package com.example.backend.controllers;

import com.example.backend.models.OperationPrice;
import com.example.backend.models.enums.OperationType;
import com.example.backend.services.OperationPriceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for managing operation prices
 */
@RestController
@RequestMapping("/api/operation-prices")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class OperationPriceController {

    private final OperationPriceService operationPriceService;

    /**
     * Get all operation prices
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'CASHIER')")
    public ResponseEntity<List<OperationPrice>> getAllOperationPrices(
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(required = false) OperationType type
    ) {
        log.debug("GET /api/operation-prices - activeOnly: {}, type: {}", activeOnly, type);

        List<OperationPrice> prices;

        if (type != null && Boolean.TRUE.equals(activeOnly)) {
            prices = operationPriceService.getActiveOperationPricesByType(type);
        } else if (type != null) {
            prices = operationPriceService.getOperationPricesByType(type);
        } else if (Boolean.TRUE.equals(activeOnly)) {
            prices = operationPriceService.getActiveOperationPrices();
        } else {
            prices = operationPriceService.getAllOperationPrices();
        }

        return ResponseEntity.ok(prices);
    }

    /**
     * Get operation price by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<OperationPrice> getOperationPriceById(@PathVariable Long id) {
        log.debug("GET /api/operation-prices/{}", id);

        return operationPriceService.getOperationPriceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get operation price by type and subtype
     */
    @GetMapping("/type/{operationType}/subtype/{subtype}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'CASHIER')")
    public ResponseEntity<OperationPrice> getOperationPriceByTypeAndSubtype(
            @PathVariable OperationType operationType,
            @PathVariable String subtype
    ) {
        log.debug("GET /api/operation-prices/type/{}/subtype/{}", operationType, subtype);

        return operationPriceService.getOperationPriceByTypeAndSubtype(operationType, subtype)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create new operation price
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> createOperationPrice(@Valid @RequestBody OperationPrice operationPrice) {
        log.info("POST /api/operation-prices - Creating new operation price");

        try {
            OperationPrice created = operationPriceService.createOperationPrice(operationPrice);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            log.error("Error creating operation price: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Update operation price
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> updateOperationPrice(
            @PathVariable Long id,
            @Valid @RequestBody OperationPrice operationPrice
    ) {
        log.info("PUT /api/operation-prices/{} - Updating operation price", id);

        try {
            OperationPrice updated = operationPriceService.updateOperationPrice(id, operationPrice);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            log.error("Error updating operation price: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Toggle operation price active status
     */
    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> toggleActiveStatus(@PathVariable Long id) {
        log.info("PATCH /api/operation-prices/{}/toggle - Toggling active status", id);

        try {
            OperationPrice updated = operationPriceService.toggleActiveStatus(id);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            log.error("Error toggling operation price status: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Delete operation price
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> deleteOperationPrice(@PathVariable Long id) {
        log.info("DELETE /api/operation-prices/{} - Deleting operation price", id);

        try {
            operationPriceService.deleteOperationPrice(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.error("Error deleting operation price: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Initialize default operation prices
     */
    @PostMapping("/initialize")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<String> initializeDefaultPrices() {
        log.info("POST /api/operation-prices/initialize - Initializing default prices");

        operationPriceService.initializeDefaultPrices();
        return ResponseEntity.ok("Default operation prices initialized successfully");
    }
}
