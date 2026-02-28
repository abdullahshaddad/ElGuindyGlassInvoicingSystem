import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * Get platform overview stats for super admin dashboard.
 */
export function usePlatformOverview() {
  return useQuery(api.superAdmin.queries.platformOverview, {});
}

/**
 * List all tenants with search/filter support.
 */
export function useAllTenants(filters = {}) {
  return useQuery(api.superAdmin.queries.listAllTenants, filters);
}

/**
 * Get detailed tenant information.
 */
export function useTenantDetail(tenantId) {
  return useQuery(
    api.superAdmin.queries.getTenantDetail,
    tenantId ? { tenantId } : "skip"
  );
}

/**
 * List all users across all tenants.
 */
export function useAllUsers(filters = {}) {
  return useQuery(api.superAdmin.queries.listAllUsers, filters);
}

/**
 * Get tenant usage vs plan limits.
 */
export function useTenantUsage(tenantId) {
  return useQuery(
    api.superAdmin.queries.getTenantUsage,
    tenantId ? { tenantId } : "skip"
  );
}

// ===== MUTATION HOOKS =====

export function useSuspendTenant() {
  return useMutation(api.superAdmin.mutations.suspendTenant);
}

export function useActivateTenant() {
  return useMutation(api.superAdmin.mutations.activateTenant);
}

export function useChangeTenantPlan() {
  return useMutation(api.superAdmin.mutations.changeTenantPlan);
}

export function useUpdateTenantMaxUsers() {
  return useMutation(api.superAdmin.mutations.updateTenantMaxUsers);
}

export function useDeleteTenant() {
  return useMutation(api.superAdmin.mutations.deleteTenant);
}

export function useChangeUserRole() {
  return useMutation(api.superAdmin.mutations.changeUserRole);
}

export function useDeactivateUser() {
  return useMutation(api.superAdmin.mutations.deactivateUser);
}

export function useActivateUser() {
  return useMutation(api.superAdmin.mutations.activateUser);
}

/**
 * Get revenue statistics.
 */
export function useRevenueStats() {
  return useQuery(api.superAdmin.queries.getRevenueStats, {});
}

/**
 * Get subscription payments for a tenant.
 */
export function useSubscriptionPayments(tenantId) {
  return useQuery(
    api.superAdmin.queries.getSubscriptionPayments,
    tenantId ? { tenantId } : "skip"
  );
}

/**
 * Get plan configuration.
 */
export function usePlanConfigs() {
  return useQuery(api.superAdmin.queries.getPlanConfigs, {});
}

export function useAssignUserToTenant() {
  return useMutation(api.superAdmin.mutations.assignUserToTenant);
}

// ===== TENANT VIEWING HOOKS =====

export function useEnterTenant() {
  return useMutation(api.superAdmin.mutations.enterTenant);
}

export function useExitTenant() {
  return useMutation(api.superAdmin.mutations.exitTenant);
}

// ===== SUBSCRIPTION MUTATION HOOKS =====

export function useUpdateSubscription() {
  return useMutation(api.superAdmin.mutations.updateSubscription);
}

export function useRecordSubscriptionPayment() {
  return useMutation(api.superAdmin.mutations.recordSubscriptionPayment);
}

// ===== PLAN CONFIG HOOKS =====

export function useListPlanConfigs() {
  return useQuery(api.superAdmin.queries.listPlanConfigs, {});
}

export function useSeedPlanConfigs() {
  return useMutation(api.superAdmin.mutations.seedPlanConfigs);
}

export function useUpdatePlanConfig() {
  return useMutation(api.superAdmin.mutations.updatePlanConfig);
}

// ===== UTILITIES =====

/**
 * Get plan display info.
 */
export const getPlanInfo = (plan) => {
  const map = {
    free: {
      label: "Free",
      labelAr: "مجاني",
      color: "text-gray-600",
      bgColor: "bg-gray-100 dark:bg-gray-800",
    },
    starter: {
      label: "Starter",
      labelAr: "بداية",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    professional: {
      label: "Professional",
      labelAr: "احترافي",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    enterprise: {
      label: "Enterprise",
      labelAr: "مؤسسي",
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
  };
  return map[plan] || map.free;
};
