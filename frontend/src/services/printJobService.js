import { get, post, put, del } from '@/api/axios';

/**
 * Print Job Service - Aligned with New Backend Implementation
 * Handles all print job management including on-demand creation
 */
export const printJobService = {
    // ===== PRINT JOB CREATION (NEW) =====

    /**
     * Create all print jobs (CLIENT, OWNER, STICKER) for an invoice
     * @param {string|number} invoiceId - Invoice ID
     * @returns {Promise<{success: boolean, message: string, status: PrintJobStatus}>}
     */
    async createAllPrintJobs(invoiceId) {
        try {
            const response = await post(`/print-jobs/invoice/${invoiceId}`);
            return response;
        } catch (error) {
            console.error('Create all print jobs error:', error);
            throw error;
        }
    },

    /**
     * Create a single print job for an invoice
     * @param {string|number} invoiceId - Invoice ID
     * @param {string} printType - Print type (CLIENT, OWNER, STICKER)
     * @returns {Promise<{success: boolean, message: string, printJob: PrintJob}>}
     */
    async createSinglePrintJob(invoiceId, printType) {
        try {
            const response = await post(`/print-jobs/invoice/${invoiceId}/${printType}`);
            return response;
        } catch (error) {
            console.error('Create single print job error:', error);
            throw error;
        }
    },

    /**
     * Retry a failed print job
     * @param {string|number} invoiceId - Invoice ID
     * @param {string} printType - Print type (CLIENT, OWNER, STICKER)
     * @returns {Promise<{success: boolean, message: string, printJob: PrintJob}>}
     */
    async retryPrintJob(invoiceId, printType) {
        try {
            const response = await post(`/print-jobs/invoice/${invoiceId}/retry/${printType}`);
            return response;
        } catch (error) {
            console.error('Retry print job error:', error);
            throw error;
        }
    },

    // ===== PRINT JOB STATUS =====

    /**
     * Get print job status for an invoice
     * @param {string|number} invoiceId - Invoice ID
     * @returns {Promise<PrintJobStatus>}
     */
    async getPrintJobStatus(invoiceId) {
        try {
            const response = await get(`/print-jobs/invoice/${invoiceId}/status`);
            return response;
        } catch (error) {
            console.error('Get print job status error:', error);
            throw error;
        }
    },

    /**
     * Get all print jobs for an invoice
     * @param {string|number} invoiceId - Invoice ID
     * @returns {Promise<PrintJob[]>}
     */
    async getPrintJobsByInvoice(invoiceId) {
        try {
            const response = await get(`/print-jobs/invoice/${invoiceId}`);
            return response;
        } catch (error) {
            console.error('Get print jobs by invoice error:', error);
            throw error;
        }
    },

    /**
     * Get a single print job by ID
     * @param {string|number} jobId - Print job ID
     * @returns {Promise<PrintJob>}
     */
    async getPrintJob(jobId) {
        try {
            const response = await get(`/print-jobs/${jobId}`);
            return response;
        } catch (error) {
            console.error('Get print job error:', error);
            throw error;
        }
    },

    // ===== PRINT QUEUE MANAGEMENT =====

    /**
     * Get queued print jobs (for factory workers)
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
     * Get all failed print jobs
     * @returns {Promise<PrintJob[]>}
     */
    async getFailedJobs() {
        try {
            const response = await get('/print-jobs/failed');
            return response;
        } catch (error) {
            console.error('Get failed jobs error:', error);
            throw error;
        }
    },

    // ===== PRINT JOB STATUS UPDATES =====

    /**
     * Mark print job as printing
     * @param {string|number} jobId - Print job ID
     * @returns {Promise<PrintJob>}
     */
    async markAsPrinting(jobId) {
        try {
            const response = await put(`/print-jobs/${jobId}/printing`);
            return response;
        } catch (error) {
            console.error('Mark as printing error:', error);
            throw error;
        }
    },

    /**
     * Mark print job as printed
     * @param {string|number} jobId - Print job ID
     * @returns {Promise<PrintJob>}
     */
    async markAsPrinted(jobId) {
        try {
            const response = await put(`/print-jobs/${jobId}/printed`);
            return response;
        } catch (error) {
            console.error('Mark as printed error:', error);
            throw error;
        }
    },

    /**
     * Mark print job as failed
     * @param {string|number} jobId - Print job ID
     * @param {string} errorMessage - Error message
     * @returns {Promise<PrintJob>}
     */
    async markAsFailed(jobId, errorMessage) {
        try {
            const response = await put(`/print-jobs/${jobId}/failed`, {
                errorMessage: errorMessage || 'Unknown error'
            });
            return response;
        } catch (error) {
            console.error('Mark as failed error:', error);
            throw error;
        }
    },

    // ===== PRINT JOB MANAGEMENT =====

    /**
     * Delete a print job (Owner only)
     * @param {string|number} jobId - Print job ID
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async deletePrintJob(jobId) {
        try {
            const response = await del(`/print-jobs/${jobId}`);
            return response;
        } catch (error) {
            console.error('Delete print job error:', error);
            throw error;
        }
    },

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
     * Get status color for UI
     * @param {string} status - Print job status
     * @returns {string} Tailwind color class
     */
    getStatusColor(status) {
        const colorMap = {
            'QUEUED': 'blue',
            'PRINTING': 'yellow',
            'PRINTED': 'green',
            'FAILED': 'red'
        };
        return colorMap[status] || 'gray';
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
    },

    /**
     * Check if print job can be retried
     * @param {PrintJob} job - Print job object
     * @returns {boolean}
     */
    canRetry(job) {
        return job && job.status === 'FAILED';
    },

    /**
     * Check if print job can be deleted
     * @param {PrintJob} job - Print job object
     * @returns {boolean}
     */
    canDelete(job) {
        return job && ['FAILED', 'PRINTED'].includes(job.status);
    },

    /**
     * Get PDF URL for print job
     * @param {PrintJob} job - Print job object
     * @returns {string|null} PDF URL
     */
    getPdfUrl(job) {
        if (!job || !job.pdfPath) return null;

        // If it's already a full URL, return as is
        if (job.pdfPath.startsWith('http')) {
            return job.pdfPath;
        }

        // Otherwise, construct the URL (though backend should return full URLs)
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        return `${baseUrl}${job.pdfPath}`;
    },

    /**
     * Open PDF in new tab
     * @param {PrintJob} job - Print job object
     */
    openPdf(job) {
        const url = this.getPdfUrl(job);
        if (url) {
            window.open(url, '_blank');
        }
    },

    /**
     * Download PDF
     * @param {PrintJob} job - Print job object
     * @param {string} [filename] - Custom filename
     */
    async downloadPdf(job, filename) {
        const url = this.getPdfUrl(job);
        if (!url) return;

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename || `print-job-${job.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download PDF error:', error);
            throw error;
        }
    },

    /**
     * Print PDF directly (opens print dialog)
     * @param {PrintJob} job - Print job object
     */
    async printPdf(job) {
        const url = this.getPdfUrl(job);
        if (!url) return;

        try {
            // Open in new window and trigger print
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = function() {
                    printWindow.print();
                };
            }
        } catch (error) {
            console.error('Print PDF error:', error);
            throw error;
        }
    }
};

/**
 * TypeScript type definitions (for reference)
 *
 * @typedef {Object} PrintJob
 * @property {number} id
 * @property {number} invoiceId
 * @property {string} type - CLIENT, OWNER, STICKER
 * @property {string} status - QUEUED, PRINTING, PRINTED, FAILED
 * @property {string} pdfPath - MinIO URL
 * @property {string} [errorMessage]
 * @property {string} createdAt - ISO date string
 * @property {string} [printedAt] - ISO date string
 *
 * @typedef {Object} PrintJobStatus
 * @property {number} invoiceId
 * @property {number} totalJobs
 * @property {number} successfulJobs
 * @property {number} failedJobs
 * @property {boolean} allJobsComplete
 * @property {string[]} missingJobTypes
 * @property {PrintJob[]} jobs
 */