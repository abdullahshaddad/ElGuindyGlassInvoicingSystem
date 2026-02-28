import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * Get tenant-scoped audit logs with filtering and pagination.
 */
export function useAuditLogs(filters = {}) {
  return useQuery(api.auditLogs.queries.getAuditLogs, filters);
}

/**
 * Get tenant-scoped audit log statistics.
 */
export function useAuditLogStats(filters = {}) {
  return useQuery(api.auditLogs.queries.getAuditLogStats, filters);
}

/**
 * Get super admin audit logs (platform-wide, SUPERADMIN only).
 */
export function useSuperAdminAuditLogs(filters = {}) {
  return useQuery(api.auditLogs.queries.getSuperAdminAuditLogs, filters);
}

// ===== UTILITIES =====

/**
 * Map severity to display info.
 */
export const getSeverityInfo = (severity) => {
  const map = {
    info: {
      label: "Info",
      labelAr: "معلومات",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      dotColor: "bg-blue-500",
    },
    warning: {
      label: "Warning",
      labelAr: "تحذير",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      dotColor: "bg-yellow-500",
    },
    critical: {
      label: "Critical",
      labelAr: "حرج",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      dotColor: "bg-red-500",
    },
  };
  return map[severity] || map.info;
};

/**
 * Format audit action for display.
 */
export const formatAuditAction = (action) => {
  return action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};
