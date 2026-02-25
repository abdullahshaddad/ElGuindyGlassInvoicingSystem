import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireRole } from "../helpers/auth";

export const getDashboardStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startDate = args.startDate ?? startOfDay.getTime();
    const endDate = args.endDate ?? now;

    // Get all invoices in range
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_issueDate", (q) =>
        q.gte("issueDate", startDate).lte("issueDate", endDate)
      )
      .collect();

    // Calculate stats
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((i) => i.status === "PAID");
    const pendingInvoices = invoices.filter((i) => i.status === "PENDING");
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.totalPrice, 0);
    const totalPending = pendingInvoices.reduce(
      (sum, i) => sum + i.remainingBalance,
      0
    );

    // Count all customers
    const allCustomers = await ctx.db.query("customers").collect();
    const totalCustomers = allCustomers.length;

    // Today's invoices
    const todayInvoices = invoices.filter(
      (i) => i.issueDate >= startOfDay.getTime()
    );
    const todayRevenue = todayInvoices
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + i.totalPrice, 0);

    return {
      totalInvoices,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      totalCustomers,
      todayInvoices: todayInvoices.length,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
    };
  },
});

export const getTopCustomers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    const limit = args.limit ?? 10;
    const customers = await ctx.db.query("customers").collect();

    // Sort by balance (debt) descending
    return customers
      .filter((c) => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit)
      .map((c) => ({
        _id: c._id,
        name: c.name,
        phone: c.phone,
        customerType: c.customerType,
        balance: c.balance,
      }));
  },
});

export const getMonthlyRevenue = query({
  args: { months: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    const monthCount = args.months ?? 12;
    const now = new Date();
    const result: { month: string; revenue: number; count: number }[] = [];

    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const invoices = await ctx.db
        .query("invoices")
        .withIndex("by_issueDate", (q) =>
          q
            .gte("issueDate", date.getTime())
            .lt("issueDate", nextMonth.getTime())
        )
        .collect();

      const paidInvoices = invoices.filter((inv) => inv.status === "PAID");
      const revenue = paidInvoices.reduce((sum, inv) => sum + inv.totalPrice, 0);

      result.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        revenue: Math.round(revenue * 100) / 100,
        count: paidInvoices.length,
      });
    }

    return result;
  },
});

export const getRecentInvoices = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["OWNER", "ADMIN"]);

    const limit = args.limit ?? 10;
    const invoices = await ctx.db
      .query("invoices")
      .order("desc")
      .take(limit);

    return await Promise.all(
      invoices.map(async (inv) => {
        const customer = await ctx.db.get(inv.customerId);
        return {
          ...inv,
          customerName: customer?.name ?? "غير معروف",
        };
      })
    );
  },
});
