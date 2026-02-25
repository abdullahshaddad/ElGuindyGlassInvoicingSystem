import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * List glass types, optionally filtering to active only
 * @param {boolean} [activeOnly] - If true, only return active glass types
 * @returns {Array|undefined} Glass types array
 */
export function useGlassTypes(activeOnly) {
    const args = {};
    if (activeOnly !== undefined && activeOnly !== null) {
        args.activeOnly = activeOnly;
    }
    return useQuery(api.glassTypes.queries.listGlassTypes, args);
}

/**
 * Get a single glass type by ID
 * @param {string|undefined} glassTypeId - Convex glass type ID
 * @returns {Object|undefined} Glass type object
 */
export function useGlassType(glassTypeId)

{
    return useQuery(
        api.glassTypes.queries.getGlassType,
        glassTypeId ? { glassTypeId } : "skip"
    );
}

// ===== MUTATION HOOKS =====

/**
 * Create a new glass type
 * @returns {Function} Mutation function - call with { name, thickness, color?, pricePerMeter, calculationMethod, active }
 */
export function useCreateGlassType() {
    return useMutation(api.glassTypes.mutations.createGlassType);
}

/**
 * Update an existing glass type
 * @returns {Function} Mutation function - call with { glassTypeId, name?, thickness?, color?, pricePerMeter?, calculationMethod?, active? }
 */
export function useUpdateGlassType() {
    return useMutation(api.glassTypes.mutations.updateGlassType);
}

/**
 * Delete a glass type
 * @returns {Function} Mutation function - call with { glassTypeId }
 */
export function useDeleteGlassType() {
    return useMutation(api.glassTypes.mutations.deleteGlassType);
}
