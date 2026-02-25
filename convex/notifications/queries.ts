import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../helpers/auth";

export const getMyNotifications = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    // Get notifications targeted at this user + broadcast (no targetUserId)
    const targeted = await ctx.db
      .query("notifications")
      .withIndex("by_targetUserId", (q) => q.eq("targetUserId", user._id as any))
      .order("desc")
      .take(50);

    const broadcast = await ctx.db
      .query("notifications")
      .withIndex("by_targetUserId", (q) => q.eq("targetUserId", undefined))
      .order("desc")
      .take(50);

    // Merge, filter hidden, sort by date
    const all = [...targeted, ...broadcast]
      .filter((n) => !n.hiddenByUserIds.includes(user._id))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);

    return all.map((n) => ({
      ...n,
      isRead: n.readByUserIds.includes(user._id),
    }));
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const targeted = await ctx.db
      .query("notifications")
      .withIndex("by_targetUserId", (q) => q.eq("targetUserId", user._id as any))
      .collect();

    const broadcast = await ctx.db
      .query("notifications")
      .withIndex("by_targetUserId", (q) => q.eq("targetUserId", undefined))
      .collect();

    const all = [...targeted, ...broadcast].filter(
      (n) =>
        !n.hiddenByUserIds.includes(user._id) &&
        !n.readByUserIds.includes(user._id)
    );

    return all.length;
  },
});
