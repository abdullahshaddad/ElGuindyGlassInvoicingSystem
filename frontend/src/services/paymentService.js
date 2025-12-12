import { get, post, put, del } from '@/api/axios';

/**
 * Payment Service
 * Handles all payment-related API operations
 */
const paymentService = {
    /**
     * Record a new payment
     * @param {Object} paymentData - Payment information
     * @param {number} paymentData.customerId - Customer ID
     * @param {number} [paymentData.invoiceId] - Optional invoice ID
     * @param {number} paymentData.amount - Payment amount
     * @param {string} paymentData.paymentMethod - Payment method (CASH, CARD, BANK_TRANSFER, CHECK, OTHER)
     * @param {string} [paymentData.referenceNumber] - Optional reference number
     * @param {string} [paymentData.notes] - Optional notes
     * @returns {Promise<Object>}
     */
    async recordPayment(paymentData) {
        try {
            const response = await post('/payments', paymentData);
            return response;
        } catch (error) {
            console.error('Record payment error:', error);
            throw error;
        }
    },

    /**
     * Get payment by ID
     * @param {string|number} paymentId - Payment ID
     * @returns {Promise<Object>}
     */
    async getPaymentById(paymentId) {
        try {
            const response = await get(`/payments/${paymentId}`);
            return response;
        } catch (error) {
            console.error('Get payment error:', error);
            throw error;
        }
    },

    /**
     * Get all payments for a customer
     * @param {string|number} customerId - Customer ID
     * @returns {Promise<Array>}
     */
    async getCustomerPayments(customerId) {
        try {
            const response = await get(`/payments/customer/${customerId}`);
            return response;
        } catch (error) {
            console.error('Get customer payments error:', error);
            throw error;
        }
    },

    /**
     * Get all payments for an invoice
     * @param {string|number} invoiceId - Invoice ID
     * @returns {Promise<Array>}
     */
    async getInvoicePayments(invoiceId) {
        try {
            const response = await get(`/payments/invoice/${invoiceId}`);
            return response;
        } catch (error) {
            console.error('Get invoice payments error:', error);
            throw error;
        }
    },

    /**
     * Get payments within date range
     * @param {Date|string} startDate - Start date
     * @param {Date|string} endDate - End date
     * @returns {Promise<Array>}
     */
    async getPaymentsInRange(startDate, endDate) {
        try {
            const params = new URLSearchParams({
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString()
            });
            const response = await get(`/payments/range?${params.toString()}`);
            return response;
        } catch (error) {
            console.error('Get payments in range error:', error);
            throw error;
        }
    },

    /**
     * Get customer payments within date range
     * @param {string|number} customerId - Customer ID
     * @param {Date|string} startDate - Start date
     * @param {Date|string} endDate - End date
     * @returns {Promise<Array>}
     */
    async getCustomerPaymentsInRange(customerId, startDate, endDate) {
        try {
            const params = new URLSearchParams({
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString()
            });
            const response = await get(`/payments/customer/${customerId}/range?${params.toString()}`);
            return response;
        } catch (error) {
            console.error('Get customer payments in range error:', error);
            throw error;
        }
    },

    /**
     * Delete a payment (admin only)
     * @param {string|number} paymentId - Payment ID
     * @returns {Promise<void>}
     */
    async deletePayment(paymentId) {
        try {
            await del(`/payments/${paymentId}`);
        } catch (error) {
            console.error('Delete payment error:', error);
            throw error;
        }
    },

    /**
     * Format payment method for display
     * @param {string} method - Payment method enum
     * @returns {string} - Arabic display name
     */
    formatPaymentMethod(method) {
        const methods = {
            CASH: 'نقدي',
            CARD: 'بطاقة',
            BANK_TRANSFER: 'تحويل بنكي',
            CHECK: 'شيك',
            OTHER: 'أخرى'
        };
        return methods[method] || method;
    },

    /**
     * Get payment method options for select dropdown
     * @returns {Array<{value: string, label: string}>}
     */
    getPaymentMethodOptions() {
        return [
            { value: 'CASH', label: 'نقدي' },
            { value: 'CARD', label: 'بطاقة' },
            { value: 'BANK_TRANSFER', label: 'تحويل بنكي' },
            { value: 'CHECK', label: 'شيك' },
            { value: 'OTHER', label: 'أخرى' }
        ];
    }
};

export default paymentService;
