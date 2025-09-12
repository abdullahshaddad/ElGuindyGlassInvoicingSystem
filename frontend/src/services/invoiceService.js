import { get, post, put, del } from '@/api/axios';

/**
 * Invoice Service
 * Handles all invoice-related API calls
 */
export const invoiceService = {
    /**
     * Create new invoice
     * @param {CreateInvoiceRequest} invoiceData
     * @returns {Promise<Invoice>}
     */
    async createInvoice(invoiceData) {
        try {
            const response = await post('/invoices', invoiceData);
            return response;
        } catch (error) {
            console.error('Create invoice error:', error);
            throw error;
        }
    },

    /**
     * Get invoice by ID
     * @param {string|number} id - Invoice ID
     * @returns {Promise<Invoice>}
     */
    async getInvoice(id) {
        try {
            const response = await get(`/invoices/${id}`);
            return response;
        } catch (error) {
            console.error('Get invoice error:', error);
            throw error;
        }
    },

    /**
     * List invoices with pagination and filters
     * @param {Object} params - Query parameters
     * @param {number} [params.page=0] - Page number
     * @param {number} [params.size=20] - Page size
     * @param {string} [params.startDate] - Start date filter (ISO string)
     * @param {string} [params.endDate] - End date filter (ISO string)
     * @param {string} [params.customerName] - Customer name filter
     * @returns {Promise<PagedResponse<Invoice>>}
     */
    async listInvoices(params = {}) {
        try {
            const queryParams = new URLSearchParams();

            if (params.page !== undefined) queryParams.append('page', params.page);
            if (params.size !== undefined) queryParams.append('size', params.size);
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);
            if (params.customerName) queryParams.append('customerName', params.customerName);

            const response = await get(`/invoices?${queryParams.toString()}`);
            return response;
        } catch (error) {
            console.error('List invoices error:', error);
            throw error;
        }
    },

    /**
     * Mark invoice as paid
     * @param {string|number} id - Invoice ID
     * @returns {Promise<Invoice>}
     */
    async markAsPaid(id) {
        try {
            const response = await put(`/invoices/${id}/pay`);
            return response;
        } catch (error) {
            console.error('Mark as paid error:', error);
            throw error;
        }
    },

    /**
     * Get revenue for date range (Owner only)
     * @param {string} startDate - Start date (ISO string)
     * @param {string} endDate - End date (ISO string)
     * @returns {Promise<number>}
     */
    async getRevenue(startDate, endDate) {
        try {
            const params = new URLSearchParams({
                startDate,
                endDate,
            });

            const response = await get(`/invoices/revenue?${params.toString()}`);
            return response;
        } catch (error) {
            console.error('Get revenue error:', error);
            throw error;
        }
    },

    /**
     * Export invoices to CSV (Owner only)
     * @param {string} [startDate] - Start date (ISO string)
     * @param {string} [endDate] - End date (ISO string)
     * @returns {Promise<Blob>}
     */
    async exportInvoices(startDate, endDate) {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await get(`/invoices/export?${params.toString()}`, {
                responseType: 'blob',
            });

            return response;
        } catch (error) {
            console.error('Export invoices error:', error);
            throw error;
        }
    },

    /**
     * Update invoice (if allowed)
     * @param {string|number} id - Invoice ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Invoice>}
     */
    async updateInvoice(id, updateData) {
        try {
            const response = await put(`/invoices/${id}`, updateData);
            return response;
        } catch (error) {
            console.error('Update invoice error:', error);
            throw error;
        }
    },

    /**
     * Delete invoice (if allowed)
     * @param {string|number} id - Invoice ID
     * @returns {Promise<void>}
     */
    async deleteInvoice(id) {
        try {
            await del(`/invoices/${id}`);
        } catch (error) {
            console.error('Delete invoice error:', error);
            throw error;
        }
    },

    /**
     * Get invoice statistics
     * @param {Object} params - Query parameters
     * @param {string} [params.startDate] - Start date filter
     * @param {string} [params.endDate] - End date filter
     * @returns {Promise<InvoiceStats>}
     */
    async getInvoiceStats(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);

            const response = await get(`/invoices/stats?${queryParams.toString()}`);
            return response;
        } catch (error) {
            console.error('Get invoice stats error:', error);
            throw error;
        }
    },

    /**
     * Search invoices
     * @param {string} query - Search query
     * @param {Object} params - Additional parameters
     * @returns {Promise<Invoice[]>}
     */
    async searchInvoices(query, params = {}) {
        try {
            const queryParams = new URLSearchParams({
                q: query,
                ...params,
            });

            const response = await get(`/invoices/search?${queryParams.toString()}`);
            return response;
        } catch (error) {
            console.error('Search invoices error:', error);
            throw error;
        }
    },
};