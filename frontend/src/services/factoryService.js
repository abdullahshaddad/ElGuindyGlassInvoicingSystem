import { get, post } from '@/api/axios';

/**
 * Factory Service
 * Handles factory operations for workers
 */
export const factoryService = {
    /**
     * Get recent invoices for today
     * @returns {Promise<Invoice[]>}
     */
    async getRecentInvoices() {
        try {
            const response = await get('/factory/invoices/recent');
            return response;
        } catch (error) {
            console.error('Get recent invoices error:', error);
            throw error;
        }
    },

    /**
     * Print sticker for invoice
     * @param {string|number} invoiceId - Invoice ID
     * @returns {Promise<PrintJob>}
     */
    async printSticker(invoiceId) {
        try {
            const response = await post(`/factory/print-sticker/${invoiceId}`);
            return response;
        } catch (error) {
            console.error('Print sticker error:', error);
            throw error;
        }
    },
};