package com.example.backend.infrastructure.adapter;

import com.example.backend.domain.customer.model.CustomerId;
import com.example.backend.domain.invoice.model.Invoice;
import com.example.backend.domain.invoice.model.InvoiceId;
import com.example.backend.domain.invoice.repository.InvoiceRepository;
import com.example.backend.infrastructure.mapper.InvoiceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Repository Adapter for Invoice
 * Implements the domain repository port using JPA repository
 * Maps between JPA entities and domain entities
 */
@Component
@RequiredArgsConstructor
public class InvoiceRepositoryAdapter implements InvoiceRepository {

    private final com.example.backend.repositories.InvoiceRepository jpaRepository;
    private final com.example.backend.repositories.CustomerRepository customerRepository;
    private final InvoiceMapper mapper;

    @Override
    public Invoice save(Invoice domainInvoice) {
        // For saving, we need the customer entity
        // This is a simplification - in a real implementation we'd have a CustomerRepository adapter
        com.example.backend.models.customer.Customer jpaCustomer = customerRepository
                .findById(domainInvoice.getCustomerId().getValue())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + domainInvoice.getCustomerId().getValue()));

        com.example.backend.models.Invoice jpaInvoice = mapper.toJpa(domainInvoice, jpaCustomer);
        com.example.backend.models.Invoice savedJpaInvoice = jpaRepository.save(jpaInvoice);
        return mapper.toDomain(savedJpaInvoice);
    }

    @Override
    public Optional<Invoice> findById(InvoiceId id) {
        return jpaRepository.findById(id.getValue())
                .map(mapper::toDomain);
    }

    @Override
    public List<Invoice> findByCustomerId(CustomerId customerId) {
        return jpaRepository.findByCustomerId(customerId.getValue()).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Invoice> findByDateRange(LocalDate startDate, LocalDate endDate) {
        // JPA repository has a Page version, we need to convert
        return jpaRepository.findByIssueDateBetween(
                startDate.atStartOfDay(),
                endDate.atTime(23, 59, 59),
                org.springframework.data.domain.Pageable.unpaged()
        ).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Invoice> findAll() {
        return jpaRepository.findAll().stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(InvoiceId id) {
        jpaRepository.deleteById(id.getValue());
    }

    @Override
    public boolean existsById(InvoiceId id) {
        return jpaRepository.existsById(id.getValue());
    }
}
