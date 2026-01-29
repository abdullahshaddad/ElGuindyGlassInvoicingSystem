package com.example.backend.controllers;

import com.example.backend.dto.PaymentDTO;
import com.example.backend.dto.RecordPaymentRequest;
import com.example.backend.models.enums.PaymentMethod;
import com.example.backend.services.PaymentService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for payment operations
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Record a new payment
     */
    @PostMapping
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<?> recordPayment(
            @RequestBody RecordPaymentRequest request,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";

            PaymentDTO payment = paymentService.recordPayment(
                    request.getCustomerId(),
                    request.getInvoiceId(),
                    request.getAmount(),
                    request.getPaymentMethod(),
                    request.getReferenceNumber(),
                    request.getNotes(),
                    username);

            Map<String, Object> response = new HashMap<>();
            response.put("payment", payment);
            response.put("message", "تم تسجيل الدفعة بنجاح");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            log.error("Error recording payment: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Get payment by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<?> getPayment(@PathVariable Long id) {
        try {
            PaymentDTO payment = paymentService.getPaymentById(id);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            log.error("Error retrieving payment {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all payments for a customer
     */
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<?> getCustomerPayments(@PathVariable Long customerId) {
        try {
            List<PaymentDTO> payments = paymentService.getCustomerPayments(customerId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            log.error("Error retrieving customer payments: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all payments for an invoice
     */
    @GetMapping("/invoice/{invoiceId}")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<?> getInvoicePayments(@PathVariable String invoiceId) {
        try {
            List<PaymentDTO> payments = paymentService.getInvoicePayments(invoiceId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            log.error("Error retrieving invoice payments: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get payments within date range
     */
    @GetMapping("/range")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<?> getPaymentsInRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            List<PaymentDTO> payments = paymentService.getPaymentsBetweenDates(startDate, endDate);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            log.error("Error retrieving payments in range: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get customer payments within date range
     */
    @GetMapping("/customer/{customerId}/range")
    @PreAuthorize("hasRole('CASHIER') or hasRole('OWNER')")
    public ResponseEntity<?> getCustomerPaymentsInRange(
            @PathVariable Long customerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            List<PaymentDTO> payments = paymentService.getCustomerPaymentsBetweenDates(
                    customerId, startDate, endDate);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            log.error("Error retrieving customer payments in range: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete payment (admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> deletePayment(@PathVariable Long id) {
        try {
            paymentService.deletePayment(id);
            return ResponseEntity.ok(Map.of("message", "تم حذف الدفعة بنجاح"));
        } catch (Exception e) {
            log.error("Error deleting payment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage()));
        }
    }
}
