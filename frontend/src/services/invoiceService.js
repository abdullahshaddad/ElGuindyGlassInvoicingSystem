import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * Get a single invoice by ID
 * @param {string|undefined} invoiceId - Convex invoice ID
 * @returns {Object|undefined} Enriched invoice object
 */
export function useInvoice(invoiceId) {
    return useQuery(
        api.invoices.queries.getInvoice,
        invoiceId ? { invoiceId } : "skip"
    );
}

/**
 * List invoices with pagination and optional filters
 * Uses Convex paginated query for infinite scroll / load more
 * @param {Object} params - Query parameters
 * @param {string} [params.status] - Invoice status filter
 * @param {string} [params.customerId] - Customer ID filter
 * @param {number} [params.startDate] - Start date timestamp
 * @param {number} [params.endDate] - End date timestamp
 * @param {Object} [params.paginationOpts] - Convex pagination options
 * @returns {Object} Paginated query result { results, status, loadMore, isLoading }
 */
export function useInvoices(params = {}) {
    const { status, customerId, startDate, endDate, ...paginationOpts } = params;
    const args = {};
    if (status) args.status = status;
    if (customerId) args.customerId = customerId;
    if (startDate) args.startDate = startDate;
    if (endDate) args.endDate = endDate;

    return usePaginatedQuery(
        api.invoices.queries.listInvoices,
        args,
        paginationOpts.initialNumItems
            ? { initialNumItems: paginationOpts.initialNumItems }
            : { initialNumItems: 20 }
    );
}

/**
 * Get revenue for a date range
 * @param {Object} params - Query parameters
 * @param {number} [params.startDate] - Start date timestamp
 * @param {number} [params.endDate] - End date timestamp
 * @returns {Object|undefined} Revenue data
 */
export function useRevenue(params = {}) {
    const args = {};
    if (params.startDate) args.startDate = params.startDate;
    if (params.endDate) args.endDate = params.endDate;

    return useQuery(api.invoices.queries.getRevenue, args);
}

/**
 * Preview line calculation before creating invoice
 * Skips the query if required fields are missing.
 * @param {Object} params
 * @param {string} params.glassTypeId
 * @param {number} params.width - Width in selected unit
 * @param {number} params.height - Height in selected unit
 * @param {string} params.measuringUnit - MM, CM, or M
 * @param {Array}  [params.operations] - Operations in backend bilingual format
 * @param {number} [params.diameter]
 * @returns {Object|undefined} Line preview calculation result
 */
export function usePreviewLineCalculation(params) {
    const isComplete =
        params?.glassTypeId &&
        params?.width > 0 &&
        params?.height > 0 &&
        params?.measuringUnit;

    const args = isComplete
        ? {
              glassTypeId: params.glassTypeId,
              dimensions: {
                  width: params.width,
                  height: params.height,
                  measuringUnit: params.measuringUnit,
              },
              ...(params.operations ? { operations: params.operations } : {}),
              ...(params.diameter ? { diameter: params.diameter } : {}),
          }
        : "skip";

    return useQuery(api.invoices.queries.previewLineCalculation, args);
}

// ===== MUTATION HOOKS =====

/**
 * Create a new invoice
 * @returns {Function} Mutation function - call with { customerId, lines, notes?, payments[] }
 */
export function useCreateInvoice() {
    return useMutation(api.invoices.mutations.createInvoice);
}

/**
 * Mark an invoice as paid
 * @returns {Function} Mutation function - call with { invoiceId }
 */
export function useMarkAsPaid() {
    return useMutation(api.invoices.mutations.markAsPaid);
}

/**
 * Delete an invoice
 * @returns {Function} Mutation function - call with { invoiceId }
 */
export function useDeleteInvoice() {
    return useMutation(api.invoices.mutations.deleteInvoice);
}

/**
 * Update invoice line status (for factory workers and general use)
 * @returns {Function} Mutation function - call with { lineId, status }
 */
export function useUpdateLineStatus() {
    return useMutation(api.invoices.mutations.updateLineStatus);
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get invoice status display text in Arabic
 * @param {string} status - Invoice status
 * @returns {string} Arabic status text
 */
export const getStatusText = (status) => {
    const statusMap = {
        PENDING: 'قيد الانتظار',
        PAID: 'مدفوعة',
        PARTIALLY_PAID: 'مدفوعة جزئياً',
        CANCELLED: 'ملغاة',
        OVERDUE: 'متأخرة',
    };
    return statusMap[status] || status;
};

/**
 * Get status color for UI
 * @param {string} status - Invoice status
 * @returns {string} Color name
 */
export const getStatusColor = (status) => {
    const colorMap = {
        PENDING: 'yellow',
        PAID: 'green',
        PARTIALLY_PAID: 'blue',
        CANCELLED: 'red',
        OVERDUE: 'orange',
    };
    return colorMap[status] || 'gray';
};

/**
 * Format invoice number for display
 * @param {Object} invoice - Invoice object
 * @returns {string} Formatted invoice number
 */
export const formatInvoiceNumber = (invoice) =>
    invoice?.readableId || String(invoice?.invoiceNumber || invoice?._id || '');

/**
 * Calculate invoice age in days
 * @param {Object} invoice - Invoice object
 * @returns {number} Days since invoice creation
 */
export const getInvoiceAge = (invoice) => {
    if (!invoice?.issueDate) return 0;
    const issueDate = new Date(invoice.issueDate);
    const now = new Date();
    return Math.floor((now - issueDate) / (1000 * 60 * 60 * 24));
};

/**
 * Check if invoice is overdue
 * @param {Object} invoice - Invoice object
 * @param {number} [dueDays=30] - Days until invoice is due
 * @returns {boolean}
 */
export const isOverdue = (invoice, dueDays = 30) => {
    if (invoice?.status === 'PAID' || invoice?.status === 'CANCELLED') return false;
    return getInvoiceAge(invoice) > dueDays;
};

/**
 * Format currency amount in Arabic
 * @param {number} amount - Amount
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) =>
    `${(amount || 0).toFixed(2)} جنيه`;

/**
 * Format date for display in Arabic
 * @param {number|string} dateValue - Date value (timestamp or ISO string)
 * @returns {string} Formatted date in Arabic
 */
export const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    const date =
        typeof dateValue === 'number' ? new Date(dateValue) : new Date(dateValue);
    return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
};

/**
 * Format date and time for display in Arabic
 * @param {number|string} dateValue - Date value (timestamp or ISO string)
 * @returns {string} Formatted date and time in Arabic
 */
export const formatDateTime = (dateValue) => {
    if (!dateValue) return '-';
    const date =
        typeof dateValue === 'number' ? new Date(dateValue) : new Date(dateValue);
    return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

/**
 * Validate invoice data before submission
 * @param {Object} invoiceData - Invoice data to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validateInvoiceData = (invoiceData) => {
    const errors = [];
    if (!invoiceData?.customerId) errors.push('يجب اختيار العميل');
    if (!invoiceData?.lines?.length) errors.push('يجب إضافة منتج واحد على الأقل');
    invoiceData?.lines?.forEach((line, i) => {
        if (!line.glassTypeId)
            errors.push(`السطر ${i + 1}: يجب اختيار نوع الزجاج`);
        const dims = line.dimensions;
        if (!dims?.width || dims.width <= 0)
            errors.push(`السطر ${i + 1}: العرض غير صحيح`);
        if (!dims?.height || dims.height <= 0)
            errors.push(`السطر ${i + 1}: الطول غير صحيح`);
        if (!dims?.measuringUnit)
            errors.push(`السطر ${i + 1}: يجب تحديد وحدة القياس`);
    });
    return { valid: errors.length === 0, errors };
};

/**
 * Calculate total from invoice lines (client-side)
 * @param {Array} lines - Invoice lines
 * @returns {number} Total amount
 */
export const calculateTotal = (lines) =>
    (lines || []).reduce((sum, line) => sum + (line.lineTotal || 0), 0);
