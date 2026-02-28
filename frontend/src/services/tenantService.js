import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * Get all tenants the current user belongs to (real-time)
 * Bootstrap query — no tenant scope needed.
 */
export function useMyTenants() {
    return useQuery(api.tenants.queries.listMyTenants, {});
}

/**
 * Get the current tenant with user's role (real-time, tenant-scoped)
 */
export function useCurrentTenant() {
    return useQuery(api.tenants.queries.getCurrentTenant, {});
}

/**
 * Get members of the current tenant (real-time, tenant-scoped, requires users:read)
 */
export function useTenantMembers() {
    return useQuery(api.tenants.queries.listTenantMembers, {});
}

// ===== MUTATION HOOKS =====

/**
 * Switch to a different tenant
 * Usage: const switchTenant = useSwitchTenant();
 *        await switchTenant({ tenantId });
 */
export function useSwitchTenant() {
    return useMutation(api.tenants.mutations.switchTenant);
}

/**
 * Create a new tenant
 * Usage: const createTenant = useCreateTenant();
 *        await createTenant({ name, slug });
 */
export function useCreateTenant() {
    return useMutation(api.tenants.mutations.createTenant);
}

/**
 * Update tenant settings (owner only)
 * Usage: const updateTenant = useUpdateTenant();
 *        await updateTenant({ name, settings, brandColors });
 */
export function useUpdateTenant() {
    return useMutation(api.tenants.mutations.updateTenant);
}

/**
 * Add a member to the current tenant with permissions
 * Usage: const addMember = useAddTenantMember();
 *        await addMember({ userId, permissions: [...] });
 */
export function useAddTenantMember() {
    return useMutation(api.tenants.mutations.addMember);
}

/**
 * Update a member's permissions
 * Usage: const updatePermissions = useUpdateMemberPermissions();
 *        await updatePermissions({ membershipId, permissions: [...] });
 */
export function useUpdateMemberPermissions() {
    return useMutation(api.tenants.mutations.updateMemberPermissions);
}

/**
 * Update a member's tenant role (backward compat)
 * Usage: const updateRole = useUpdateMemberRole();
 *        await updateRole({ membershipId, newRole });
 */
export function useUpdateMemberRole() {
    return useMutation(api.tenants.mutations.updateMemberRole);
}

/**
 * Remove a member from the current tenant (soft deactivate)
 * Usage: const removeMember = useRemoveTenantMember();
 *        await removeMember({ membershipId });
 */
export function useRemoveTenantMember() {
    return useMutation(api.tenants.mutations.removeMember);
}

// ===== INVITATION HOOKS =====

/**
 * Get tenant invitations (real-time, tenant-scoped, requires users:invite)
 */
export function useTenantInvitations() {
    return useQuery(api.tenants.queries.listTenantInvitations, {});
}

/**
 * Create a new invitation with permissions
 * Usage: const invite = useCreateInvitation();
 *        await invite({ email, permissions: [...] });
 */
export function useCreateInvitation() {
    return useMutation(api.tenants.mutations.createInvitation);
}

/**
 * Accept an invitation via token
 * Usage: const accept = useAcceptInvitation();
 *        await accept({ token });
 */
export function useAcceptInvitation() {
    return useMutation(api.tenants.mutations.acceptInvitation);
}

/**
 * Cancel a pending invitation
 * Usage: const cancel = useCancelInvitation();
 *        await cancel({ invitationId });
 */
export function useCancelInvitation() {
    return useMutation(api.tenants.mutations.cancelInvitation);
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get tenant role display information with Arabic names and styling
 * @deprecated Use permission-based display instead
 * @param {string} role - Tenant role (owner, admin, manager, operator, viewer)
 * @returns {{ name: string, nameEn: string, color: string, bgColor: string, badgeClass: string }}
 */
export const getTenantRoleInfo = (role) => {
    const roles = {
        owner: {
            name: 'مالك',
            nameEn: 'Owner',
            color: 'text-purple-700',
            bgColor: 'bg-purple-100',
            badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
        },
        admin: {
            name: 'مدير',
            nameEn: 'Admin',
            color: 'text-blue-700',
            bgColor: 'bg-blue-100',
            badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        },
        manager: {
            name: 'مشرف',
            nameEn: 'Manager',
            color: 'text-green-700',
            bgColor: 'bg-green-100',
            badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        },
        operator: {
            name: 'مشغل',
            nameEn: 'Operator',
            color: 'text-orange-700',
            bgColor: 'bg-orange-100',
            badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        },
        viewer: {
            name: 'مشاهد',
            nameEn: 'Viewer',
            color: 'text-gray-700',
            bgColor: 'bg-gray-100',
            badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        },
    };
    return roles[role] || { name: role, nameEn: role, color: 'text-gray-600', bgColor: 'bg-gray-100', badgeClass: 'bg-gray-100 text-gray-600' };
};
