import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * List all customers with pagination
 * @param {Object} [paginationOpts] - Convex pagination options
 * @returns {Object} Paginated query result { results, status, loadMore, isLoading }
 */
export function useCustomers(paginationOpts = {}) {
    return usePaginatedQuery(
        api.customers.queries.listCustomers,
        {},
        paginationOpts.initialNumItems
            ? { initialNumItems: paginationOpts.initialNumItems }
            : { initialNumItems: 50 }
    );
}

/**
 * Get a single customer by ID
 * @param {string|undefined} customerId - Convex customer ID
 * @returns {Object|undefined} Customer object
 */
export function useCustomer(customerId) {
    return useQuery(
        api.customers.queries.getCustomer,
        customerId ? { customerId } : "skip"
    );
}

/**
 * Search customers by name or phone
 * @param {string|undefined} query - Search query string
 * @returns {Array|undefined} Matching customers
 */
export function useSearchCustomers(query) {
    return useQuery(
        api.customers.queries.searchCustomers,
        query && query.trim().length > 0 ? { searchTerm: query.trim() } : "skip"
    );
}

/**
 * Find a customer by phone number
 * @param {string|undefined} phone - Phone number
 * @returns {Object|undefined|null} Customer object or null if not found
 */
export function useCustomerByPhone(phone) {
    return useQuery(
        api.customers.queries.getCustomerByPhone,
        phone && phone.trim().length > 0 ? { phone: phone.trim() } : "skip"
    );
}

/**
 * Get invoices for a specific customer with pagination
 * @param {string|undefined} customerId - Convex customer ID
 * @param {Object} [options] - Options including pagination and customerName
 * @param {number} [options.initialNumItems] - Initial number of items to load
 * @param {string} [options.customerName] - Customer name to attach to each invoice
 * @returns {Object} Paginated query result { results, status, loadMore, isLoading }
 */
export function useCustomerInvoices(customerId, options = {}) {
    const { initialNumItems = 20, customerName } = options;
    const queryArgs = customerId
        ? { customerId, ...(customerName ? { customerName } : {}) }
        : "skip";
    return usePaginatedQuery(
        api.customers.queries.getCustomerInvoices,
        queryArgs,
        { initialNumItems }
    );
}

// ===== MUTATION HOOKS =====

/**
 * Create a new customer
 * @returns {Function} Mutation function - call with { name, phone?, address?, customerType? }
 */
export function useCreateCustomer() {
    return useMutation(api.customers.mutations.createCustomer);
}

/**
 * Update an existing customer
 * @returns {Function} Mutation function - call with { customerId, name?, phone?, address?, customerType? }
 */
export function useUpdateCustomer() {
    return useMutation(api.customers.mutations.updateCustomer);
}

/**
 * Delete a customer
 * @returns {Function} Mutation function - call with { customerId }
 */
export function useDeleteCustomer() {
    return useMutation(api.customers.mutations.deleteCustomer);
}
