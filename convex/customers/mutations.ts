import { v } from "convex/values";
import { tenantMutation, verifyTenantOwnership } from "../helpers/multitenancy";
import { checkPermission } from "../helpers/permissions";
import { logAuditEvent, computeDiff } from "../helpers/auditLog";
import { customerType } from "../schema";

export const createCustomer = tenantMutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    customerType: customerType,
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "customers", "create");

    // Check for duplicate phone within this tenant
    if (args.phone) {
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_tenantId_phone", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("phone", args.phone)
        )
        .unique();
      if (existing) {
        throw new Error("رقم الهاتف مسجل بالفعل لعميل آخر");
      }
    }

    const now = Date.now();
    const customerId = await ctx.db.insert("customers", {
      tenantId: tenant.tenantId,
      name: args.name,
      phone: args.phone,
      address: args.address,
      customerType: args.customerType,
      balance: 0.0,
      createdAt: now,
    });

    await logAuditEvent(ctx, tenant, {
      action: "customer.created",
      entityType: "customer",
      entityId: customerId,
    });

    return customerId;
  },
});

export const updateCustomer = tenantMutation({
  args: {
    customerId: v.id("customers"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    customerType: v.optional(customerType),
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "customers", "update");

    const customer = await ctx.db.get(args.customerId);
    verifyTenantOwnership(customer, tenant.tenantId);

    // Check phone uniqueness within tenant if changing
    if (args.phone && args.phone !== customer.phone) {
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_tenantId_phone", (q) =>
          q.eq("tenantId", tenant.tenantId).eq("phone", args.phone)
        )
        .unique();
      if (existing) {
        throw new Error("رقم الهاتف مسجل بالفعل لعميل آخر");
      }
    }

    if (args.customerType === "CASH" && customer.balance !== 0) {
      throw new Error("لا يمكن تحويل عميل لديه رصيد مستحق إلى عميل نقدي");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.address !== undefined) updates.address = args.address;
    if (args.customerType !== undefined) updates.customerType = args.customerType;

    await ctx.db.patch(args.customerId, updates);

    const changes = computeDiff(customer, { ...customer, ...updates });
    await logAuditEvent(ctx, tenant, {
      action: "customer.updated",
      entityType: "customer",
      entityId: args.customerId,
      changes,
    });
  },
});

export const deleteCustomer = tenantMutation({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "customers", "delete");

    const customer = await ctx.db.get(args.customerId);
    verifyTenantOwnership(customer, tenant.tenantId);

    // Check for existing invoices within this tenant
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_tenantId_customerId", (q) =>
        q.eq("tenantId", tenant.tenantId).eq("customerId", args.customerId)
      )
      .first();
    if (invoices) {
      throw new Error("لا يمكن حذف عميل لديه فواتير مسجلة");
    }

    await ctx.db.delete(args.customerId);

    await logAuditEvent(ctx, tenant, {
      action: "customer.deleted",
      entityType: "customer",
      entityId: args.customerId,
      severity: "critical",
    });
  },
});
