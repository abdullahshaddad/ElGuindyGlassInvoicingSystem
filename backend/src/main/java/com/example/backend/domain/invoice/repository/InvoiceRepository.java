package com.example.backend.domain.invoice.repository;

import com.example.backend.domain.customer.model.CustomerId;
import com.example.backend.domain.invoice.model.Invoice;
import com.example.backend.domain.invoice.model.InvoiceId;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Invoice Repository Port (Interface)
 * Defines what the domain needs from infrastructure
 */
public interface InvoiceRepository {

    Invoice save(Invoice invoice);

    Optional<Invoice> findById(InvoiceId id);

    List<Invoice> findByCustomerId(CustomerId customerId);

    List<Invoice> findByDateRange(LocalDate startDate, LocalDate endDate);

    List<Invoice> findAll();

    void delete(InvoiceId id);

    boolean existsById(InvoiceId id);
}
