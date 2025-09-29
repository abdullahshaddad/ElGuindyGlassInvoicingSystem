package com.example.backend.repositories;

import com.example.backend.models.Invoice;
import com.example.backend.models.enums.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByCustomerId(Long customerId);

    List<Invoice> findByStatus(InvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE i.issueDate BETWEEN :startDate AND :endDate ORDER BY i.issueDate DESC")
    Page<Invoice> findByIssueDateBetween(@Param("startDate") LocalDateTime startDate,
                                         @Param("endDate") LocalDateTime endDate,
                                         Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE i.customer.name LIKE %:customerName% " +
            "OR i.customer.phone LIKE %:customerName% ORDER BY i.issueDate DESC")
    Page<Invoice> findByCustomerNameOrPhone(@Param("customerName") String customerName, Pageable pageable);

    @Query("SELECT SUM(i.totalPrice) FROM Invoice i WHERE i.status = :status AND i.issueDate BETWEEN :startDate AND :endDate")
    Double getTotalRevenueByStatusAndDateRange(@Param("status") InvoiceStatus status,
                                               @Param("startDate") LocalDateTime startDate,
                                               @Param("endDate") LocalDateTime endDate);

    @Query("SELECT i FROM Invoice i LEFT JOIN FETCH i.invoiceLines il LEFT JOIN FETCH il.glassType WHERE i.id = :id")
    Optional<Invoice> findByIdWithLines(@Param("id") Long id);

    // In InvoiceRepository.java
    Page<Invoice> findByCustomerId(Long customerId, Pageable pageable);

    Page<Invoice> findByStatus(InvoiceStatus status, Pageable pageable);


}
