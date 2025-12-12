package com.example.backend.domain.payment.repository;

import com.example.backend.domain.customer.model.CustomerId;
import com.example.backend.domain.invoice.model.InvoiceId;
import com.example.backend.domain.payment.model.Payment;
import com.example.backend.domain.payment.model.PaymentId;

import java.util.List;
import java.util.Optional;

/**
 * Payment Repository Port (Interface)
 */
public interface PaymentRepository {

    Payment save(Payment payment);

    Optional<Payment> findById(PaymentId id);

    List<Payment> findByCustomerId(CustomerId customerId);

    List<Payment> findByInvoiceId(InvoiceId invoiceId);

    void delete(PaymentId id);
}
