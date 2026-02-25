import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../helpers/auth";
import { notificationType } from "../schema";

export const createNotification = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: notificationType,
    targetUserId: v.optional(v.id("users")),
    actionUrl: v.optional(v.string()),
    relatedEntity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      title: args.title,
      message: args.message,
      type: args.type,
      targetUserId: args.targetUserId,
      actionUrl: args.actionUrl,
      relatedEntity: args.relatedEntity,
      readByUserIds: [],
      hiddenByUserIds: [],
      createdAt: Date.now(),
    });
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return;

    if (!notification.readByUserIds.includes(user._id)) {
      await ctx.db.patch(args.notificationId, {
        readByUserIds: [...notification.readByUserIds, user._id],
      });
    }
  },
});

export const markAllAsRead = mutation({
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

    const unread = [...targeted, ...broadcast].filter(
      (n) => !n.readByUserIds.includes(user._id)
    );

    for (const n of unread) {
      await ctx.db.patch(n._id, {
        readByUserIds: [...n.readByUserIds, user._id],
      });
    }
  },
});

export const hideNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return;

    if (!notification.hiddenByUserIds.includes(user._id)) {
      await ctx.db.patch(args.notificationId, {
        hiddenByUserIds: [...notification.hiddenByUserIds, user._id],
      });
    }
  },
});
