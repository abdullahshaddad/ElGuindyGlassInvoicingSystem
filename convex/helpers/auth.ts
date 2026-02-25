import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import type { UserRole } from "./enums";

type AnyCtx = QueryCtx | MutationCtx | ActionCtx;

export interface AppUser {
  _id: string;
  clerkUserId: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * Get the current authenticated user from Clerk identity + users table.
 * Returns null if not authenticated or user not found.
 */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<AppUser | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
    .unique();

  if (!user || !user.isActive) return null;
  return user as unknown as AppUser;
}

/**
 * Require authentication. Throws if not authenticated.
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<AppUser> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("غير مصرح: يرجى تسجيل الدخول");
  }
  return user;
}

/**
 * Require a specific role (or any of the given roles). Throws if unauthorized.
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  roles: UserRole[]
): Promise<AppUser> {
  const user = await requireAuth(ctx);
  if (!roles.includes(user.role)) {
    throw new Error(
      `غير مصرح: هذا الإجراء يتطلب أحد الأدوار: ${roles.join(", ")}`
    );
  }
  return user;
}

/**
 * Get identity from action context (actions don't have db access).
 * Returns Clerk subject (clerkUserId).
 */
export async function getActionIdentity(ctx: ActionCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("غير مصرح: يرجى تسجيل الدخول");
  }
  return identity.subject;
}
