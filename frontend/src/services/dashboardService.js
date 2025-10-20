import { get } from '../api/axios.js';

/**
 * Dashboard Service
 * Handles all dashboard-related API calls for statistics and analytics
 */
const dashboardService = {
    /**
     * Get dashboard statistics for the current user based on their role
     * @returns {Promise<DashboardStats>}
     */
    async getDashboardStats() {
        try {
            const response = await get('/dashboard/stats');
            return response;
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            throw error;
        }
    },

    /**
     * Get revenue statistics for a date range
     * @param {Object} params - Query parameters
     * @param {string} [params.startDate] - Start date (ISO format)
     * @param {string} [params.endDate] - End date (ISO format)
     * @param {string} [params.period] - Period type: 'today', 'week', 'month', 'year'
     * @returns {Promise<RevenueStats>}
     */
    async getRevenueStats(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);
            if (params.period) queryParams.append('period', params.period);

            const response = await get(`/dashboard/revenue?${queryParams.toString()}`);
            return response;
        } catch (error) {
            console.error('Get revenue stats error:', error);
            throw error;
        }
    },

    /**
     * Get sales overview statistics
     * @param {string} [period='month'] - Period: 'today', 'week', 'month', 'year'
     * @returns {Promise<SalesOverview>}
     */
    async getSalesOverview(period = 'month') {
        try {
            const response = await get(`/dashboard/sales-overview?period=${period}`);
            return response;
        } catch (error) {
            console.error('Get sales overview error:', error);
            throw error;
        }
    },

    /**
     * Get recent invoices for dashboard
     * @param {number} [limit=5] - Number of recent invoices to fetch
     * @returns {Promise<Invoice[]>}
     */
    async getRecentInvoices(limit = 5) {
        try {
            const response = await get(`/dashboard/recent-invoices?limit=${limit}`);
            return response;
        } catch (error) {
            console.error('Get recent invoices error:', error);
            throw error;
        }
    },

    /**
     * Get top customers by revenue
     * @param {number} [limit=5] - Number of top customers to fetch
     * @param {string} [period='month'] - Period: 'week', 'month', 'year', 'all'
     * @returns {Promise<TopCustomer[]>}
     */
    async getTopCustomers(limit = 5, period = 'month') {
        try {
            const response = await get(`/dashboard/top-customers?limit=${limit}&period=${period}`);
            return response;
        } catch (error) {
            console.error('Get top customers error:', error);
            throw error;
        }
    },

    /**
     * Get top glass types by usage
     * @param {number} [limit=5] - Number of top glass types to fetch
     * @param {string} [period='month'] - Period: 'week', 'month', 'year', 'all'
     * @returns {Promise<TopGlassType[]>}
     */
    async getTopGlassTypes(limit = 5, period = 'month') {
        try {
            const response = await get(`/dashboard/top-glass-types?limit=${limit}&period=${period}`);
            return response;
        } catch (error) {
            console.error('Get top glass types error:', error);
            throw error;
        }
    },

    /**
     * Get monthly revenue chart data
     * @param {number} [months=12] - Number of months to include
     * @returns {Promise<MonthlyData[]>}
     */
    async getMonthlyRevenue(months = 12) {
        try {
            const response = await get(`/dashboard/monthly-revenue?months=${months}`);
            return response;
        } catch (error) {
            console.error('Get monthly revenue error:', error);
            throw error;
        }
    },

    /**
     * Get factory/print job statistics (for workers and owners)
     * @returns {Promise<FactoryStats>}
     */
    async getFactoryStats() {
        try {
            const response = await get('/dashboard/factory-stats');
            return response;
        } catch (error) {
            console.error('Get factory stats error:', error);
            throw error;
        }
    },

    /**
     * Get pending tasks for current user
     * @returns {Promise<PendingTask[]>}
     */
    async getPendingTasks() {
        try {
            const response = await get('/dashboard/pending-tasks');
            return response;
        } catch (error) {
            console.error('Get pending tasks error:', error);
            throw error;
        }
    },

    /**
     * Get cashier daily summary
     * @returns {Promise<CashierSummary>}
     */
    async getCashierSummary() {
        try {
            const response = await get('/dashboard/cashier-summary');
            return response;
        } catch (error) {
            console.error('Get cashier summary error:', error);
            throw error;
        }
    },

    /**
     * Get performance metrics
     * @param {string} [period='month'] - Period: 'today', 'week', 'month', 'year'
     * @returns {Promise<PerformanceMetrics>}
     */
    async getPerformanceMetrics(period = 'month') {
        try {
            const response = await get(`/dashboard/performance?period=${period}`);
            return response;
        } catch (error) {
            console.error('Get performance metrics error:', error);
            throw error;
        }
    },
};

export default dashboardService;