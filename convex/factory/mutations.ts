import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAuth } from "../helpers/auth";
import { lineStatus } from "../schema";

/**
 * Update the status of an invoice line (factory worker action).
 * Also recalculates the parent invoice's workStatus.
 */
export const updateLineStatus = mutation({
  args: {
    lineId: v.id("invoiceLines"),
    status: lineStatus,
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const line = await ctx.db.get(args.lineId);
    if (!line) throw new Error("البند غير موجود");

    // Update line status
    await ctx.db.patch(args.lineId, { status: args.status });

    // Recalculate invoice work status
    const allLines = await ctx.db
      .query("invoiceLines")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", line.invoiceId))
      .collect();

    // Replace the current line's status with the new status in our calculation
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

    return { workStatus: newWorkStatus };
  },
});
