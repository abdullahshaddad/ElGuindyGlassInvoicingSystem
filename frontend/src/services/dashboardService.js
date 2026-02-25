import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * Get dashboard statistics (counts, totals, summaries)
 * @returns {Object|undefined} Dashboard stats object
 */
export function useDashboardStats() {
    return useQuery(api.dashboard.queries.getDashboardStats, {});
}

/**
 * Get top customers by revenue
 * @param {number} [limit] - Number of top customers to return
 * @returns {Array|undefined} Top customers array
 */
export function useTopCustomers(limit) {
    const args = {};
    if (limit !== undefined && limit !== null) {
        args.limit = limit;
    }
    return useQuery(api.dashboard.queries.getTopCustomers, args);
}

/**
 * Get monthly revenue chart data
 * @param {number} [months] - Number of months to include
 * @returns {Array|undefined} Monthly revenue data
 */
export function useMonthlyRevenue(months) {
    const args = {};
    if (months !== undefined && months !== null) {
        args.months = months;
    }
    return useQuery(api.dashboard.queries.getMonthlyRevenue, args);
}

/**
 * Get recent invoices for the dashboard
 * @param {number} [limit] - Number of recent invoices to return
 * @returns {Array|undefined} Recent invoices array
 */
export function useRecentInvoices(limit) {
    const args = {};
    if (limit !== undefined && limit !== null) {
        args.limit = limit;
    }
    return useQuery(api.dashboard.queries.getRecentInvoices, args);
}
