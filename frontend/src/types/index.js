/**
 * @fileoverview Type definitions for the Arabic Glass System
 * Using JSDoc for type definitions to provide IntelliSense and documentation
 */

/**
 * User object
 * @typedef {Object} User
 * @property {string} id - User unique identifier
 * @property {string} username - Username
 * @property {string} displayName - Full display name
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {'OWNER'|'CASHIER'|'WORKER'} role - User role
 * @property {boolean} isActive - Whether user is active
 */

/**
 * Customer object
 * @typedef {Object} Customer
 * @property {number} id - Customer ID
 * @property {string} name - Customer name
 * @property {string} phone - Phone number
 * @property {string} [email] - Email address (optional)
 * @property {string} [address] - Customer address (optional)
 * @property {string} [notes] - Additional notes (optional)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Glass Type object
 * @typedef {Object} GlassType
 * @property {number} id - Glass type ID
 * @property {string} name - Glass type name (English)
 * @property {string} nameArabic - Glass type name (Arabic)
 * @property {number} thickness - Glass thickness in mm
 * @property {string} [color] - Glass color (optional)
 * @property {string} [description] - Description (optional)
 * @property {number} pricePerSquareMeter - Price per square meter
 * @property {boolean} isActive - Whether glass type is active
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Invoice Item object
 * @typedef {Object} InvoiceItem
 * @property {number} id - Item ID
 * @property {GlassType} glassType - Glass type details
 * @property {number} width - Width in mm
 * @property {number} height - Height in mm
 * @property {number} quantity - Quantity of pieces
 * @property {number} area - Total area in square meters
 * @property {number} unitPrice - Price per square meter
 * @property {number} totalPrice - Total price for this item
 * @property {string} [notes] - Item-specific notes
 */

/**
 * Invoice object
 * @typedef {Object} Invoice
 * @property {number} id - Invoice ID
 * @property {string} invoiceNumber - Invoice number
 * @property {Customer} customer - Customer details
 * @property {InvoiceItem[]} items - Invoice items
 * @property {number} subtotal - Subtotal amount
 * @property {number} discount - Discount amount
 * @property {number} tax - Tax amount
 * @property {number} total - Total amount
 * @property {'PENDING'|'PAID'|'CANCELLED'} status - Invoice status
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} [paidAt] - Payment timestamp (optional)
 * @property {string} [notes] - Invoice notes
 * @property {User} createdBy - User who created the invoice
 */

/**
 * Print Job object
 * @typedef {Object} PrintJob
 * @property {number} id - Print job ID
 * @property {number} invoiceId - Related invoice ID
 * @property {Invoice} invoice - Invoice details
 * @property {string} glassType - Glass type name
 * @property {number} width - Width dimension
 * @property {number} height - Height dimension
 * @property {number} quantity - Quantity to print
 * @property {number} [actualQuantity] - Actual quantity printed
 * @property {'PENDING'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED'} status - Job status
 * @property {'LOW'|'NORMAL'|'HIGH'|'URGENT'} priority - Job priority
 * @property {User} [assignedWorker] - Assigned worker
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} [startedAt] - Start timestamp
 * @property {Date} [completedAt] - Completion timestamp
 * @property {string} [notes] - Special instructions or notes
 * @property {string} [cancellationReason] - Reason for cancellation
 */

/**
 * Create Invoice Request
 * @typedef {Object} CreateInvoiceRequest
 * @property {number} customerId - Customer ID
 * @property {CreateInvoiceItem[]} items - Invoice items
 * @property {number} [discount=0] - Discount amount
 * @property {string} [notes] - Invoice notes
 */

/**
 * Create Invoice Item
 * @typedef {Object} CreateInvoiceItem
 * @property {number} glassTypeId - Glass type ID
 * @property {number} width - Width in mm
 * @property {number} height - Height in mm
 * @property {number} quantity - Quantity of pieces
 * @property {string} [notes] - Item notes
 */

/**
 * Paged Response
 * @template T
 * @typedef {Object} PagedResponse
 * @property {T[]} content - Page content
 * @property {number} totalElements - Total number of elements
 * @property {number} totalPages - Total number of pages
 * @property {number} size - Page size
 * @property {number} number - Current page number
 * @property {boolean} first - Whether this is the first page
 * @property {boolean} last - Whether this is the last page
 * @property {boolean} empty - Whether the page is empty
 */

/**
 * API Response wrapper
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether request was successful
 * @property {T} [data] - Response data (if successful)
 * @property {string} [message] - Success or error message
 * @property {string} [error] - Error details (if unsuccessful)
 * @property {number} [code] - HTTP status code
 */

/**
 * Customer Statistics
 * @typedef {Object} CustomerStats
 * @property {number} totalInvoices - Total number of invoices
 * @property {number} totalRevenue - Total revenue from customer
 * @property {number} averageOrderValue - Average order value
 * @property {Date} lastOrderDate - Date of last order
 * @property {'EXCELLENT'|'GOOD'|'AVERAGE'|'POOR'} paymentHistory - Payment history rating
 */

/**
 * Invoice Statistics
 * @typedef {Object} InvoiceStats
 * @property {number} totalInvoices - Total number of invoices
 * @property {number} totalRevenue - Total revenue
 * @property {number} paidInvoices - Number of paid invoices
 * @property {number} pendingInvoices - Number of pending invoices
 * @property {number} averageOrderValue - Average order value
 * @property {Object} monthlyStats - Monthly statistics
 * @property {Object} topCustomers - Top customers by revenue
 * @property {Object} topGlassTypes - Most used glass types
 */

/**
 * Glass Type Statistics
 * @typedef {Object} GlassTypeStats
 * @property {number} totalUsage - Total square meters used
 * @property {number} totalRevenue - Total revenue generated
 * @property {number} orderCount - Number of orders
 * @property {number} averageOrderSize - Average order size
 * @property {Object} monthlyUsage - Monthly usage data
 */

/**
 * Print Job Statistics
 * @typedef {Object} PrintJobStats
 * @property {number} totalJobs - Total number of jobs
 * @property {number} completedJobs - Completed jobs
 * @property {number} pendingJobs - Pending jobs
 * @property {number} inProgressJobs - Jobs in progress
 * @property {number} cancelledJobs - Cancelled jobs
 * @property {number} averageCompletionTime - Average completion time in hours
 * @property {Object} workerProductivity - Productivity by worker
 * @property {Object} dailyStats - Daily statistics
 */

/**
 * Authentication Credentials
 * @typedef {Object} LoginCredentials
 * @property {string} username - Username or email
 * @property {string} password - Password
 * @property {boolean} [rememberMe] - Remember me option
 */

/**
 * Registration Data
 * @typedef {Object} RegisterData
 * @property {string} username - Username
 * @property {string} password - Password
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {'CASHIER'|'OWNER'|'WORKER'} role - User role
 */

/**
 * Password Change Data
 * @typedef {Object} PasswordChangeData
 * @property {string} currentPassword - Current password
 * @property {string} newPassword - New password
 * @property {string} confirmPassword - Confirm new password
 */

/**
 * Profile Update Data
 * @typedef {Object} ProfileUpdateData
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {string} [email] - Email address
 * @property {string} [phone] - Phone number
 */

/**
 * Search Filters
 * @typedef {Object} SearchFilters
 * @property {string} [query] - Search query
 * @property {Date} [startDate] - Start date filter
 * @property {Date} [endDate] - End date filter
 * @property {string} [status] - Status filter
 * @property {number} [page] - Page number
 * @property {number} [size] - Page size
 * @property {string} [sortBy] - Sort field
 * @property {'ASC'|'DESC'} [sortDirection] - Sort direction
 */

/**
 * Export Options
 * @typedef {Object} ExportOptions
 * @property {'CSV'|'XLSX'|'PDF'} format - Export format
 * @property {Date} [startDate] - Start date filter
 * @property {Date} [endDate] - End date filter
 * @property {string[]} [fields] - Fields to include
 * @property {boolean} [includeHeaders] - Include headers
 */

/**
 * Import Result
 * @typedef {Object} ImportResult
 * @property {boolean} success - Whether import was successful
 * @property {number} totalRecords - Total records in file
 * @property {number} successfulRecords - Successfully imported records
 * @property {number} failedRecords - Failed records
 * @property {string[]} errors - Import errors
 * @property {Object[]} data - Imported data
 */

/**
 * Cutting Rate
 * @typedef {Object} CuttingRate
 * @property {number} id - Rate ID
 * @property {'STRAIGHT'|'CURVED'|'SHAPED'} cuttingType - Type of cut
 * @property {number} minThickness - Minimum thickness
 * @property {number} maxThickness - Maximum thickness
 * @property {number} ratePerMeter - Rate per meter
 * @property {boolean} isActive - Whether rate is active
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Payment Record
 * @typedef {Object} Payment
 * @property {number} id - Payment ID
 * @property {number} invoiceId - Related invoice ID
 * @property {number} amount - Payment amount
 * @property {'CASH'|'CARD'|'BANK_TRANSFER'|'CHECK'} method - Payment method
 * @property {Date} paidAt - Payment timestamp
 * @property {string} [reference] - Payment reference
 * @property {string} [notes] - Payment notes
 */

// Export types for use in other files
export {};