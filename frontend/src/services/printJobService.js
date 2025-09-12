import { get, post, put, del } from '@/api/axios';

/**
 * Print Job Service
 * Handles all print job management for factory workers
 */
export const printJobService = {
    /**
     * Create new print job
     * @param {Object} printJobData - Print job data
     * @param {string|number} printJobData.invoiceId - Related invoice ID
     * @param {string} printJobData.glassType - Glass type
     * @param {number} printJobData.width - Width dimension
     * @param {number} printJobData.height - Height dimension
     * @param {number} printJobData.quantity - Quantity to print
     * @param {string} [printJobData.notes] - Special instructions
     * @returns {Promise<PrintJob>}
     */
    async createPrintJob(printJobData) {
        try {
            const response = await post('/print-jobs', printJobData);
            return response;
        } catch (error) {
            console.error('Create print job error:', error);
            throw error;
        }
    },

    /**
     * Get all print jobs
     * @param {Object} params - Query parameters
     * @param {number} [params.page=0] - Page number
     * @param {number} [params.size=20] - Page size
     * @param {string} [params.status] - Filter by status
     * @param {string} [params.startDate] - Start date filter
     * @param {string} [params.endDate] - End date filter
     * @returns {Promise<PagedResponse<PrintJob>>}
     */
    async listPrintJobs(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.page !== undefined) queryParams.append('page', params.page);
            if (params.size !== undefined) queryParams.append('size', params.size);
            if (params.status) queryParams.append('status', params.status);
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);

            const response = await get(`/print-jobs?${queryParams.toString()}`);
            return response;
        } catch (error) {
            console.error('List print jobs error:', error);
            throw error;
        }
    },

    /**
     * Get print job by ID
     * @param {string|number} id - Print job ID
     * @returns {Promise<PrintJob>}
     */
    async getPrintJob(id) {
        try {
            const response = await get(`/print-jobs/${id}`);
            return response;
        } catch (error) {
            console.error('Get print job error:', error);
            throw error;
        }
    },

    /**
     * Update print job
     * @param {string|number} id - Print job ID
     * @param {Object} printJobData - Updated data
     * @returns {Promise<PrintJob>}
     */
    async updatePrintJob(id, printJobData) {
        try {
            const response = await put(`/print-jobs/${id}`, printJobData);
            return response;
        } catch (error) {
            console.error('Update print job error:', error);
            throw error;
        }
    },

    /**
     * Delete print job
     * @param {string|number} id - Print job ID
     * @returns {Promise<void>}
     */
    async deletePrintJob(id) {
        try {
            await del(`/print-jobs/${id}`);
        } catch (error) {
            console.error('Delete print job error:', error);
            throw error;
        }
    },

    /**
     * Start print job (mark as in progress)
     * @param {string|number} id - Print job ID
     * @returns {Promise<PrintJob>}
     */
    async startPrintJob(id) {
        try {
            const response = await put(`/print-jobs/${id}/start`);
            return response;
        } catch (error) {
            console.error('Start print job error:', error);
            throw error;
        }
    },

    /**
     * Complete print job
     * @param {string|number} id - Print job ID
     * @param {Object} completionData
     * @param {number} [completionData.actualQuantity] - Actual quantity printed
     * @param {string} [completionData.notes] - Completion notes
     * @returns {Promise<PrintJob>}
     */
    async completePrintJob(id, completionData = {}) {
        try {
            const response = await put(`/print-jobs/${id}/complete`, completionData);
            return response;
        } catch (error) {
            console.error('Complete print job error:', error);
            throw error;
        }
    },

    /**
     * Cancel print job
     * @param {string|number} id - Print job ID
     * @param {string} reason - Cancellation reason
     * @returns {Promise<PrintJob>}
     */
    async cancelPrintJob(id, reason) {
        try {
            const response = await put(`/print-jobs/${id}/cancel`, { reason });
            return response;
        } catch (error) {
            console.error('Cancel print job error:', error);
            throw error;
        }
    },

    /**
     * Get pending print jobs (for workers)
     * @returns {Promise<PrintJob[]>}
     */
    async getPendingJobs() {
        try {
            const response = await get('/print-jobs/pending');
            return response;
        } catch (error) {
            console.error('Get pending jobs error:', error);
            throw error;
        }
    },

    /**
     * Get print jobs by invoice
     * @param {string|number} invoiceId - Invoice ID
     * @returns {Promise<PrintJob[]>}
     */
    async getJobsByInvoice(invoiceId) {
        try {
            const response = await get(`/print-jobs/invoice/${invoiceId}`);
            return response;
        } catch (error) {
            console.error('Get jobs by invoice error:', error);
            throw error;
        }
    },

    /**
     * Get print job statistics
     * @param {Object} params - Query parameters
     * @param {string} [params.startDate] - Start date
     * @param {string} [params.endDate] - End date
     * @returns {Promise<PrintJobStats>}
     */
    async getStats(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);

            const response = await get(`/print-jobs/stats?${queryParams.toString()}`);
            return response;
        } catch (error) {
            console.error('Get print job stats error:', error);
            throw error;
        }
    },

    /**
     * Assign print job to worker
     * @param {string|number} id - Print job ID
     * @param {string|number} workerId - Worker ID
     * @returns {Promise<PrintJob>}
     */
    async assignToWorker(id, workerId) {
        try {
            const response = await put(`/print-jobs/${id}/assign`, { workerId });
            return response;
        } catch (error) {
            console.error('Assign to worker error:', error);
            throw error;
        }
    },

    /**
     * Get worker's assigned jobs
     * @param {string|number} workerId - Worker ID
     * @returns {Promise<PrintJob[]>}
     */
    async getWorkerJobs(workerId) {
        try {
            const response = await get(`/print-jobs/worker/${workerId}`);
            return response;
        } catch (error) {
            console.error('Get worker jobs error:', error);
            throw error;
        }
    },

    /**
     * Update print job priority
     * @param {string|number} id - Print job ID
     * @param {string} priority - Priority level (LOW, NORMAL, HIGH, URGENT)
     * @returns {Promise<PrintJob>}
     */
    async updatePriority(id, priority) {
        try {
            const response = await put(`/print-jobs/${id}/priority`, { priority });
            return response;
        } catch (error) {
            console.error('Update priority error:', error);
            throw error;
        }
    },

    /**
     * Add notes to print job
     * @param {string|number} id - Print job ID
     * @param {string} notes - Additional notes
     * @returns {Promise<PrintJob>}
     */
    async addNotes(id, notes) {
        try {
            const response = await put(`/print-jobs/${id}/notes`, { notes });
            return response;
        } catch (error) {
            console.error('Add notes error:', error);
            throw error;
        }
    },

    /**
     * Export print jobs to CSV
     * @param {Object} params - Export parameters
     * @returns {Promise<Blob>}
     */
    async exportPrintJobs(params = {}) {
        try {
            const queryParams = new URLSearchParams(params);
            const response = await get(`/print-jobs/export?${queryParams.toString()}`, {
                responseType: 'blob',
            });

            return response;
        } catch (error) {
            console.error('Export print jobs error:', error);
            throw error;
        }
    },
};