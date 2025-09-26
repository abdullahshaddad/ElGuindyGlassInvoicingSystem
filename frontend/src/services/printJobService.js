import { get, post, put, del } from '@/api/axios';

/**
 * Print Job Service - Aligned with Backend Implementation
 * Handles all print job management for factory workers
 */
export const printJobService = {
    /**
     * Get queued print jobs (backend endpoint: /print-jobs/queue)
     * @returns {Promise<PrintJob[]>}
     */
    async getQueuedJobs() {
        try {
            const response = await get('/print-jobs/queue');
            return response;
        } catch (error) {
            console.error('Get queued jobs error:', error);
            throw error;
        }
    },

    /**
     * Mark print job as printing (backend endpoint: /print-jobs/{id}/printing)
     * @param {string|number} id - Print job ID
     * @returns {Promise<PrintJob>}
     */
    async markAsPrinting(id) {
        try {
            const response = await put(`/print-jobs/${id}/printing`);
            return response;
        } catch (error) {
            console.error('Mark as printing error:', error);
            throw error;
        }
    },

    /**
     * Mark print job as printed (backend endpoint: /print-jobs/{id}/printed)
     * @param {string|number} id - Print job ID
     * @returns {Promise<PrintJob>}
     */
    async markAsPrinted(id) {
        try {
            const response = await put(`/print-jobs/${id}/printed`);
            return response;
        } catch (error) {
            console.error('Mark as printed error:', error);
            throw error;
        }
    },

    /**
     * Mark print job as failed (backend endpoint: /print-jobs/{id}/failed)
     * @param {string|number} id - Print job ID
     * @param {string} errorMessage - Error message
     * @returns {Promise<PrintJob>}
     */
    async markAsFailed(id, errorMessage) {
        try {
            const response = await put(`/print-jobs/${id}/failed`, errorMessage);
            return response;
        } catch (error) {
            console.error('Mark as failed error:', error);
            throw error;
        }
    },

    /**
     * Create sticker print job (backend endpoint: /factory/print-sticker/{invoiceId})
     * @param {string|number} invoiceId - Invoice ID
     * @returns {Promise<PrintJob>}
     */
    async createStickerPrintJob(invoiceId) {
        try {
            const response = await post(`/factory/print-sticker/${invoiceId}`);
            return response;
        } catch (error) {
            console.error('Create sticker print job error:', error);
            throw error;
        }
    },

    // ===== REMOVED METHODS =====
    // These methods don't exist in the backend and should not be used:
    // - createPrintJob (print jobs are auto-created when invoice is created)
    // - listPrintJobs (no pagination endpoint in backend)
    // - getPrintJob (no single job endpoint)
    // - updatePrintJob (no update endpoint)
    // - deletePrintJob (no delete endpoint)
    // - startPrintJob (use markAsPrinting instead)
    // - completePrintJob (use markAsPrinted instead)
    // - cancelPrintJob (use markAsFailed instead)
    // - getPendingJobs (use getQueuedJobs instead)

    // ===== UTILITY METHODS =====

    /**
     * Get print job status display text in Arabic
     * @param {string} status - Print job status
     * @returns {string} Arabic status text
     */
    getStatusText(status) {
        const statusMap = {
            'QUEUED': 'في الانتظار',
            'PRINTING': 'قيد الطباعة',
            'PRINTED': 'مطبوع',
            'FAILED': 'فشل'
        };
        return statusMap[status] || status;
    },

    /**
     * Get print job type display text in Arabic
     * @param {string} type - Print job type
     * @returns {string} Arabic type text
     */
    getTypeText(type) {
        const typeMap = {
            'CLIENT': 'نسخة العميل',
            'OWNER': 'نسخة المالك',
            'STICKER': 'ملصق'
        };
        return typeMap[type] || type;
    },

    /**
     * Check if print job can be marked as printing
     * @param {PrintJob} job - Print job object
     * @returns {boolean}
     */
    canMarkAsPrinting(job) {
        return job && job.status === 'QUEUED';
    },

    /**
     * Check if print job can be marked as printed
     * @param {PrintJob} job - Print job object
     * @returns {boolean}
     */
    canMarkAsPrinted(job) {
        return job && job.status === 'PRINTING';
    },

    /**
     * Check if print job can be marked as failed
     * @param {PrintJob} job - Print job object
     * @returns {boolean}
     */
    canMarkAsFailed(job) {
        return job && ['QUEUED', 'PRINTING'].includes(job.status);
    }
};