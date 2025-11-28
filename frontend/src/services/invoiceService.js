import { get, post, put, del } from '@/api/axios';

/**
 * Invoice Service
 * Handles all invoice-related API calls
 * Note: Print jobs are now created separately via printJobService
 */
export const invoiceService = {
    // ===== INVOICE CRUD =====

    /**
     * Create new invoice (without print jobs)
     * Print jobs should be created separately using printJobService.createAllPrintJobs()
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
     * @param {string} [params.status] - Invoice status filter
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
            if (params.status) queryParams.append('status', params.status);

            const response = await get(`/invoices?${queryParams.toString()}`);

            // Handle paginated response from Spring Boot
            return {
                content: response.content || response,
                totalElements: response.totalElements || response.length || 0,
                totalPages: response.totalPages || 1,
                number: response.number || 0,
                size: response.size || (response.length || 20),
                first: response.first !== undefined ? response.first : true,
                last: response.last !== undefined ? response.last : true
            };
        } catch (error) {
            console.error('List invoices error:', error);
            throw error;
        }
    },

    /**
     * Update invoice
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
     * Delete invoice
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

    // ===== INVOICE STATUS =====

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
     * Mark invoice as cancelled
     * @param {string|number} id - Invoice ID
     * @returns {Promise<Invoice>}
     */
    async markAsCancelled(id) {
        try {
            const response = await put(`/invoices/${id}/cancel`);
            return response;
        } catch (error) {
            console.error('Mark as cancelled error:', error);
            throw error;
        }
    },

    // ===== INVOICE ANALYTICS =====

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

    // ===== INVOICE SEARCH =====

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

    /**
     * Get invoices by customer ID
     * @param {string|number} customerId - Customer ID
     * @param {Object} params - Query parameters
     * @returns {Promise<PagedResponse<Invoice>>}
     */
    async getInvoicesByCustomer(customerId, params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.page !== undefined) queryParams.append('page', params.page);
            if (params.size !== undefined) queryParams.append('size', params.size);

            const response = await get(`/invoices/customer/${customerId}?${queryParams.toString()}`);

            return {
                content: response.content || response,
                totalElements: response.totalElements || response.length || 0,
                totalPages: response.totalPages || 1,
                number: response.number || 0,
                size: response.size || (response.length || 20),
                first: response.first !== undefined ? response.first : true,
                last: response.last !== undefined ? response.last : true
            };
        } catch (error) {
            console.error('Get invoices by customer error:', error);
            throw error;
        }
    },

    /**
     * Get recent invoices
     * @param {Object} params - Query parameters
     * @returns {Promise<PagedResponse<Invoice>>}
     */
    async getRecentInvoices(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.page !== undefined) queryParams.append('page', params.page);
            if (params.size !== undefined) queryParams.append('size', params.size);

            const response = await get(`/invoices/recent?${queryParams.toString()}`);

            return {
                content: response.content || response,
                totalElements: response.totalElements || response.length || 0,
                totalPages: response.totalPages || 1,
                number: response.number || 0,
                size: response.size || (response.length || 20),
                first: response.first !== undefined ? response.first : true,
                last: response.last !== undefined ? response.last : true
            };
        } catch (error) {
            console.error('Get recent invoices error:', error);
            throw error;
        }
    },

    // ===== INVOICE EXPORT =====

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

    // ===== LINE PREVIEW =====

    /**
     * Preview line calculation before creating invoice
     * This allows frontend to show exact calculation that backend will use
     * UPDATED: Uses new shatafType/farmaType fields instead of legacy cuttingType
     * @param {Object} lineData - Line data
     * @param {number} lineData.glassTypeId - Glass type ID
     * @param {number} lineData.width - Width in selected unit
     * @param {number} lineData.height - Height in selected unit
     * @param {string} lineData.dimensionUnit - MM, CM, or M
     * @param {string} lineData.shatafType - Shataf type (KHARAZAN, LASER, etc.)
     * @param {string} lineData.farmaType - Farma type (NORMAL_SHATAF, WHEEL_CUT, etc.)
     * @param {number} [lineData.diameter] - Required for WHEEL_CUT farma type
     * @param {number} [lineData.manualCuttingPrice] - Required for manual shataf types (LASER, ROTATION, TABLEAUX)
     * @returns {Promise<LinePreviewDTO>}
     */
    async previewLineCalculation(lineData) {
        try {
            const response = await post('/invoices/preview-line', {
                glassTypeId: lineData.glassTypeId,
                width: lineData.width,
                height: lineData.height,
                dimensionUnit: lineData.dimensionUnit || 'MM',
                shatafType: lineData.shatafType,
                farmaType: lineData.farmaType,
                diameter: lineData.diameter || null,
                manualCuttingPrice: lineData.manualCuttingPrice || null
            });

            return response;
        } catch (error) {
            console.error('Preview line calculation error:', error);
            throw error;
        }
    },

    // ===== UTILITY METHODS =====

    /**
     * Get invoice status display text in Arabic
     * @param {string} status - Invoice status
     * @returns {string} Arabic status text
     */
    getStatusText(status) {
        const statusMap = {
            'PENDING': 'قيد الانتظار',
            'PAID': 'مدفوعة',
            'CANCELLED': 'ملغاة',
            'OVERDUE': 'متأخرة'
        };
        return statusMap[status] || status;
    },

    /**
     * Get status color for UI
     * @param {string} status - Invoice status
     * @returns {string} Tailwind color class
     */
    getStatusColor(status) {
        const colorMap = {
            'PENDING': 'yellow',
            'PAID': 'green',
            'CANCELLED': 'red',
            'OVERDUE': 'orange'
        };
        return colorMap[status] || 'gray';
    },

    /**
     * Format invoice number
     * @param {Invoice} invoice - Invoice object
     * @returns {string} Formatted invoice number
     */
    formatInvoiceNumber(invoice) {
        if (!invoice) return '';
        return `INV-${String(invoice.id).padStart(6, '0')}`;
    },

    /**
     * Calculate invoice age in days
     * @param {Invoice} invoice - Invoice object
     * @returns {number} Days since invoice creation
     */
    getInvoiceAge(invoice) {
        if (!invoice || !invoice.issueDate) return 0;
        const issueDate = new Date(invoice.issueDate);
        const now = new Date();
        const diffTime = Math.abs(now - issueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },

    /**
     * Check if invoice is overdue
     * @param {Invoice} invoice - Invoice object
     * @param {number} [dueDays=30] - Days until invoice is due
     * @returns {boolean}
     */
    isOverdue(invoice, dueDays = 30) {
        if (!invoice || invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
            return false;
        }
        return this.getInvoiceAge(invoice) > dueDays;
    },

    /**
     * Format currency
     * @param {number} amount - Amount
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        if (typeof amount !== 'number') return '0 جنيه';
        return `${amount.toFixed(2)} جنيه`;
    },

    /**
     * Download invoice as PDF (if endpoint exists)
     * @param {string|number} id - Invoice ID
     * @returns {Promise<Blob>}
     */
    async downloadInvoicePdf(id) {
        try {
            const response = await get(`/invoices/${id}/pdf`, {
                responseType: 'blob',
            });
            return response;
        } catch (error) {
            console.error('Download invoice PDF error:', error);
            throw error;
        }
    },

    /**
     * Validate invoice data before submission
     * @param {CreateInvoiceRequest} invoiceData - Invoice data to validate
     * @returns {{valid: boolean, errors: string[]}}
     */
    validateInvoiceData(invoiceData) {
        const errors = [];

        // Validate customer
        if (!invoiceData.customerId) {
            errors.push('يجب اختيار عميل');
        }

        // Validate invoice lines
        if (!invoiceData.invoiceLines || invoiceData.invoiceLines.length === 0) {
            errors.push('يجب إضافة بند واحد على الأقل');
        }

        // Validate each line (UPDATED for new shatafType/farmaType fields)
        invoiceData.invoiceLines?.forEach((line, index) => {
            if (!line.glassTypeId) {
                errors.push(`البند ${index + 1}: يجب اختيار نوع الزجاج`);
            }
            if (!line.width || line.width <= 0) {
                errors.push(`البند ${index + 1}: العرض يجب أن يكون أكبر من صفر`);
            }
            if (!line.height || line.height <= 0) {
                errors.push(`البند ${index + 1}: الارتفاع يجب أن يكون أكبر من صفر`);
            }
            if (!line.dimensionUnit) {
                errors.push(`البند ${index + 1}: يجب اختيار وحدة القياس`);
            }

            // NEW: Validate shatafType and farmaType
            if (!line.shatafType) {
                errors.push(`البند ${index + 1}: يجب اختيار نوع الشطف`);
            }
            if (!line.farmaType) {
                errors.push(`البند ${index + 1}: يجب اختيار نوع الفرما`);
            }

            // Validate manual cutting price for manual shataf types
            const manualShatafTypes = ['LASER', 'ROTATION', 'TABLEAUX'];
            if (manualShatafTypes.includes(line.shatafType) && !line.manualCuttingPrice) {
                errors.push(`البند ${index + 1}: يجب إدخال سعر القطع اليدوي لنوع الشطف المحدد`);
            }

            // Validate diameter for WHEEL_CUT farma type
            if (line.farmaType === 'WHEEL_CUT' && (!line.diameter || line.diameter <= 0)) {
                errors.push(`البند ${index + 1}: يجب إدخال القطر لنوع الفرما "عجلة"`);
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Calculate total from invoice lines (client-side)
     * @param {InvoiceLine[]} lines - Invoice lines
     * @returns {number} Total amount
     */
    calculateTotal(lines) {
        if (!lines || lines.length === 0) return 0;
        return lines.reduce((total, line) => total + (line.lineTotal || 0), 0);
    },

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date in Arabic
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },

    /**
     * Format date and time for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date and time in Arabic
     */
    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
};

/**
 * TypeScript type definitions (for reference)
 * UPDATED: Now using shatafType/farmaType instead of legacy cuttingType
 *
 * @typedef {Object} CreateInvoiceRequest
 * @property {number} customerId
 * @property {string} [issueDate] - ISO date string
 * @property {number} [amountPaidNow] - Initial payment amount
 * @property {string} [notes]
 * @property {InvoiceLine[]} invoiceLines
 *
 * @typedef {Object} InvoiceLine
 * @property {number} glassTypeId
 * @property {number} width
 * @property {number} height
 * @property {string} dimensionUnit - MM, CM, M
 * @property {string} shatafType - KHARAZAN, SHAMBORLEH, ONE_CM, TWO_CM, THREE_CM, JULIA, LASER, ROTATION, TABLEAUX, SANDING
 * @property {string} farmaType - NORMAL_SHATAF, ONE_HEAD_FARMA, TWO_HEAD_FARMA, ONE_SIDE_FARMA, TWO_SIDE_FARMA, HEAD_SIDE_FARMA, TWO_HEAD_ONE_SIDE_FARMA, TWO_SIDE_ONE_HEAD_FARMA, FULL_FARMA, WHEEL_CUT, ROTATION, TABLEAUX
 * @property {number} [diameter] - Required for WHEEL_CUT farma type
 * @property {number} [manualCuttingPrice] - Required for manual shataf types (LASER, ROTATION, TABLEAUX)
 *
 * @typedef {Object} Invoice
 * @property {number} id
 * @property {number} customerId
 * @property {Customer} customer
 * @property {string} issueDate - ISO date string
 * @property {string} [paymentDate] - ISO date string
 * @property {number} totalPrice
 * @property {number} amountPaidNow
 * @property {number} remainingBalance
 * @property {string} status - PENDING, PAID, CANCELLED
 * @property {string} [notes]
 * @property {InvoiceLine[]} invoiceLines
 *
 * @typedef {Object} LinePreviewDTO
 * @property {number} width - in meters
 * @property {number} height - in meters
 * @property {number} glassTypeId
 * @property {string} glassTypeName
 * @property {number} thickness
 * @property {string} calculationMethod
 * @property {number} areaM2
 * @property {number} shatafMeters
 * @property {number} [lengthM]
 * @property {number} quantityForPricing
 * @property {number} glassUnitPrice
 * @property {number} glassPrice
 * @property {string} shatafType
 * @property {string} farmaType
 * @property {number} [diameter]
 * @property {number} [cuttingRate]
 * @property {number} cuttingPrice
 * @property {number} lineTotal
 * @property {string} quantityUnit
 * @property {string} calculationDescription
 *
 * @typedef {Object} InvoiceStats
 * @property {number} totalInvoices
 * @property {number} pendingInvoices
 * @property {number} paidInvoices
 * @property {number} cancelledInvoices
 * @property {number} totalRevenue
 * @property {number} pendingRevenue
 *
 * @typedef {Object} PagedResponse
 * @property {Array} content
 * @property {number} totalElements
 * @property {number} totalPages
 * @property {number} number
 * @property {number} size
 * @property {boolean} first
 * @property {boolean} last
 */

export default invoiceService;