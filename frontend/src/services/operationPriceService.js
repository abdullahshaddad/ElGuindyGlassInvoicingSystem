import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * Get all operation prices (real-time)
 * @returns {Array|undefined} List of all operation prices
 */
export function useOperationPrices() {
    return useQuery(api.operationPrices.queries.listOperationPrices, {});
}

/**
 * Get operation price by type and subtype (real-time)
 * @param {string} type - Operation type (e.g., "BEVELING", "BEVELING_CALC", "LASER")
 * @param {string} subtype - Subtype (e.g., "NORMAL", "DEEP", "ENGRAVE")
 * @returns {Object|undefined} Operation price for the given type and subtype
 */
export function useOperationPriceByTypeAndSubtype(type, subtype) {
    return useQuery(
        api.operationPrices.queries.getByTypeAndSubtype,
        type && subtype
            ? { operationType: type, subtype }
            : "skip"
    );
}

// ===== MUTATION HOOKS =====

/**
 * Create a new operation price
 * Usage: const createPrice = useCreateOperationPrice();
 *        await createPrice({ operationType, subtype, arabicName, basePrice, unit, description, active, displayOrder });
 * @returns {Function} Mutation function accepting { operationType, subtype, arabicName, basePrice, unit?, description?, active?, displayOrder? }
 */
export function useCreateOperationPrice() {
    return useMutation(api.operationPrices.mutations.createOperationPrice);
}

/**
 * Update an existing operation price
 * Usage: const updatePrice = useUpdateOperationPrice();
 *        await updatePrice({ priceId, arabicName, basePrice, unit, description, active, displayOrder });
 * @returns {Function} Mutation function accepting { priceId, arabicName?, basePrice?, unit?, description?, active?, displayOrder? }
 */
export function useUpdateOperationPrice() {
    return useMutation(api.operationPrices.mutations.updateOperationPrice);
}

/**
 * Delete an operation price
 * Usage: const deletePrice = useDeleteOperationPrice();
 *        await deletePrice({ priceId });
 * @returns {Function} Mutation function accepting { priceId }
 */
export function useDeleteOperationPrice() {
    return useMutation(api.operationPrices.mutations.deleteOperationPrice);
}
