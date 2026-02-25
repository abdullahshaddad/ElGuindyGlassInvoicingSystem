import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * Get all print jobs for an invoice (real-time)
 * @param {string} invoiceId - Invoice ID
 * @returns {Array|undefined} List of print jobs for the invoice
 */
export function useInvoicePrintJobs(invoiceId) {
    return useQuery(
        api.printJobs.queries.getInvoicePrintJobs,
        invoiceId ? { invoiceId } : "skip"
    );
}

/**
 * Get a single print job by ID (real-time, includes pdfUrl)
 * @param {string} printJobId - Print job ID
 * @returns {Object|undefined} Print job with pdfUrl
 */
export function usePrintJob(printJobId) {
    return useQuery(
        api.printJobs.queries.getPrintJob,
        printJobId ? { printJobId } : "skip"
    );
}

/**
 * Get all pending print jobs (for factory workers, real-time)
 * @returns {Array|undefined} List of pending print jobs
 */
export function usePendingPrintJobs() {
    return useQuery(api.printJobs.queries.getPendingPrintJobs, {});
}

// ===== MUTATION HOOKS =====

/**
 * Create a new print job for an invoice
 * Usage: const createPrintJob = useCreatePrintJob();
 *        await createPrintJob({ invoiceId, type, invoiceLineId });
 * @returns {Function} Mutation function accepting { invoiceId, type, invoiceLineId? }
 */
export function useCreatePrintJob() {
    return useMutation(api.printJobs.mutations.createPrintJob);
}

/**
 * Update a print job's status
 * Usage: const updateStatus = useUpdatePrintJobStatus();
 *        await updateStatus({ printJobId, status, errorMessage, pdfStorageId });
 * @returns {Function} Mutation function accepting { printJobId, status, errorMessage?, pdfStorageId? }
 */
export function useUpdatePrintJobStatus() {
    return useMutation(api.printJobs.mutations.updatePrintJobStatus);
}

/**
 * Delete a print job
 * Usage: const deletePrintJob = useDeletePrintJob();
 *        await deletePrintJob({ printJobId });
 * @returns {Function} Mutation function accepting { printJobId }
 */
export function useDeletePrintJob() {
    return useMutation(api.printJobs.mutations.deletePrintJob);
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get print job status display text in Arabic
 * @param {string} status - Print job status
 * @returns {string} Arabic status text
 */
export const getStatusText = (status) => {
    const map = { QUEUED: 'في الانتظار', PRINTING: 'قيد الطباعة', PRINTED: 'مطبوع', FAILED: 'فشل' };
    return map[status] || status;
};

/**
 * Get print job type display text in Arabic
 * @param {string} type - Print job type
 * @returns {string} Arabic type text
 */
export const getTypeText = (type) => {
    const map = { CLIENT: 'نسخة العميل', OWNER: 'نسخة المالك', STICKER: 'ملصق' };
    return map[type] || type;
};

/**
 * Get status color for UI
 * @param {string} status - Print job status
 * @returns {string} Color name (blue, yellow, green, red, gray)
 */
export const getStatusColor = (status) => {
    const map = { QUEUED: 'blue', PRINTING: 'yellow', PRINTED: 'green', FAILED: 'red' };
    return map[status] || 'gray';
};

/**
 * Check if print job can be marked as printing
 * @param {Object} job - Print job object
 * @returns {boolean}
 */
export const canMarkAsPrinting = (job) => job?.status === 'QUEUED';

/**
 * Check if print job can be marked as printed
 * @param {Object} job - Print job object
 * @returns {boolean}
 */
export const canMarkAsPrinted = (job) => job?.status === 'PRINTING';

/**
 * Check if print job can be marked as failed
 * @param {Object} job - Print job object
 * @returns {boolean}
 */
export const canMarkAsFailed = (job) => ['QUEUED', 'PRINTING'].includes(job?.status);

/**
 * Check if print job can be retried
 * @param {Object} job - Print job object
 * @returns {boolean}
 */
export const canRetry = (job) => job?.status === 'FAILED';

/**
 * Check if print job can be deleted
 * @param {Object} job - Print job object
 * @returns {boolean}
 */
export const canDelete = (job) => ['FAILED', 'PRINTED'].includes(job?.status);

/**
 * Open PDF from a print job's pdfUrl in a new tab
 * @param {Object} job - Print job object with pdfUrl field
 */
export const openPdf = (job) => {
    if (job?.pdfUrl) window.open(job.pdfUrl, '_blank');
};
