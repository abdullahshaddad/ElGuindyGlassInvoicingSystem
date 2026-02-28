import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { USER_ROLE_TO_TENANT_ROLE } from "../helpers/enums";
import type { UserRole } from "../helpers/enums";

/**
 * Idempotent migration: create the default "Kwartz" tenant and
 * backfill tenantId on ALL existing records.
 *
 * Safe to run multiple times — checks for existing tenant by slug.
 */
export const createDefaultTenant = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const slug = "elguindyglass";

    // ── Idempotent guard ──────────────────────────────────────────────────
    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    let tenantId;
    if (existingTenant) {
      console.log(`Tenant "${slug}" already exists (${existingTenant._id}), skipping creation.`);
      tenantId = existingTenant._id;
    } else {
      tenantId = await ctx.db.insert("tenants", {
        name: "Kwartz",
        slug,
        plan: "enterprise",
        isActive: true,
        isSuspended: false,
        createdAt: now,
      });
      console.log(`Created tenant "${slug}" with id ${tenantId}`);
    }

    // ── Backfill tenantId on all existing tables ────────────────────────
    const tables = [
      "customers",
      "glassTypes",
      "invoices",
      "invoiceLines",
      "payments",
      "printJobs",
      "laserRates",
      "bevelingRates",
      "operationPrices",
      "companyProfile",
      "notifications",
      "idCounters",
    ] as const;

    for (const table of tables) {
      const records = await ctx.db.query(table).collect();
      let updated = 0;
      for (const record of records) {
        if (!(record as any).tenantId) {
          await ctx.db.patch(record._id, { tenantId } as any);
          updated++;
        }
      }
      console.log(`${table}: ${updated}/${records.length} records updated`);
    }

    // ── Create tenant memberships for existing users ──────────────────
    const users = await ctx.db.query("users").collect();
    let membershipsCreated = 0;

    for (const user of users) {
      // Check if membership already exists
      const existingMembership = await ctx.db
        .query("tenantMemberships")
        .withIndex("by_tenantId_userId", (q) =>
          q.eq("tenantId", tenantId).eq("userId", user._id)
        )
        .unique();

      if (!existingMembership) {
        const tenantRole = USER_ROLE_TO_TENANT_ROLE[user.role as UserRole] ?? "operator";
        await ctx.db.insert("tenantMemberships", {
          userId: user._id,
          tenantId,
          role: tenantRole,
          isActive: true,
          joinedAt: now,
        });
        membershipsCreated++;
      }

      // Set defaultTenantId if not set
      if (!user.defaultTenantId) {
        await ctx.db.patch(user._id, { defaultTenantId: tenantId });
      }
    }

    console.log(`Created ${membershipsCreated} tenant memberships for ${users.length} users`);
    console.log("Migration complete!");

    return { tenantId, usersUpdated: users.length };
  },
});

/**
 * Verification query: check that every record in every table has a tenantId.
 * Returns a report of any records missing tenantId.
 */
export const verifyMigration = internalQuery({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "customers",
      "glassTypes",
      "invoices",
      "invoiceLines",
      "payments",
      "printJobs",
      "laserRates",
      "bevelingRates",
      "operationPrices",
      "companyProfile",
      "notifications",
      "idCounters",
    ] as const;

    const report: Record<string, { total: number; missing: number }> = {};
    let allGood = true;

    for (const table of tables) {
      const records = await ctx.db.query(table).collect();
      const missing = records.filter((r) => !(r as any).tenantId).length;
      report[table] = { total: records.length, missing };
      if (missing > 0) allGood = false;
    }

    // Check users have defaultTenantId
    const users = await ctx.db.query("users").collect();
    const usersMissingDefault = users.filter((u) => !u.defaultTenantId).length;
    report["users (defaultTenantId)"] = { total: users.length, missing: usersMissingDefault };
    if (usersMissingDefault > 0) allGood = false;

    // Check tenant memberships exist
    const memberships = await ctx.db.query("tenantMemberships").collect();
    const usersWithMembership = new Set(memberships.map((m) => m.userId));
    const usersMissingMembership = users.filter((u) => !usersWithMembership.has(u._id)).length;
    report["users (membership)"] = { total: users.length, missing: usersMissingMembership };
    if (usersMissingMembership > 0) allGood = false;

    return { allGood, report };
  },
});
