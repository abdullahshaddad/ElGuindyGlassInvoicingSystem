import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth, requireRole } from "../helpers/auth";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    return user;
  },

});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);
    return await ctx.db.query("users").collect();
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);
    return await ctx.db.get(args.userId);
  },
});
