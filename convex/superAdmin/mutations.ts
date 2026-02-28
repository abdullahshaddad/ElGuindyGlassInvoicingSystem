import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { logSuperAdminEvent } from "../helpers/auditLog";
import { tenantPlan, subscriptionStatus, billingCycle, subscriptionPaymentStatus } from "../schema";
import { getPlanConfig, getDefaultPlanSeeds } from "../helpers/planConfig";

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
 * suspendTenant — SUPERADMIN only.
 * Suspends a tenant (prevents members from accessing).
 */
export const suspendTenant = mutation({
  args: {
    tenantId: v.id("tenants"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) throw new Error("المستأجر غير موجود");

    if (tenant.isSuspended) {
      throw new Error("المستأجر معلق بالفعل");
    }

    await ctx.db.patch(args.tenantId, {
      isSuspended: true,
      updatedAt: Date.now(),
    });

    await logSuperAdminEvent(ctx, user._id, user.username, {
      action: "tenant.suspended",
      entityType: "tenant",
      entityId: args.tenantId,
      targetTenantId: args.tenantId,
      changes: { isSuspended: { from: false, to: true } },
      metadata: { source: args.reason || "manual" },
      severity: "critical",
    });
  },
});

/**
 * activateTenant — SUPERADMIN only.
 * Reactivates a suspended tenant.
 */
export const activateTenant = mutation({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) throw new Error("المستأجر غير موجود");

    if (!tenant.isSuspended) {
      throw new Error("المستأجر نشط بالفعل");
    }

    await ctx.db.patch(args.tenantId, {
      isSuspended: false,
      isActive: true,
      updatedAt: Date.now(),
    });

    await logSuperAdminEvent(ctx, user._id, user.username, {
      action: "tenant.activated",
      entityType: "tenant",
      entityId: args.tenantId,
      targetTenantId: args.tenantId,
      changes: { isSuspended: { from: true, to: false } },
    });
  },
});

/**
 * changeTenantPlan — SUPERADMIN only.
 * Changes the plan tier for a tenant.
 */
export const changeTenantPlan = mutation({
  args: {
    tenantId: v.id("tenants"),
    newPlan: tenantPlan,
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) throw new Error("المستأجر غير موجود");

    const oldPlan = tenant.plan;
    if (oldPlan === args.newPlan) {
      throw new Error("المستأجر بالفعل على هذه الخطة");
    }

    const planConfig = getPlanConfig(args.newPlan as any);
    const patchData: any = {
      plan: args.newPlan,
      maxUsers: planConfig.maxUsers,
      updatedAt: Date.now(),
    };

    // If tenant has subscription, update pricing
    if (tenant.subscription) {
      patchData.subscription = {
        ...tenant.subscription,
        monthlyPrice: planConfig.monthlyPrice,
        yearlyPrice: planConfig.yearlyPrice,
      };
    }

    await ctx.db.patch(args.tenantId, patchData);

    await logSuperAdminEvent(ctx, user._id, user.username, {
      action: "tenant.plan_changed",
      entityType: "tenant",
      entityId: args.tenantId,
      targetTenantId: args.tenantId,
      changes: { plan: { from: oldPlan, to: args.newPlan } },
    });
  },
});

/**
 * updateTenantMaxUsers — SUPERADMIN only.
 * Sets the maximum user count for a tenant.
 */
export const updateTenantMaxUsers = mutation({
  args: {
    tenantId: v.id("tenants"),
    maxUsers: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) throw new Error("المستأجر غير موجود");

    const oldMax = tenant.maxUsers;

    await ctx.db.patch(args.tenantId, {
      maxUsers: args.maxUsers,
      updatedAt: Date.now(),
    });

    await logSuperAdminEvent(ctx, user._id, user.username, {
      action: "tenant.max_users_changed",
      entityType: "tenant",
      entityId: args.tenantId,
      targetTenantId: args.tenantId,
      changes: { maxUsers: { from: oldMax, to: args.maxUsers } },
    });
  },
});

/**
 * deleteTenant — SUPERADMIN only.
 * Soft-deactivates a tenant (sets isActive=false).
 */
export const deleteTenant = mutation({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) throw new Error("المستأجر غير موجود");

    if (!tenant.isActive) {
      throw new Error("المستأجر محذوف بالفعل");
    }

    await ctx.db.patch(args.tenantId, {
      isActive: false,
      isSuspended: true,
      updatedAt: Date.now(),
    });

    // Deactivate all memberships for this tenant
    const memberships = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    for (const m of memberships) {
      if (m.isActive) {
        await ctx.db.patch(m._id, { isActive: false });

        // If member's defaultTenantId was this tenant, clear it
        const memberUser = await ctx.db.get(m.userId);
        if (memberUser && memberUser.defaultTenantId === args.tenantId) {
          const otherActive = await ctx.db
            .query("tenantMemberships")
            .withIndex("by_userId", (q) => q.eq("userId", m.userId))
            .collect();
          const alternative = otherActive.find(
            (om) => om.isActive && om.tenantId !== args.tenantId
          );
          await ctx.db.patch(m.userId, {
            defaultTenantId: alternative?.tenantId,
          });
        }
      }
    }

    await logSuperAdminEvent(ctx, user._id, user.username, {
      action: "tenant.deleted",
      entityType: "tenant",
      entityId: args.tenantId,
      targetTenantId: args.tenantId,
      severity: "critical",
    });
  },
});

/**
 * changeUserRole — SUPERADMIN only.
 * Changes a user's app-level role (UserRole).
 */
export const changeUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.union(
      v.literal("WORKER"),
      v.literal("CASHIER"),
      v.literal("ADMIN"),
      v.literal("OWNER"),
      v.literal("SUPERADMIN")
    ),
  },
  handler: async (ctx, args) => {
    const caller = await requireSuperAdmin(ctx);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("المستخدم غير موجود");

    // Cannot change own role
    if (targetUser._id === caller._id) {
      throw new Error("لا يمكنك تغيير دورك الخاص");
    }

    const oldRole = targetUser.role;
    if (oldRole === args.newRole) return;

    await ctx.db.patch(args.userId, { role: args.newRole });

    await logSuperAdminEvent(ctx, caller._id, caller.username, {
      action: "user.role_changed",
      entityType: "user",
      entityId: args.userId,
      changes: { role: { from: oldRole, to: args.newRole } },
      severity: "critical",
    });
  },
});

/**
 * deactivateUser — SUPERADMIN only.
 * Deactivates a user across the entire platform.
 */
export const deactivateUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const caller = await requireSuperAdmin(ctx);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("المستخدم غير موجود");

    if (targetUser._id === caller._id) {
      throw new Error("لا يمكنك تعطيل حسابك الخاص");
    }

    if (!targetUser.isActive) {
      throw new Error("المستخدم معطل بالفعل");
    }

    await ctx.db.patch(args.userId, { isActive: false });

    await logSuperAdminEvent(ctx, caller._id, caller.username, {
      action: "user.deactivated",
      entityType: "user",
      entityId: args.userId,
      severity: "critical",
    });
  },
});

/**
 * activateUser — SUPERADMIN only.
 * Reactivates a deactivated user.
 */
export const activateUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const caller = await requireSuperAdmin(ctx);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("المستخدم غير موجود");

    if (targetUser.isActive) {
      throw new Error("المستخدم نشط بالفعل");
    }

    await ctx.db.patch(args.userId, { isActive: true });

    await logSuperAdminEvent(ctx, caller._id, caller.username, {
      action: "user.activated",
      entityType: "user",
      entityId: args.userId,
    });
  },
});

/**
 * updateSubscription — SUPERADMIN only.
 * Set or update a tenant's subscription state.
 */
export const updateSubscription = mutation({
  args: {
    tenantId: v.id("tenants"),
    status: subscriptionStatus,
    billingCycle: billingCycle,
    startDate: v.optional(v.number()),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    monthlyPrice: v.number(),
    yearlyPrice: v.number(),
    discount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) throw new Error("المستأجر غير موجود");

    const oldSubscription = tenant.subscription;

    const subscription = {
      status: args.status,
      billingCycle: args.billingCycle,
      startDate: args.startDate ?? args.currentPeriodStart,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      monthlyPrice: args.monthlyPrice,
      yearlyPrice: args.yearlyPrice,
      discount: args.discount,
      notes: args.notes,
    };

    await ctx.db.patch(args.tenantId, {
      subscription,
      updatedAt: Date.now(),
    });

    await logSuperAdminEvent(ctx, user._id, user.username, {
      action: "tenant.subscription_updated",
      entityType: "tenant",
      entityId: args.tenantId,
      targetTenantId: args.tenantId,
      changes: {
        subscription: {
          from: oldSubscription ?? null,
          to: subscription,
        },
      },
    });
  },
});

/**
 * recordSubscriptionPayment — SUPERADMIN only.
 * Record a subscription payment for a tenant. If status is "paid",
 * auto-update the tenant's subscription status to "active".
 */
export const recordSubscriptionPayment = mutation({
  args: {
    tenantId: v.id("tenants"),
    amount: v.number(),
    billingCycle: billingCycle,
    periodStart: v.number(),
    periodEnd: v.number(),
    status: subscriptionPaymentStatus,
    paymentMethod: v.optional(v.string()),
    referenceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) throw new Error("المستأجر غير موجود");

    await ctx.db.insert("subscriptionPayments", {
      tenantId: args.tenantId,
      amount: args.amount,
      billingCycle: args.billingCycle,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      status: args.status,
      paymentMethod: args.paymentMethod,
      referenceNumber: args.referenceNumber,
      notes: args.notes,
      recordedBy: user._id as Id<"users">,
      createdAt: Date.now(),
    });

    // If paid, update subscription to active with new period
    if (args.status === "paid" && tenant.subscription) {
      await ctx.db.patch(args.tenantId, {
        subscription: {
          ...tenant.subscription,
          status: "active",
          currentPeriodStart: args.periodStart,
          currentPeriodEnd: args.periodEnd,
        },
        updatedAt: Date.now(),
      });
    }

    await logSuperAdminEvent(ctx, user._id, user.username, {
      action: "tenant.subscription_payment_recorded",
      entityType: "subscriptionPayment",
      entityId: args.tenantId,
      targetTenantId: args.tenantId,
      changes: {
        amount: { from: null, to: args.amount },
        status: { from: null, to: args.status },
        billingCycle: { from: null, to: args.billingCycle },
      },
    });
  },
});

// ====================== TENANT VIEWING MUTATIONS ======================

/**
 * enterTenant — SUPERADMIN only.
 * Sets viewingTenantId so the SUPERADMIN sees data through the regular UI.
 */
export const enterTenant = mutation({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) throw new Error("المستأجر غير موجود");

    await ctx.db.patch(user._id, { viewingTenantId: args.tenantId });

    await logSuperAdminEvent(ctx, user._id, user.username, {
      action: "tenant.entered",
      entityType: "tenant",
      entityId: args.tenantId,
      targetTenantId: args.tenantId,
    });
  },
});

/**
 * exitTenant — SUPERADMIN only.
 * Clears viewingTenantId so the SUPERADMIN returns to the admin panel.
 */
export const exitTenant = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireSuperAdmin(ctx);

    await ctx.db.patch(user._id, { viewingTenantId: undefined });

    await logSuperAdminEvent(ctx, user._id, user.username, {
      action: "tenant.exited",
      entityType: "tenant",
    });
  },
});

/**
 * assignUserToTenant — SUPERADMIN only.
 * Assigns a user to a tenant. Tenant role is auto-derived from the user's app role.
 * Creates membership + sets defaultTenantId if the user doesn't have one.
 */
export const assignUserToTenant = mutation({
  args: {
    userId: v.id("users"),
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const caller = await requireSuperAdmin(ctx);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("المستخدم غير موجود");
    if (!targetUser.isActive) throw new Error("المستخدم معطل");

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) throw new Error("المستأجر غير موجود");
    if (!tenant.isActive) throw new Error("المستأجر غير نشط");

    // Auto-map app role → tenant role
    type TRole = "owner" | "admin" | "manager" | "operator" | "viewer";
    const roleMap: Record<string, TRole> = {
      SUPERADMIN: "owner",
      OWNER: "owner",
      ADMIN: "admin",
      CASHIER: "manager",
      WORKER: "operator",
    };
    const tenantRole: TRole = roleMap[targetUser.role] || "operator";

    // Check existing membership
    const existing = await ctx.db
      .query("tenantMemberships")
      .withIndex("by_tenantId_userId", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.userId)
      )
      .unique();

    if (existing) {
      if (existing.isActive) {
        throw new Error("المستخدم عضو بالفعل في هذا المستأجر");
      }
      // Reactivate
      await ctx.db.patch(existing._id, {
        isActive: true,
        role: tenantRole,
        joinedAt: Date.now(),
        invitedBy: caller._id,
      });
    } else {
      await ctx.db.insert("tenantMemberships", {
        userId: args.userId,
        tenantId: args.tenantId,
        role: tenantRole,
        isActive: true,
        joinedAt: Date.now(),
        invitedBy: caller._id,
      });
    }

    // Set defaultTenantId if the user doesn't have one
    if (!targetUser.defaultTenantId) {
      await ctx.db.patch(args.userId, { defaultTenantId: args.tenantId });
    }

    await logSuperAdminEvent(ctx, caller._id, caller.username, {
      action: "user.assigned_to_tenant",
      entityType: "user",
      entityId: args.userId,
      targetTenantId: args.tenantId,
      changes: { tenantRole: { from: null, to: tenantRole } },
    });
  },
});

// ====================== PLAN CONFIG MUTATIONS ======================

/**
 * seedPlanConfigs — SUPERADMIN only.
 * Seeds the planConfigs table with default plan configurations.
 * Only runs if the table is empty.
 */
export const seedPlanConfigs = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireSuperAdmin(ctx);

    const existing = await ctx.db.query("planConfigs").collect();
    if (existing.length > 0) {
      return { seeded: false, message: "Plans already exist" };
    }

    const defaults = getDefaultPlanSeeds();
    for (const plan of defaults) {
      await ctx.db.insert("planConfigs", {
        ...plan,
        updatedAt: Date.now(),
      });
    }

    await logSuperAdminEvent(ctx, user._id, user.username, {
      action: "plans.seeded",
      entityType: "planConfig",
      changes: { count: { from: 0, to: defaults.length } },
    });

    return { seeded: true, count: defaults.length };
  },
});

/**
 * updatePlanConfig — SUPERADMIN only.
 * Update an existing plan config.
 */
export const updatePlanConfig = mutation({
  args: {
    planId: v.id("planConfigs"),
    nameEn: v.string(),
    nameAr: v.string(),
    monthlyPrice: v.number(),
    yearlyPrice: v.number(),
    maxUsers: v.number(),
    maxInvoicesPerMonth: v.number(),
    features: v.array(v.string()),
    color: v.string(),
    isActive: v.boolean(),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("الخطة غير موجودة");

    const oldData = {
      nameEn: plan.nameEn,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      maxUsers: plan.maxUsers,
    };

    await ctx.db.patch(args.planId, {
      nameEn: args.nameEn,
      nameAr: args.nameAr,
      monthlyPrice: args.monthlyPrice,
      yearlyPrice: args.yearlyPrice,
      maxUsers: args.maxUsers,
      maxInvoicesPerMonth: args.maxInvoicesPerMonth,
      features: args.features,
      color: args.color,
      isActive: args.isActive,
      displayOrder: args.displayOrder,
      updatedAt: Date.now(),
    });

    // Also update active subscriptions that use this plan
    const tenants = await ctx.db.query("tenants").collect();
    let updated = 0;
    for (const t of tenants) {
      if (t.plan === plan.planKey && t.subscription) {
        await ctx.db.patch(t._id, {
          subscription: {
            ...t.subscription,
            monthlyPrice: args.monthlyPrice,
            yearlyPrice: args.yearlyPrice,
          },
          maxUsers: args.maxUsers,
          updatedAt: Date.now(),
        });
        updated++;
      }
    }

    await logSuperAdminEvent(ctx, user._id, user.username, {
      action: "plan.updated",
      entityType: "planConfig",
      entityId: args.planId,
      changes: {
        nameEn: { from: oldData.nameEn, to: args.nameEn },
        monthlyPrice: { from: oldData.monthlyPrice, to: args.monthlyPrice },
        yearlyPrice: { from: oldData.yearlyPrice, to: args.yearlyPrice },
        maxUsers: { from: oldData.maxUsers, to: args.maxUsers },
      },
    });

    return { updated };
  },
});
