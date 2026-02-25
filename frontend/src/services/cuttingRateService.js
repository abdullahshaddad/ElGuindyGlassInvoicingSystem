import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * Get all cutting rates (real-time)
 * @returns {Array|undefined} List of all cutting rates
 */
export function useCuttingRates() {
    return useQuery(api.cuttingRates.queries.listCuttingRates, {});
}

/**
 * Get cutting rates filtered by type (real-time)
 * @param {string} type - Cutting type (e.g., "SHATF", "LASER")
 * @returns {Array|undefined} List of cutting rates for the specified type
 */
export function useCuttingRatesByType(type) {
    return useQuery(
        api.cuttingRates.queries.getRatesByType,
        type ? { cuttingType: type } : "skip"
    );
}

// ===== MUTATION HOOKS =====

/**
 * Create a new cutting rate
 * Usage: const createRate = useCreateCuttingRate();
 *        await createRate({ cuttingType, minThickness, maxThickness, ratePerMeter });
 * @returns {Function} Mutation function accepting { cuttingType, minThickness, maxThickness, ratePerMeter }
 */
export function useCreateCuttingRate() {
    return useMutation(api.cuttingRates.mutations.createCuttingRate);
}

/**
 * Update an existing cutting rate
 * Usage: const updateRate = useUpdateCuttingRate();
 *        await updateRate({ rateId, minThickness, maxThickness, ratePerMeter, active });
 * @returns {Function} Mutation function accepting { rateId, minThickness?, maxThickness?, ratePerMeter?, active? }
 */
export function useUpdateCuttingRate() {
    return useMutation(api.cuttingRates.mutations.updateCuttingRate);
}

/**
 * Delete a cutting rate
 * Usage: const deleteRate = useDeleteCuttingRate();
 *        await deleteRate({ rateId });
 * @returns {Function} Mutation function accepting { rateId }
 */
export function useDeleteCuttingRate() {
    return useMutation(api.cuttingRates.mutations.deleteCuttingRate);
}
