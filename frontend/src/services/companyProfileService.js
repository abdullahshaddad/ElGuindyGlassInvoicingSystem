import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * Get the company profile (real-time)
 * @returns {Object|undefined} Company profile data
 */
export function useCompanyProfile() {
    return useQuery(api.companyProfile.queries.getCompanyProfile, {});
}

// ===== MUTATION HOOKS =====

/**
 * Create or update the company profile
 */
export function useUpsertCompanyProfile() {
    return useMutation(api.companyProfile.mutations.upsertCompanyProfile);
}

/**
 * Generate a short-lived upload URL for Convex file storage
 */
export function useGenerateUploadUrl() {
    return useMutation(api.companyProfile.mutations.generateUploadUrl);
}

/**
 * Save the uploaded logo's storageId on the company profile
 */
export function useUploadLogo() {
    return useMutation(api.companyProfile.mutations.uploadLogo);
}
