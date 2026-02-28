import { tenantQuery } from "../helpers/multitenancy";

export const getMyNotifications = tenantQuery({
  args: {},
  handler: async (ctx, _args, tenant) => {
    // Get notifications targeted at this user within the tenant
    const targeted = await ctx.db
      .query("notifications")
      .withIndex("by_tenantId_targetUserId", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("targetUserId", tenant.userId)
      )
      .order("desc")
      .take(50);

    // Get broadcast notifications (no targetUserId) within the tenant
    const broadcast = await ctx.db
      .query("notifications")
      .withIndex("by_tenantId_targetUserId", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("targetUserId", undefined)
      )
      .order("desc")
      .take(50);

    // Merge, filter hidden, sort by date
    const all = [...targeted, ...broadcast]
      .filter((n) => !n.hiddenByUserIds.includes(tenant.userId))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);

    return all.map((n) => ({
      ...n,
      isRead: n.readByUserIds.includes(tenant.userId),
    }));
  },
});

export const getUnreadCount = tenantQuery({
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
      (n) =>
        !n.hiddenByUserIds.includes(tenant.userId) &&
        !n.readByUserIds.includes(tenant.userId)
    );

    return unread.length;
  },
});
