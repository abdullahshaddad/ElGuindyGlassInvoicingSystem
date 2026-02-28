import { v } from "convex/values";
import { tenantMutation, verifyTenantOwnership } from "../helpers/multitenancy";
import { checkPermission } from "../helpers/permissions";
import { logAuditEvent } from "../helpers/auditLog";
import { lineStatus } from "../schema";

/**
 * Update the status of an invoice line (factory worker action).
 * Also recalculates the parent invoice's workStatus.
 */
export const updateLineStatus = tenantMutation({
  args: {
    lineId: v.id("invoiceLines"),
    status: lineStatus,
  },
  handler: async (ctx, args, tenant) => {
    checkPermission(tenant, "orders", "update");

    const line = await ctx.db.get(args.lineId);
    verifyTenantOwnership(line, tenant.tenantId);

    await ctx.db.patch(args.lineId, { status: args.status });

    const allLines = await ctx.db
      .query("invoiceLines")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", line.invoiceId))
      .collect();

    const lineStatuses = allLines.map((l) =>
      l._id === args.lineId ? args.status : l.status
    );

    let newWorkStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    const allCompleted = lineStatuses.every((s) => s === "COMPLETED");
    const anyInProgress = lineStatuses.some((s) => s === "IN_PROGRESS");
    const anyCompleted = lineStatuses.some((s) => s === "COMPLETED");

    if (allCompleted && lineStatuses.length > 0) {
      newWorkStatus = "COMPLETED";
    } else if (anyInProgress || anyCompleted) {
      newWorkStatus = "IN_PROGRESS";
    } else {
      newWorkStatus = "PENDING";
    }

    await ctx.db.patch(line.invoiceId, {
      workStatus: newWorkStatus,
      updatedAt: Date.now(),
    });

    await logAuditEvent(ctx, tenant, {
      action: "order.status_changed",
      entityType: "invoiceLine",
      entityId: args.lineId,
      changes: { status: { from: line.status, to: args.status } },
    });

    return { workStatus: newWorkStatus };
  },
});
