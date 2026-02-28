
import {
  query,
  mutation,
  internalMutation,
  QueryCtx,
  MutationCtx,
} from "../_generated/server";
import {
  PropertyValidators,
  ObjectType,
  Infer,
} from "convex/values";
import { v } from "convex/values";
import { paginationOptsValidator, PaginationOptions } from "convex/server";
import { Id, Doc } from "../_generated/dataModel";
import type { TenantRole, Permission } from "./enums";
import { TENANT_ROLE_PERMISSIONS } from "./enums";

// ============================================================
// Tenant context returned to every handler
// ============================================================

export interface TenantContext {
  tenantId: Id<"tenants">;
  userId: Id<"users">;
  tenantRole: TenantRole;
  permissions: Permission[];
  user: Doc<"users">;
  isSuperAdminViewing: boolean;
}

// ============================================================
// Core: resolve tenant from auth context
// ============================================================

export async function getTenantFromAuth(
  ctx: QueryCtx | MutationCtx
): Promise<TenantContext> {
  // 1. Get Clerk identity
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("غير مصرح: يرجى تسجيل الدخول");
  }

  // 2. Look up user by Clerk ID
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
    .unique();

  if (!user || !user.isActive) {
    throw new Error("غير مصرح: المستخدم غير موجود أو معطل");
  }

  const isSuperAdmin = user.role === "SUPERADMIN";
  let isSuperAdminViewing = false;

  // 3. Resolve tenantId
  let tenantId: Id<"tenants"> | undefined;

  if (isSuperAdmin && user.viewingTenantId) {
    // SUPERADMIN is actively viewing a tenant
    tenantId = user.viewingTenantId;
    isSuperAdminViewing = true;
  } else if (user.defaultTenantId) {
    tenantId = user.defaultTenantId;
  }

  if (!tenantId) {
    throw new Error("غير مصرح: لا يوجد مستأجر مرتبط بالمستخدم");
  }

  // 4. Look up membership (SUPERADMIN bypasses membership check)
  let tenantRole: TenantRole = "owner"; // default for SUPERADMIN
  let permissions: Permission[] = TENANT_ROLE_PERMISSIONS.owner; // default for SUPERADMIN
  if (!isSuperAdmin) {
    const membership = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId_userId", (q) =>
        q.eq("tenantId", tenantId).eq("userId", user._id)
      )
      .unique();

    if (!membership || !membership.isActive) {
      throw new Error("غير مصرح: ليس لديك عضوية نشطة في هذا المستأجر");
    }
    tenantRole = membership.role as TenantRole;
    // Use explicit permissions if set, otherwise fall back to role-based defaults
    permissions = (membership.permissions as Permission[] | undefined)
      ?? TENANT_ROLE_PERMISSIONS[tenantRole]
      ?? [];
  }

  // 5. Verify tenant exists (SUPERADMIN can access suspended tenants)
  const tenant = await ctx.db.get(tenantId);
  if (!tenant || !tenant.isActive) {
    throw new Error("غير مصرح: المستأجر غير نشط");
  }
  if (!isSuperAdmin && tenant.isSuspended) {
    throw new Error("غير مصرح: المستأجر معلق");
  }

  return {
    tenantId,
    userId: user._id,
    tenantRole,
    permissions,
    user,
    isSuperAdminViewing,
  };
}

// ============================================================
// Tenant ownership verification
// ============================================================

/**
 * Verify that a record belongs to the given tenant.
 * Throws a generic "not found" error to prevent tenant ID enumeration.
 */
export function verifyTenantOwnership(
  record: { tenantId: Id<"tenants"> } | null,
  tenantId: Id<"tenants">
): asserts record is NonNullable<typeof record> {
  if (!record || record.tenantId !== tenantId) {
    throw new Error("السجل غير موجود");
  }
}

// ============================================================
// tenantQuery wrapper
// ============================================================

export function tenantQuery<Args extends PropertyValidators>(config: {
  args: Args;
  handler: (
    ctx: QueryCtx,
    args: ObjectType<Args>,
    tenant: TenantContext
  ) => Promise<any>;
}) {
  return query({
    args: config.args,
    handler: (async (ctx: QueryCtx, args: ObjectType<Args>) => {
      const tenant = await getTenantFromAuth(ctx);
      return config.handler(ctx, args, tenant);
    }) as any,
  });
}

// ============================================================
// tenantMutation wrapper
// ============================================================

export function tenantMutation<Args extends PropertyValidators>(config: {
  args: Args;
  handler: (
    ctx: MutationCtx,
    args: ObjectType<Args>,
    tenant: TenantContext
  ) => Promise<any>;
}) {
  return mutation({
    args: config.args,
    handler: (async (ctx: MutationCtx, args: ObjectType<Args>) => {
      const tenant = await getTenantFromAuth(ctx);
      return config.handler(ctx, args, tenant);
    }) as any,
  });
}

// ============================================================
// tenantInternalMutation wrapper
// ============================================================

/**
 * For internal mutations that receive tenantId as an argument
 * (crons, scheduled jobs, etc.).
 */
export function tenantInternalMutation<Args extends PropertyValidators>(config: {
  args: Args & { tenantId: typeof v.id<"tenants"> };
  handler: (
    ctx: MutationCtx,
    args: ObjectType<Args> & { tenantId: Id<"tenants"> }
  ) => Promise<any>;
}) {
  return internalMutation({
    args: config.args,
    handler: async (ctx, args) => {
      return config.handler(ctx, args as any);
    },
  });
}
