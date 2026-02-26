import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../helpers/auth";
import { userRole } from "../schema";
import { canManageRole } from "../helpers/enums";
import type { UserRole } from "../helpers/enums";

export const createUser = mutation({
  args: {
    clerkUserId: v.string(),
    username: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: userRole,
  },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, ["OWNER", "ADMIN"]);

    // Check if current user can create this role
    if (!canManageRole(currentUser.role as UserRole, args.role as UserRole)) {
      throw new Error("لا يمكنك إنشاء مستخدم بهذا الدور");
    }

    // Check username uniqueness
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (existing) {
      throw new Error("اسم المستخدم مسجل بالفعل");
    }

    // Check clerkUserId uniqueness
    const existingClerk = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();
    if (existingClerk) {
      throw new Error("حساب Clerk مرتبط بالفعل بمستخدم آخر");
    }

    return await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      username: args.username,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      isActive: true,
    });
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.optional(userRole),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, ["OWNER", "ADMIN"]);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("المستخدم غير موجود");

    // Check hierarchy
    if (!canManageRole(currentUser.role as UserRole, targetUser.role as UserRole)) {
      throw new Error("لا يمكنك تعديل هذا المستخدم");
    }

    const { userId, ...updates } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(userId, patch);
  },
});

/**
 * Upsert user from Clerk webhook or first login.
 * Creates user if not exists, no auth required (called from webhook).
 */
/**
 * Internal mutation called by the createUserWithClerk action.
 * Inserts a user record without auth checks (the action handles auth).
 */
export const insertUser = internalMutation({
  args: {
    clerkUserId: v.string(),
    username: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: userRole,
  },
  handler: async (ctx, args) => {
    // Check username uniqueness
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (existing) {
      throw new Error("اسم المستخدم مسجل بالفعل");
    }

    // Check clerkUserId uniqueness
    const existingClerk = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();
    if (existingClerk) {
      throw new Error("حساب Clerk مرتبط بالفعل بمستخدم آخر");
    }

    return await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      username: args.username,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      isActive: true,
    });
  },
});

export const upsertFromClerk = mutation({
  args: {
    clerkUserId: v.string(),
    username: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        firstName: args.firstName,
        lastName: args.lastName,
      });
      return existing._id;
    }

    // New user — default to WORKER role
    return await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      username: args.username,
      firstName: args.firstName,
      lastName: args.lastName,
      role: "WORKER",
      isActive: true,
    });
  },
});
