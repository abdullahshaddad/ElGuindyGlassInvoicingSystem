package com.example.backend.repositories;

import com.example.backend.models.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for Payment entity operations
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    /**
     * Find all payments for a specific customer
     */
    @Query("SELECT p FROM Payment p WHERE p.customer.id = :customerId ORDER BY p.paymentDate DESC")
    List<Payment> findByCustomerId(@Param("customerId") Long customerId);
    
    /**
     * Find all payments for a specific invoice
     */
    @Query("SELECT p FROM Payment p WHERE p.invoice.id = :invoiceId ORDER BY p.paymentDate DESC")
    List<Payment> findByInvoiceId(@Param("invoiceId") String invoiceId);
    
    /**
     * Get total payments made by customer
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0.0) FROM Payment p WHERE p.customer.id = :customerId")
    Double getTotalPaymentsByCustomer(@Param("customerId") Long customerId);
    
    /**
     * Get total payments for an invoice
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0.0) FROM Payment p WHERE p.invoice.id = :invoiceId")
    Double getTotalPaymentsForInvoice(@Param("invoiceId") String invoiceId);
    
    /**
     * Find payments within date range
     */
    @Query("SELECT p FROM Payment p WHERE p.paymentDate BETWEEN :startDate AND :endDate ORDER BY p.paymentDate DESC")
    List<Payment> findPaymentsBetweenDates(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    /**
     * Get customer payments within date range
     */
    @Query("SELECT p FROM Payment p WHERE p.customer.id = :customerId " +
           "AND p.paymentDate BETWEEN :startDate AND :endDate ORDER BY p.paymentDate DESC")
    List<Payment> findCustomerPaymentsBetweenDates(
        @Param("customerId") Long customerId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    /**
     * Get recent payments (last N days)
     */
    @Query("SELECT p FROM Payment p WHERE p.paymentDate >= :since ORDER BY p.paymentDate DESC")
    List<Payment> findRecentPayments(@Param("since") LocalDateTime since);

    @Query("SELECT MAX(p.id) FROM Payment p")
    Long findMaxNumericId();
}
