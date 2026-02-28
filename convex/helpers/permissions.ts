import type { TenantContext } from "./multitenancy";
import type { Permission } from "./enums";

/**
 * Check if the user's permissions grant the required permission.
 * SUPERADMIN (app-level role) always passes.
 *
 * @throws Error if the user lacks the permission
 */
export function checkPermission(
  tenant: TenantContext,
  resource: string,
  action: string
): void {
  // SUPERADMIN bypasses all permission checks
  if (tenant.user.role === "SUPERADMIN") return;

  const permission = `${resource}:${action}` as Permission;

  if (!tenant.permissions || !tenant.permissions.includes(permission)) {
    throw new Error(
      `غير مصرح: ليس لديك صلاحية ${resource}:${action}`
    );
  }
}

/**
 * Check if the user has the permission (non-throwing variant).
 * Returns true/false.
 */
export function hasPermission(
  tenant: TenantContext,
  resource: string,
  action: string
): boolean {
  if (tenant.user.role === "SUPERADMIN") return true;

  const permission = `${resource}:${action}` as Permission;

  return !!tenant.permissions && tenant.permissions.includes(permission);
}
