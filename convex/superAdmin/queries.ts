import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { PLAN_CONFIGS } from "../helpers/planConfig";

/**
 * Helper: verify caller is SUPERADMIN. Returns user or throws.
 */
async function requireSuperAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("غير مصرح: يرجى تسجيل الدخول");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q: any) =>
      q.eq("clerkUserId", identity.subject)
    )
    .unique();

  if (!user || user.role !== "SUPERADMIN") {
    throw new Error("غير مصرح: فقط مدير النظام يمكنه الوصول");
  }
  return user;
}

/**
 * Platform Overview — aggregate stats for the super admin dashboard.
 */
export const platformOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const tenants = await ctx.db.query("tenants").collect();
    const users = await ctx.db.query("users").collect();
    const memberships = await ctx.db.query("tenantMemberships").collect();

    const activeTenants = tenants.filter((t) => t.isActive && !t.isSuspended);
    const suspendedTenants = tenants.filter((t) => t.isSuspended);
    const activeUsers = users.filter((u) => u.isActive);

    // Count by plan
    const planCounts: Record<string, number> = {};
    for (const t of tenants) {
      planCounts[t.plan] = (planCounts[t.plan] || 0) + 1;
    }

    // New tenants this month (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newTenantsMonth = tenants.filter(
      (t) => t.createdAt >= thirtyDaysAgo
    ).length;

    // Recent super admin activity
    const recentActivity = await ctx.db
      .query("superAdminAuditLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(20);

    return {
      tenants: {
        total: tenants.length,
        active: activeTenants.length,
        suspended: suspendedTenants.length,
        newThisMonth: newTenantsMonth,
        byPlan: planCounts,
      },
      users: {
        total: users.length,
        active: activeUsers.length,
        superAdmins: users.filter((u) => u.role === "SUPERADMIN").length,
      },
      memberships: {
        total: memberships.length,
        active: memberships.filter((m) => m.isActive).length,
      },
      recentActivity,
    };
  },
});

/**
 * List all tenants with usage stats — for tenant management table.
 */
export const listAllTenants = query({
  args: {
    search: v.optional(v.string()),
    plan: v.optional(v.string()),
    status: v.optional(v.string()), // "active" | "suspended" | "all"
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    let tenants = await ctx.db.query("tenants").collect();

    // Filter by search
    if (args.search) {
      const lower = args.search.toLowerCase();
      tenants = tenants.filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.slug.toLowerCase().includes(lower)
      );
    }

    // Filter by plan
    if (args.plan && args.plan !== "all") {
      tenants = tenants.filter((t) => t.plan === args.plan);
    }

    // Filter by status
    if (args.status === "active") {
      tenants = tenants.filter((t) => t.isActive && !t.isSuspended);
    } else if (args.status === "suspended") {
      tenants = tenants.filter((t) => t.isSuspended);
    }

    // Enrich with member counts
    const memberships = await ctx.db.query("tenantMemberships").collect();
    const memberCountMap: Record<string, number> = {};
    for (const m of memberships) {
      if (m.isActive) {
        const key = m.tenantId as string;
        memberCountMap[key] = (memberCountMap[key] || 0) + 1;
      }
    }

    return tenants.map((t) => ({
      ...t,
      memberCount: memberCountMap[t._id as string] || 0,
    }));
  },
});

/**
 * Get tenant detail — full info for the tenant detail page.
 */
export const getTenantDetail = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) throw new Error("المستأجر غير موجود");

    // Get members
    const memberships = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        if (!user) return null;
        return {
          membershipId: m._id,
          userId: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantRole: m.role,
          isActive: m.isActive,
          joinedAt: m.joinedAt,
        };
      })
    );

    // Get recent audit activity for this tenant
    const recentAudit = await ctx.db
      .query("auditLogs")
      .withIndex("by_tenantId_timestamp", (q) =>
        q.eq("tenantId", args.tenantId)
      )
      .order("desc")
      .take(20);

    return {
      ...tenant,
      members: members.filter((m) => m !== null),
      recentAudit,
    };
  },
});

/**
 * List all users across all tenants — global user management.
 */
export const listAllUsers = query({
  args: {
    search: v.optional(v.string()),
    tenantId: v.optional(v.id("tenants")),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    let users = await ctx.db.query("users").collect();

    // Search filter
    if (args.search) {
      const lower = args.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.username.toLowerCase().includes(lower) ||
          u.firstName.toLowerCase().includes(lower) ||
          u.lastName.toLowerCase().includes(lower)
      );
    }

    // Role filter
    if (args.role && args.role !== "all") {
      users = users.filter((u) => u.role === args.role);
    }

    // Get all memberships for tenant mapping
    const memberships = await ctx.db.query("tenantMemberships").collect();
    const userTenantMap: Record<string, Array<{ tenantId: string; tenantRole: string; isActive: boolean }>> = {};
    for (const m of memberships) {
      const key = m.userId as string;
      if (!userTenantMap[key]) userTenantMap[key] = [];
      userTenantMap[key].push({
        tenantId: m.tenantId as string,
        tenantRole: m.role,
        isActive: m.isActive,
      });
    }

    let result = users.map((u) => ({
      ...u,
      tenantMemberships: userTenantMap[u._id as string] || [],
    }));

    // Filter by tenant
    if (args.tenantId) {
      result = result.filter((u) =>
        u.tenantMemberships.some(
          (m) => m.tenantId === (args.tenantId as string) && m.isActive
        )
      );
    }

    return result;
  },
});

/**
 * getSubscriptionPayments — payment history for a tenant.
 */
export const getSubscriptionPayments = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const payments = await ctx.db
      .query("subscriptionPayments")
      .withIndex("by_tenantId_createdAt", (q) =>
        q.eq("tenantId", args.tenantId)
      )
      .order("desc")
      .take(50);

    // Enrich with recorder info
    const enriched = await Promise.all(
      payments.map(async (p) => {
        const recorder = await ctx.db.get(p.recordedBy);
        return {
          ...p,
          recordedByName: recorder
            ? `${recorder.firstName} ${recorder.lastName}`
            : "Unknown",
        };
      })
    );

    return enriched;
  },
});

/**
 * getRevenueStats — MRR, total revenue, breakdown by plan, recent payments.
 */
export const getRevenueStats = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const tenants = await ctx.db.query("tenants").collect();
    const allPayments = await ctx.db
      .query("subscriptionPayments")
      .collect();

    // MRR: sum of monthly price for all active subscriptions
    let mrr = 0;
    const activeSubs = tenants.filter(
      (t) => t.subscription?.status === "active"
    );
    for (const t of activeSubs) {
      const sub = t.subscription!;
      if (sub.billingCycle === "monthly") {
        const discount = sub.discount ?? 0;
        mrr += sub.monthlyPrice - discount;
      } else {
        // yearly → divide by 12 for MRR
        const discount = sub.discount ?? 0;
        mrr += (sub.yearlyPrice - discount) / 12;
      }
    }

    // Total revenue: sum of all paid payments
    const paidPayments = allPayments.filter((p) => p.status === "paid");
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    // This month's revenue
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thisMonthRevenue = paidPayments
      .filter((p) => p.createdAt >= monthStart)
      .reduce((sum, p) => sum + p.amount, 0);

    // Breakdown by plan
    const byPlan: Record<string, { count: number; revenue: number }> = {};
    for (const t of activeSubs) {
      const plan = t.plan;
      if (!byPlan[plan]) byPlan[plan] = { count: 0, revenue: 0 };
      byPlan[plan].count++;
      const sub = t.subscription!;
      const discount = sub.discount ?? 0;
      byPlan[plan].revenue +=
        sub.billingCycle === "monthly"
          ? sub.monthlyPrice - discount
          : (sub.yearlyPrice - discount) / 12;
    }

    // Breakdown by status
    const byStatus: Record<string, number> = {};
    for (const t of tenants) {
      const status = t.subscription?.status ?? "none";
      byStatus[status] = (byStatus[status] || 0) + 1;
    }

    // Recent payments (last 10)
    const recentPayments = allPayments
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    // Enrich recent payments with tenant names
    const enrichedRecent = await Promise.all(
      recentPayments.map(async (p) => {
        const tenant = await ctx.db.get(p.tenantId);
        const recorder = await ctx.db.get(p.recordedBy);
        return {
          ...p,
          tenantName: tenant?.name ?? "Unknown",
          recordedByName: recorder
            ? `${recorder.firstName} ${recorder.lastName}`
            : "Unknown",
        };
      })
    );

    return {
      mrr: Math.round(mrr * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
      activeSubscriptions: activeSubs.length,
      totalPayments: allPayments.length,
      byPlan,
      byStatus,
      recentPayments: enrichedRecent,
    };
  },
});

/**
 * getPlanConfigs — expose plan configs to frontend.
 * Reads from DB planConfigs table; falls back to hardcoded defaults.
 */
export const getPlanConfigs = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const dbConfigs = await ctx.db
      .query("planConfigs")
      .collect();

    // If DB has configs, build a map keyed by planKey
    if (dbConfigs.length > 0) {
      const result: Record<string, any> = {};
      for (const c of dbConfigs) {
        result[c.planKey] = {
          nameEn: c.nameEn,
          nameAr: c.nameAr,
          monthlyPrice: c.monthlyPrice,
          yearlyPrice: c.yearlyPrice,
          maxUsers: c.maxUsers,
          maxInvoicesPerMonth: c.maxInvoicesPerMonth,
          features: c.features,
          color: c.color,
        };
      }
      return result;
    }

    // Fallback to hardcoded
    return PLAN_CONFIGS;
  },
});

/**
 * getTenantUsage — current usage vs plan limits for the tenant detail page.
 */
export const getTenantUsage = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) throw new Error("المستأجر غير موجود");

    // Count active members
    const memberships = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    const activeMembers = memberships.filter((m) => m.isActive).length;

    // Count invoices this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const invoicesThisMonth = await ctx.db
      .query("invoices")
      .withIndex("by_tenantId_issueDate", (q) =>
        q.eq("tenantId", args.tenantId).gte("issueDate", monthStart)
      )
      .collect();

    // Get plan limits — check DB planConfigs first, fallback to hardcoded
    const plan = tenant.plan as keyof typeof PLAN_CONFIGS;
    let maxUsers = PLAN_CONFIGS[plan]?.maxUsers ?? 3;
    let maxInvoicesPerMonth = PLAN_CONFIGS[plan]?.maxInvoicesPerMonth ?? 50;

    const dbConfig = await ctx.db
      .query("planConfigs")
      .filter((q) => q.eq(q.field("planKey"), plan))
      .first();
    if (dbConfig) {
      maxUsers = dbConfig.maxUsers;
      maxInvoicesPerMonth = dbConfig.maxInvoicesPerMonth;
    }

    // Tenant-level override for maxUsers
    if (tenant.maxUsers !== undefined && tenant.maxUsers !== null) {
      maxUsers = tenant.maxUsers;
    }

    return {
      users: { current: activeMembers, max: maxUsers },
      invoices: { current: invoicesThisMonth.length, max: maxInvoicesPerMonth },
      plan: tenant.plan,
      subscription: tenant.subscription ?? null,
    };
  },
});

/**
 * listPlanConfigs — return all plan config rows from DB for the plans management page.
 */
export const listPlanConfigs = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const dbConfigs = await ctx.db
      .query("planConfigs")
      .collect();

    // Sort by displayOrder
    return dbConfigs.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});
