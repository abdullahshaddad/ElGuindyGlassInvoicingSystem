import { v } from "convex/values";
import { tenantMutation } from "../helpers/multitenancy";
import { notificationType } from "../schema";

export const createNotification = tenantMutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: notificationType,
    targetUserId: v.optional(v.id("users")),
    actionUrl: v.optional(v.string()),
    relatedEntity: v.optional(v.string()),
  },
  handler: async (ctx, args, tenant) => {
    return await ctx.db.insert("notifications", {
      tenantId: tenant.tenantId,
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

export const markAsRead = tenantMutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args, tenant) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.tenantId !== tenant.tenantId) return;

    if (!notification.readByUserIds.includes(tenant.userId)) {
      await ctx.db.patch(args.notificationId, {
        readByUserIds: [...notification.readByUserIds, tenant.userId],
      });
    }
  },
});

export const markAllAsRead = tenantMutation({
  args: {},
  handler: async (ctx, _args, tenant) => {
    const targeted = await ctx.db
      .query("notifications")
      .withIndex("by_tenantId_targetUserId", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("targetUserId", tenant.userId)
      )
      .collect();

    const broadcast = await ctx.db
      .query("notifications")
      .withIndex("by_tenantId_targetUserId", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("targetUserId", undefined)
      )
      .collect();

    const unread = [...targeted, ...broadcast].filter(
      (n) => !n.readByUserIds.includes(tenant.userId)
    );

    for (const n of unread) {
      await ctx.db.patch(n._id, {
        readByUserIds: [...n.readByUserIds, tenant.userId],
      });
    }
  },
});

export const hideNotification = tenantMutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args, tenant) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.tenantId !== tenant.tenantId) return;

    if (!notification.hiddenByUserIds.includes(tenant.userId)) {
      await ctx.db.patch(args.notificationId, {
        hiddenByUserIds: [...notification.hiddenByUserIds, tenant.userId],
      });
    }
  },
});
