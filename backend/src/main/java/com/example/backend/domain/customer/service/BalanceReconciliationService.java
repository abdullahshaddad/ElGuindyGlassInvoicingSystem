package com.example.backend.domain.customer.service;

import com.example.backend.domain.customer.model.CustomerId;
import com.example.backend.domain.invoice.model.Invoice;
import com.example.backend.domain.invoice.repository.InvoiceRepository;
import com.example.backend.domain.shared.valueobject.Money;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Balance Reconciliation Domain Service
 * Fixes Bug #10: Dual balance tracking inconsistency
 *
 * Single source of truth: Invoice remaining balances
 * Customer balance should always equal sum of invoice remaining balances
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BalanceReconciliationService {
    private final InvoiceRepository invoiceRepository;

    /**
     * Calculate customer's total outstanding balance from all invoices
     * This is the single source of truth
     */
    public Money calculateCustomerBalance(CustomerId customerId) {
        List<Invoice> invoices = invoiceRepository.findByCustomerId(customerId);

        Money totalRemaining = invoices.stream()
                .map(Invoice::getRemainingBalance)
                .reduce(Money.zero(), Money::add);

        log.debug("Calculated balance for customer {}: {} from {} invoices",
                customerId, totalRemaining, invoices.size());

        return totalRemaining;
    }

    /**
     * Check if customer balance matches sum of invoice balances
     */
    public boolean isBalanceConsistent(CustomerId customerId, Money currentCustomerBalance) {
        Money calculatedBalance = calculateCustomerBalance(customerId);
        boolean isConsistent = calculatedBalance.equals(currentCustomerBalance);

        if (!isConsistent) {
            log.warn("Balance inconsistency detected for customer {}: " +
                    "customer.balance={}, calculated from invoices={}",
                    customerId, currentCustomerBalance, calculatedBalance);
        }

        return isConsistent;
    }

    /**
     * Get the correct balance (reconciled from invoices)
     */
    public Money getReconciledBalance(CustomerId customerId) {
        return calculateCustomerBalance(customerId);
    }
}
