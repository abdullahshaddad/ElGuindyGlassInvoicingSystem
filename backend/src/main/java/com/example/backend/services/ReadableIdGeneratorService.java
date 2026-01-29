package com.example.backend.services;

import com.example.backend.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReadableIdGeneratorService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final GlassTypeRepository glassTypeRepository;
    private final InvoiceLineRepository invoiceLineRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized String generateInvoiceId() {
        String maxId = invoiceRepository.findMaxNumericId();
        return generateNextId("INV", maxId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized String generatePaymentId() {
        Long maxId = paymentRepository.findMaxNumericId();
        return generateNextIdFromLong("PAY", maxId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized String generateCustomerId() {
        Long maxId = customerRepository.findMaxNumericId();
        return generateNextIdFromLong("CUST", maxId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized String generateGlassTypeId() {
        Long maxId = glassTypeRepository.findMaxNumericId();
        return generateNextIdFromLong("GT", maxId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized String generateInvoiceLineId() {
        Long maxId = invoiceLineRepository.findMaxNumericId();
        return generateNextIdFromLong("INVL", maxId);
    }

    /**
     * Generate next ID from a String ID (format: PREFIX-XXXX)
     */
    private String generateNextId(String prefix, String maxId) {
        if (maxId == null || maxId.isEmpty()) {
            return prefix + "-0001";
        }

        try {
            // Extract numeric part from "PREFIX-XXXX"
            String[] parts = maxId.split("-");
            if (parts.length >= 2) {
                long currentNum = Long.parseLong(parts[parts.length - 1]);
                return String.format("%s-%04d", prefix, currentNum + 1);
            }
        } catch (NumberFormatException e) {
            log.warn("Could not parse ID: {}, starting fresh", maxId);
        }

        return prefix + "-0001";
    }

    /**
     * Generate next ID from a Long ID
     */
    private String generateNextIdFromLong(String prefix, Long maxId) {
        long nextNum = (maxId == null) ? 1 : maxId + 1;
        return String.format("%s-%04d", prefix, nextNum);
    }
}
