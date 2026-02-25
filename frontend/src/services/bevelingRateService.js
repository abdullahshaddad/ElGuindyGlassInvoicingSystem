import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/** Get all beveling rates (real-time) */
export function useBevelingRates() {
    return useQuery(api.bevelingRates.queries.listBevelingRates, {});
}

/** Get beveling rates filtered by type (real-time) */
export function useBevelingRatesByType(type) {
    return useQuery(
        api.bevelingRates.queries.getRatesByType,
        type ? { bevelingType: type } : "skip"
    );
}

/** Get the rate for a specific beveling type and thickness (real-time) */
export function useRateForThickness(bevelingType, thickness) {
    return useQuery(
        api.bevelingRates.queries.getRateForThickness,
        bevelingType && thickness != null
            ? { bevelingType, thickness }
            : "skip"
    );
}

// ===== MUTATION HOOKS =====

/** Create a new beveling rate */
export function useCreateBevelingRate() {
    return useMutation(api.bevelingRates.mutations.createBevelingRate);
}

/** Update an existing beveling rate */
export function useUpdateBevelingRate() {
    return useMutation(api.bevelingRates.mutations.updateBevelingRate);
}

/** Delete a beveling rate */
export function useDeleteBevelingRate() {
    return useMutation(api.bevelingRates.mutations.deleteBevelingRate);
}
