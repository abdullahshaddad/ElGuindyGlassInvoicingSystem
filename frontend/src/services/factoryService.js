import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * Get all factory invoices (invoices visible to factory workers)
 * @param {Object} [options] - Optional filter options
 * @param {string} [options.workStatus] - Filter by work status
 * @returns {{ results: Array, status: string, loadMore: Function }}
 */
export function useFactoryInvoices(options = {}) {
    const args = {};
    if (options.workStatus) args.workStatus = options.workStatus;
    return usePaginatedQuery(
        api.factory.queries.getFactoryInvoices,
        args,
        { initialNumItems: 50 }
    );
}

/**
 * Get detailed factory invoice by ID
 * @param {string|undefined} invoiceId - Convex invoice ID
 * @returns {Object|undefined} Detailed factory invoice object
 */
export function useFactoryInvoiceDetail(invoiceId) {
    return useQuery(
        api.factory.queries.getFactoryInvoiceDetail,
        invoiceId ? { invoiceId } : "skip"
    );
}

// ===== MUTATION HOOKS =====

/**
 * Update invoice line status (for factory workers)
 * @returns {Function} Mutation function - call with { lineId, status }
 */
export function useUpdateLineStatus() {
    return useMutation(api.factory.mutations.updateLineStatus);
}
