import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * Get a single payment by ID
 * @param {string|undefined} paymentId - Convex payment ID
 * @returns {Object|undefined} Payment object
 */
export function usePayment(paymentId) {
    return useQuery(
        api.payments.queries.getPayment,
        paymentId ? { paymentId } : "skip"
    );
}

/**
 * Get all payments for a customer
 * @param {string|undefined} customerId - Convex customer ID
 * @returns {Array|undefined} Customer payments
 */
export function useCustomerPayments(customerId) {
    return useQuery(
        api.payments.queries.getCustomerPayments,
        customerId ? { customerId } : "skip"
    );
}

/**
 * Get all payments for an invoice
 * @param {string|undefined} invoiceId - Convex invoice ID
 * @returns {Array|undefined} Invoice payments
 */
export function useInvoicePayments(invoiceId) {
    return useQuery(
        api.payments.queries.getInvoicePayments,
        invoiceId ? { invoiceId } : "skip"
    );
}

/**
 * Get payments within a date range
 * @param {number|undefined} startDate - Start date timestamp
 * @param {number|undefined} endDate - End date timestamp
 * @returns {Array|undefined} Payments in range
 */
export function usePaymentsBetweenDates(startDate, endDate) {
    return useQuery(
        api.payments.queries.getPaymentsBetweenDates,
        startDate && endDate ? { startDate, endDate } : "skip"
    );
}

// ===== MUTATION HOOKS =====

/**
 * Record a new payment
 * @returns {Function} Mutation function - call with { customerId, invoiceId?, amount, paymentMethod, referenceNumber?, notes? }
 */
export function useRecordPayment() {
    return useMutation(api.payments.mutations.recordPayment);
}

/**
 * Delete a payment (admin only)
 * @returns {Function} Mutation function - call with { paymentId }
 */
export function useDeletePayment() {
    return useMutation(api.payments.mutations.deletePayment);
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format payment method enum to Arabic display name
 * @param {string} method - Payment method enum value
 * @returns {string} Arabic display name
 */
export const formatPaymentMethod = (method) => {
    const methodMap = {
        CASH: 'نقدي',
        CARD: 'بطاقة',
        BANK_TRANSFER: 'تحويل بنكي',
        CHECK: 'شيك',
        VODAFONE_CASH: 'فودافون كاش',
        OTHER: 'أخرى',
    };
    return methodMap[method] || method;
};

/**
 * Get payment method options for select dropdowns
 * @returns {Array<{value: string, label: string}>}
 */
export const getPaymentMethodOptions = () => [
    { value: 'CASH', label: 'نقدي' },
    { value: 'CARD', label: 'بطاقة' },
    { value: 'BANK_TRANSFER', label: 'تحويل بنكي' },
    { value: 'CHECK', label: 'شيك' },
    { value: 'VODAFONE_CASH', label: 'فودافون كاش' },
    { value: 'OTHER', label: 'أخرى' },
];
