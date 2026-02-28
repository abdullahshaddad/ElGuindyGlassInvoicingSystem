import { query } from "../_generated/server";
import { v } from "convex/values";
import { tenantQuery } from "../helpers/multitenancy";
import { checkPermission } from "../helpers/permissions";

/**
 * getAuditLogs — tenant-scoped, requires audit:read permission.
 * Supports filtering and cursor-based pagination.
 */
export const getAuditLogs = tenantQuery({
  args: {
    userId: v.optional(v.id("users")),
    action: v.optional(v.string()),
    entityType: v.optional(v.string()),
    severity: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "audit", "read");

    const limit = args.limit ?? 50;
    const cursor = args.cursor ?? Date.now();

    // Base query scoped to tenant, ordered by timestamp desc
    let results = await ctx.db
      .query("auditLogs")
      .withIndex("by_tenantId_timestamp", (q) =>
        q.eq("tenantId", tenant.tenantId)
      )
      .order("desc")
      .collect();

    // Apply filters
    if (args.userId) {
      results = results.filter((r) => r.userId === args.userId);
    }
    if (args.action) {
      results = results.filter((r) => r.action === args.action);
    }
    if (args.entityType) {
      results = results.filter((r) => r.entityType === args.entityType);
    }
    if (args.severity) {
      results = results.filter((r) => r.severity === args.severity);
    }
    if (args.dateFrom) {
      results = results.filter((r) => r.timestamp >= args.dateFrom!);
    }
    if (args.dateTo) {
      results = results.filter((r) => r.timestamp <= args.dateTo!);
    }

    // Cursor-based pagination
    results = results.filter((r) => r.timestamp < cursor);

    const page = results.slice(0, limit);
    const nextCursor =
      page.length === limit ? page[page.length - 1].timestamp : null;

    return {
      items: page,
      nextCursor,
      hasMore: page.length === limit,
    };
  },
});

/**
 * getAuditLogStats — tenant-scoped, requires audit:read.
 * Returns summary counts by action category and severity.
 */
export const getAuditLogStats = tenantQuery({
  args: {
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "audit", "read");

    let logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenant.tenantId))
      .collect();

    if (args.dateFrom) {
      logs = logs.filter((l) => l.timestamp >= args.dateFrom!);
    }
    if (args.dateTo) {
      logs = logs.filter((l) => l.timestamp <= args.dateTo!);
    }

    const bySeverity: Record<string, number> = {};
    const byAction: Record<string, number> = {};

    for (const log of logs) {
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
      const category = log.action.split(".")[0];
      byAction[category] = (byAction[category] || 0) + 1;
    }

    return { total: logs.length, bySeverity, byAction };
  },
});

/**
 * getSuperAdminAuditLogs — SUPERADMIN only, platform-wide.
 */
export const getSuperAdminAuditLogs = query({
  args: {
    action: v.optional(v.string()),
    targetTenantId: v.optional(v.id("tenants")),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Auth check — SUPERADMIN only
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح: يرجى تسجيل الدخول");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user || user.role !== "SUPERADMIN") {
      throw new Error("غير مصرح: فقط مدير النظام يمكنه الوصول");
    }

    const limit = args.limit ?? 50;
    const cursor = args.cursor ?? Date.now();

    let results = await ctx.db
      .query("superAdminAuditLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    if (args.action) {
      results = results.filter((r) => r.action === args.action);
    }
    if (args.targetTenantId) {
      results = results.filter(
        (r) => r.targetTenantId === args.targetTenantId
      );
    }

    results = results.filter((r) => r.timestamp < cursor);
    const page = results.slice(0, limit);
    const nextCursor =
      page.length === limit ? page[page.length - 1].timestamp : null;

    return { items: page, nextCursor, hasMore: page.length === limit };
  },
});
