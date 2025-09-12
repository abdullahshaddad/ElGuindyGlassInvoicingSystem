import { get, post, put, del } from '@/api/axios';

/**
 * Customer Service
 * Handles all customer-related API calls
 */
export const customerService = {
    /**
     * Get all customers
     * @returns {Promise<Customer[]>}
     */
    async getAllCustomers() {
        try {
            const response = await get('/customers');
            return response;
        } catch (error) {
            console.error('Get all customers error:', error);
            throw error;
        }
    },

    /**
     * Search customers by name or phone
     * @param {string} query - Search query (name or phone)
     * @returns {Promise<Customer[]>}
     */
    async searchCustomers(query) {
        try {
            const params = new URLSearchParams({ query });
            const response = await get(`/customers/search?${params.toString()}`);
            return response;
        } catch (error) {
            console.error('Search customers error:', error);
            throw error;
        }
    },

    /**
     * Get customer by ID
     * @param {string|number} id - Customer ID
     * @returns {Promise<Customer>}
     */
    async getCustomer(id) {
        try {
            const response = await get(`/customers/${id}`);
            return response;
        } catch (error) {
            console.error('Get customer error:', error);
            throw error;
        }
    },

    /**
     * Create new customer
     * @param {Object} customerData - Customer data
     * @param {string} customerData.name - Customer name
     * @param {string} customerData.phone - Phone number
     * @param {string} [customerData.email] - Email address
     * @param {string} [customerData.address] - Address
     * @param {string} [customerData.notes] - Notes
     * @returns {Promise<Customer>}
     */
    async createCustomer(customerData) {
        try {
            const response = await post('/customers', customerData);
            return response;
        } catch (error) {
            console.error('Create customer error:', error);
            throw error;
        }
    },

    /**
     * Update customer
     * @param {string|number} id - Customer ID
     * @param {Object} customerData - Updated customer data
     * @returns {Promise<Customer>}
     */
    async updateCustomer(id, customerData) {
        try {
            const response = await put(`/customers/${id}`, customerData);
            return response;
        } catch (error) {
            console.error('Update customer error:', error);
            throw error;
        }
    },

    /**
     * Delete customer
     * @param {string|number} id - Customer ID
     * @returns {Promise<void>}
     */
    async deleteCustomer(id) {
        try {
            await del(`/customers/${id}`);
        } catch (error) {
            console.error('Delete customer error:', error);
            throw error;
        }
    },

    /**
     * Get customer invoices
     * @param {string|number} customerId - Customer ID
     * @param {Object} params - Query parameters
     * @param {number} [params.page=0] - Page number
     * @param {number} [params.size=20] - Page size
     * @returns {Promise<PagedResponse<Invoice>>}
     */
    async getCustomerInvoices(customerId, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.page !== undefined) queryParams.append('page', params.page);
            if (params.size !== undefined) queryParams.append('size', params.size);

            const response = await get(`/customers/${customerId}/invoices?${queryParams.toString()}`);
            return response;
        } catch (error) {
            console.error('Get customer invoices error:', error);
            throw error;
        }
    },

    /**
     * Get customer statistics
     * @param {string|number} customerId - Customer ID
     * @returns {Promise<CustomerStats>}
     */
    async getCustomerStats(customerId) {
        try {
            const response = await get(`/customers/${customerId}/stats`);
            return response;
        } catch (error) {
            console.error('Get customer stats error:', error);
            throw error;
        }
    },

    /**
     * Find customer by phone
     * @param {string} phone - Phone number
     * @returns {Promise<Customer|null>}
     */
    async findByPhone(phone) {
        try {
            const customers = await this.searchCustomers(phone);
            return customers.length > 0 ? customers[0] : null;
        } catch (error) {
            console.error('Find by phone error:', error);
            throw error;
        }
    },

    /**
     * Find customers by name
     * @param {string} name - Customer name
     * @returns {Promise<Customer[]>}
     */
    async findByName(name) {
        try {
            const customers = await this.searchCustomers(name);
            return customers;
        } catch (error) {
            console.error('Find by name error:', error);
            throw error;
        }
    },

    /**
     * Get customer payment history
     * @param {string|number} customerId - Customer ID
     * @returns {Promise<Payment[]>}
     */
    async getPaymentHistory(customerId) {
        try {
            const response = await get(`/customers/${customerId}/payments`);
            return response;
        } catch (error) {
            console.error('Get payment history error:', error);
            throw error;
        }
    },

    /**
     * Export customers list
     * @param {Object} params - Export parameters
     * @returns {Promise<Blob>}
     */
    async exportCustomers(params = {}) {
        try {
            const queryParams = new URLSearchParams(params);
            const response = await get(`/customers/export?${queryParams.toString()}`, {
                responseType: 'blob',
            });

            return response;
        } catch (error) {
            console.error('Export customers error:', error);
            throw error;
        }
    },
};