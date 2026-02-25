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
 * Usage: const upsertProfile = useUpsertCompanyProfile();
 *        await upsertProfile({ companyName, companyNameArabic, address, phone, email, taxId, commercialRegister, footerText });
 * @returns {Function} Mutation function accepting { companyName, companyNameArabic?, address?, phone?, email?, taxId?, commercialRegister?, footerText? }
 */
export function useUpsertCompanyProfile() {
    return useMutation(api.companyProfile.mutations.upsertCompanyProfile);
}

/**
 * Upload a company logo
 *
 * For Convex file uploads, the typical pattern is:
 * 1. Call a mutation/action that returns an upload URL (or use generateUploadUrl)
 * 2. POST the file to that upload URL via fetch
 * 3. Receive a storageId from the response
 * 4. Pass the storageId to uploadLogo mutation to associate it with the company profile
 *
 * Usage:
 *   const uploadLogo = useUploadLogo();
 *   // After uploading file to Convex storage and obtaining storageId:
 *   await uploadLogo({ storageId });
 *
 * @returns {Function} Mutation function accepting { storageId }
 */
export function useUploadLogo() {
    return useMutation(api.companyProfile.mutations.uploadLogo);
}
