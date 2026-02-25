import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../helpers/auth";
import { customerType } from "../schema";

export const createCustomer = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    customerType: customerType,
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN", "CASHIER"]);

    // Check for duplicate phone
    if (args.phone) {
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_phone", (q) => q.eq("phone", args.phone))
        .unique();
      if (existing) {
        throw new Error("رقم الهاتف مسجل بالفعل لعميل آخر");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("customers", {
      name: args.name,
      phone: args.phone,
      address: args.address,
      customerType: args.customerType,
      balance: 0.0,
      createdAt: now,
    });
  },
});

export const updateCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    customerType: v.optional(customerType),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("العميل غير موجود");

    // Check phone uniqueness if changing
    if (args.phone && args.phone !== customer.phone) {
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_phone", (q) => q.eq("phone", args.phone))
        .unique();
      if (existing) {
        throw new Error("رقم الهاتف مسجل بالفعل لعميل آخر");
      }
    }

    // Validate CASH customer cannot have balance
    if (args.customerType === "CASH" && customer.balance !== 0) {
      throw new Error("لا يمكن تحويل عميل لديه رصيد مستحق إلى عميل نقدي");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.address !== undefined) updates.address = args.address;
    if (args.customerType !== undefined) updates.customerType = args.customerType;

    await ctx.db.patch(args.customerId, updates);
  },
});

export const deleteCustomer = mutation({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER"]);

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("العميل غير موجود");

    // Check for existing invoices
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_customerId", (q) => q.eq("customerId", args.customerId))
      .first();
    if (invoices) {
      throw new Error("لا يمكن حذف عميل لديه فواتير مسجلة");
    }

    await ctx.db.delete(args.customerId);
  },
});
