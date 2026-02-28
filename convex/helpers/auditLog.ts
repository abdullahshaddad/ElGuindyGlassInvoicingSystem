import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import type { AuditSeverity } from "./enums";
import type { TenantContext } from "./multitenancy";

/**
 * Compute a diff between old and new objects.
 * Returns { field: { from, to } } for changed fields only.
 */
export function computeDiff(
  oldObj: Record<string, any>,
  newObj: Record<string, any>
): Record<string, { from: any; to: any }> | null {
  const changes: Record<string, { from: any; to: any }> = {};

  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  for (const key of allKeys) {
    // Skip internal fields
    if (key.startsWith("_")) continue;
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { from: oldVal, to: newVal };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * Determine severity for common actions.
 */
function inferSeverity(action: string): AuditSeverity {
  if (
    action.includes("role_changed") ||
    action.includes("deleted") ||
    action.includes("deactivated") ||
    action.includes("suspended")
  ) {
    return "critical";
  }
  if (
    action.includes("failed") ||
    action.includes("permission_denied")
  ) {
    return "warning";
  }
  return "info";
}

export interface AuditEventParams {
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, { from: any; to: any }> | null;
  severity?: AuditSeverity;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    source?: string;
  };
}

/**
 * Log an audit event scoped to the caller's tenant.
 * Call this inside mutations after the operation succeeds.
 */
export async function logAuditEvent(
  ctx: MutationCtx,
  tenant: TenantContext,
  params: AuditEventParams
): Promise<Id<"auditLogs">> {
  const severity = params.severity ?? inferSeverity(params.action);

  return ctx.db.insert("auditLogs", {
    tenantId: tenant.tenantId,
    userId: tenant.userId,
    userEmail: tenant.user.username, // best available identifier
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    changes: params.changes ?? undefined,
    metadata: params.metadata,
    severity,
    timestamp: Date.now(),
  });
}

/**
 * Log a super admin audit event (platform-wide, no tenant scope).
 */
export async function logSuperAdminEvent(
  ctx: MutationCtx,
  userId: Id<"users">,
  userEmail: string,
  params: AuditEventParams & { targetTenantId?: Id<"tenants"> }
): Promise<Id<"superAdminAuditLogs">> {
  const severity = params.severity ?? inferSeverity(params.action);

  return ctx.db.insert("superAdminAuditLogs", {
    userId,
    userEmail,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    targetTenantId: params.targetTenantId,
    changes: params.changes ?? undefined,
    metadata: params.metadata,
    severity,
    timestamp: Date.now(),
  });
}
