#!/usr/bin/env node

/**
 * ============================================================================
 * ElGuindy Glass Invoicing System - PostgreSQL to Convex Migration Script
 * ============================================================================
 *
 * Reads JSONL files exported from PostgreSQL (via scripts/export-postgres.sql)
 * and imports them into Convex, transforming snake_case fields to camelCase
 * and remapping foreign-key references to Convex document IDs.
 *
 * Usage:
 *   node scripts/migrate-to-convex.mjs
 *
 * Environment variables:
 *   CONVEX_URL  - Convex deployment URL
 *                 (default: https://adamant-dove-195.eu-west-1.convex.cloud)
 *   DATA_DIR    - Directory containing exported JSONL files
 *                 (default: scripts/data)
 *
 * Prerequisites:
 *   1. Export PostgreSQL data:
 *        psql -d elguindy -f scripts/export-postgres.sql
 *   2. Deploy the migration mutation to Convex:
 *        npx convex deploy   (or npx convex dev)
 *      This ensures convex/migrations/importData.ts is available.
 *   3. Install dependencies:
 *        npm install          (convex package must be present)
 *
 * ============================================================================
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.mjs";

// ────────────────────────────────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────────────────────────────────

const CONVEX_URL =
  process.env.CONVEX_URL ||
  "https://adamant-dove-195.eu-west-1.convex.cloud";

const DATA_DIR = path.resolve(
  process.env.DATA_DIR || path.join("scripts", "data")
);

const BATCH_SIZE = 50; // records per insertBatch call

// ────────────────────────────────────────────────────────────────────────────
// Convex HTTP client
// ────────────────────────────────────────────────────────────────────────────

const client = new ConvexHttpClient(CONVEX_URL);

// ────────────────────────────────────────────────────────────────────────────
// ID mapping tables (PostgreSQL ID -> Convex ID)
// ────────────────────────────────────────────────────────────────────────────

/** @type {Map<number, string>} PostgreSQL customer.id (Long) -> Convex _id */
const customerIdMap = new Map();

/** @type {Map<number, string>} PostgreSQL glass_type.id (Long) -> Convex _id */
const glassTypeIdMap = new Map();

/** @type {Map<string, string>} PostgreSQL Users.id (UUID) -> Convex _id */
const userIdMap = new Map();

/** @type {Map<string, string>} PostgreSQL invoice.id (String, e.g. "INV-2026-001") -> Convex _id */
const invoiceIdMap = new Map();

/** @type {Map<number, string>} PostgreSQL invoice_line.id (Long) -> Convex _id */
const invoiceLineIdMap = new Map();

// ────────────────────────────────────────────────────────────────────────────
// Statistics
// ────────────────────────────────────────────────────────────────────────────

const stats = {
  /** @type {Record<string, { total: number, imported: number, skipped: number, errors: number }>} */
  tables: {},
  startTime: Date.now(),
};

function initTableStats(tableName) {
  stats.tables[tableName] = { total: 0, imported: 0, skipped: 0, errors: 0 };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Convert a PostgreSQL LocalDateTime string (e.g. "2026-01-15T14:30:00" or
 * "2026-01-15 14:30:00") to epoch milliseconds. Returns undefined if the
 * value is null/undefined/empty.
 */
function toEpochMs(dateTimeStr) {
  if (dateTimeStr == null || dateTimeStr === "") return undefined;
  // Replace the space separator with 'T' for ISO compatibility if needed.
  const iso = String(dateTimeStr).replace(" ", "T");
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) {
    console.warn(`  [WARN] Could not parse timestamp: "${dateTimeStr}"`);
    return undefined;
  }
  return ms;
}

/**
 * Read a JSONL file and return an array of parsed objects.
 * Each line is one JSON object.
 */
async function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  [WARN] File not found, skipping: ${filePath}`);
    return [];
  }
  const records = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, "utf-8"),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    try {
      records.push(JSON.parse(trimmed));
    } catch (err) {
      console.warn(`  [WARN] Skipping malformed JSON line: ${trimmed.slice(0, 80)}...`);
    }
  }
  return records;
}

/**
 * Insert records into a Convex table in batches.
 * Returns an array of Convex IDs in the same order as the input records.
 *
 * @param {string} table - Convex table name
 * @param {object[]} records - Transformed records ready for insertion
 * @param {string} stepLabel - Label for logging
 * @returns {Promise<string[]>}
 */
async function insertInBatches(table, records, stepLabel) {
  initTableStats(stepLabel);
  const stat = stats.tables[stepLabel];
  stat.total = records.length;

  if (records.length === 0) {
    console.log(`  No records to import for ${stepLabel}.`);
    return [];
  }

  const allIds = [];
  const totalBatches = Math.ceil(records.length / BATCH_SIZE);

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    try {
      const ids = await client.mutation(api.migrations.importData.insertBatch, {
        table,
        records: batch,
      });
      allIds.push(...ids);
      stat.imported += batch.length;
      process.stdout.write(
        `\r  [${stepLabel}] Batch ${batchNum}/${totalBatches} ` +
          `(${stat.imported}/${stat.total} records)`
      );
    } catch (err) {
      console.error(
        `\n  [ERROR] Batch ${batchNum} failed for ${stepLabel}: ${err.message}`
      );
      // Log the first record of the failing batch to aid debugging
      console.error(
        `  First record in failing batch: ${JSON.stringify(batch[0]).slice(0, 200)}`
      );
      stat.errors += batch.length;
      // Push nulls so index alignment is maintained
      allIds.push(...batch.map(() => null));
    }
  }
  console.log(); // newline after progress
  return allIds;
}

// ────────────────────────────────────────────────────────────────────────────
// Transformation functions (one per table)
// ────────────────────────────────────────────────────────────────────────────

function transformCuttingRate(rec) {
  return {
    cuttingType: rec.cutting_type,
    minThickness: rec.min_thickness,
    maxThickness: rec.max_thickness,
    ratePerMeter: rec.rate_per_meter,
    active: rec.active ?? true,
  };
}

function transformShatafRate(rec) {
  return {
    shatafType: rec.shataf_type,
    minThickness: rec.min_thickness,
    maxThickness: rec.max_thickness,
    ratePerMeter: rec.rate_per_meter,
    active: rec.active ?? true,
    createdAt: toEpochMs(rec.created_at) ?? Date.now(),
    updatedAt: toEpochMs(rec.updated_at),
  };
}

function transformOperationPrice(rec) {
  return {
    operationType: rec.operation_type,
    subtype: rec.subtype ?? "",
    arabicName: rec.arabic_name ?? "",
    englishName: rec.english_name,
    basePrice: rec.base_price ?? 0,
    unit: rec.unit,
    description: rec.description,
    active: rec.active ?? true,
    displayOrder: rec.display_order,
  };
}

function transformCompanyProfile(rec) {
  return {
    companyName: rec.company_name ?? "",
    companyNameArabic: rec.company_name_arabic,
    address: rec.address,
    phone: rec.phone,
    email: rec.email,
    taxId: rec.tax_id,
    commercialRegister: rec.commercial_register,
    logoUrl: rec.logo_url,
    logoBase64: rec.logo_base64,
    logoContentType: rec.logo_content_type,
    footerText: rec.footer_text,
  };
}

function transformCustomer(rec) {
  return {
    pgId: rec.id, // temporary, used for ID mapping; not inserted
    name: rec.name ?? "",
    phone: rec.phone,
    address: rec.address,
    customerType: rec.customer_type ?? "CASH",
    balance: rec.balance ?? 0,
    createdAt: toEpochMs(rec.created_at) ?? Date.now(),
    updatedAt: toEpochMs(rec.updated_at),
  };
}

function transformGlassType(rec) {
  return {
    pgId: rec.id,
    name: rec.name ?? "",
    thickness: rec.thickness ?? 0,
    color: rec.color,
    pricePerMeter: rec.price_per_meter ?? 0,
    calculationMethod: rec.calculation_method ?? "AREA",
    active: rec.active ?? true,
  };
}

function transformUser(rec) {
  return {
    pgId: rec.id, // UUID
    // Generate placeholder clerkUserId - these must be manually mapped to
    // real Clerk user IDs after migration.
    clerkUserId: `migrated_${rec.id}`,
    username: rec.username ?? "",
    firstName: rec.first_name ?? "",
    lastName: rec.last_name ?? "",
    role: rec.role ?? "WORKER",
    isActive: rec.is_active ?? true,
    // NOTE: The PostgreSQL password hash is NOT migrated. Users will need
    // to be re-created in Clerk or have their credentials reset.
  };
}

function transformInvoice(rec) {
  const customerId = customerIdMap.get(rec.customer_id);
  if (!customerId) {
    console.warn(
      `  [WARN] Invoice "${rec.id}" references unknown customer_id=${rec.customer_id}, skipping.`
    );
    return null;
  }
  return {
    pgId: rec.id, // readable ID string
    readableId: rec.id,
    customerId,
    issueDate: toEpochMs(rec.issue_date) ?? Date.now(),
    paymentDate: toEpochMs(rec.payment_date),
    totalPrice: rec.total_price ?? 0,
    amountPaidNow: rec.amount_paid_now ?? 0,
    remainingBalance: rec.remaining_balance ?? 0,
    status: rec.status ?? "PENDING",
    workStatus: rec.work_status ?? "PENDING",
    notes: rec.notes,
    pdfUrl: rec.pdf_url,
    createdAt: toEpochMs(rec.created_at) ?? Date.now(),
    updatedAt: toEpochMs(rec.updated_at),
  };
}

function transformInvoiceLine(rec) {
  const invoiceId = invoiceIdMap.get(rec.invoice_id);
  if (!invoiceId) {
    console.warn(
      `  [WARN] InvoiceLine ${rec.id} references unknown invoice_id="${rec.invoice_id}", skipping.`
    );
    return null;
  }
  const glassTypeId = glassTypeIdMap.get(rec.glass_type_id);
  if (!glassTypeId) {
    console.warn(
      `  [WARN] InvoiceLine ${rec.id} references unknown glass_type_id=${rec.glass_type_id}, skipping.`
    );
    return null;
  }
  return {
    pgId: rec.id,
    invoiceId,
    glassTypeId,
    width: rec.width ?? 0,
    height: rec.height ?? 0,
    dimensionUnit: rec.dimension_unit ?? "CM",
    diameter: rec.diameter,
    areaM2: rec.area_m2,
    lengthM: rec.length_m,
    quantity: rec.quantity ?? 1,
    shatafMeters: rec.shataf_meters,
    cuttingType: rec.cutting_type,
    shatafType: rec.shataf_type,
    farmaType: rec.farma_type,
    manualCuttingPrice: rec.manual_cutting_price,
    cuttingPrice: rec.cutting_price,
    cuttingRate: rec.cutting_rate,
    glassPrice: rec.glass_price,
    lineTotal: rec.line_total,
    notes: rec.notes,
    status: rec.status ?? "PENDING",
  };
}

function transformInvoiceLineOperation(rec) {
  const invoiceLineId = invoiceLineIdMap.get(rec.invoice_line_id);
  if (!invoiceLineId) {
    console.warn(
      `  [WARN] InvoiceLineOperation ${rec.id} references unknown invoice_line_id=${rec.invoice_line_id}, skipping.`
    );
    return null;
  }
  return {
    invoiceLineId,
    operationType: rec.operation_type,
    shatafType: rec.shataf_type,
    farmaType: rec.farma_type,
    diameter: rec.diameter,
    manualCuttingPrice: rec.manual_cutting_price,
    laserType: rec.laser_type,
    manualPrice: rec.manual_price,
    notes: rec.notes,
    shatafMeters: rec.shataf_meters,
    ratePerMeter: rec.rate_per_meter,
    operationPrice: rec.operation_price ?? 0,
  };
}

function transformPayment(rec) {
  const customerId = customerIdMap.get(rec.customer_id);
  if (!customerId) {
    console.warn(
      `  [WARN] Payment ${rec.id} references unknown customer_id=${rec.customer_id}, skipping.`
    );
    return null;
  }
  // invoice_id is nullable
  let invoiceId = undefined;
  if (rec.invoice_id != null) {
    invoiceId = invoiceIdMap.get(rec.invoice_id);
    if (!invoiceId) {
      console.warn(
        `  [WARN] Payment ${rec.id} references unknown invoice_id="${rec.invoice_id}", setting to null.`
      );
      invoiceId = undefined;
    }
  }
  return {
    customerId,
    invoiceId,
    amount: rec.amount ?? 0,
    paymentMethod: rec.payment_method ?? "CASH",
    paymentDate: toEpochMs(rec.payment_date) ?? Date.now(),
    referenceNumber: rec.reference_number,
    notes: rec.notes,
    createdAt: toEpochMs(rec.created_at) ?? Date.now(),
    createdBy: rec.created_by,
  };
}

function transformPrintJob(rec) {
  const invoiceId = invoiceIdMap.get(rec.invoice_id);
  if (!invoiceId) {
    console.warn(
      `  [WARN] PrintJob ${rec.id} references unknown invoice_id="${rec.invoice_id}", skipping.`
    );
    return null;
  }
  // invoice_line_id is nullable
  let invoiceLineId = undefined;
  if (rec.invoice_line_id != null) {
    invoiceLineId = invoiceLineIdMap.get(rec.invoice_line_id);
    if (!invoiceLineId) {
      console.warn(
        `  [WARN] PrintJob ${rec.id} references unknown invoice_line_id=${rec.invoice_line_id}, setting to null.`
      );
      invoiceLineId = undefined;
    }
  }
  return {
    invoiceId,
    type: rec.type ?? "CLIENT",
    status: rec.status ?? "QUEUED",
    // pdfStorageId is intentionally not migrated (old PDF files are not in Convex storage)
    pdfPath: rec.pdf_path,
    errorMessage: rec.error_message,
    createdAt: toEpochMs(rec.created_at) ?? Date.now(),
    printedAt: toEpochMs(rec.printed_at),
    invoiceLineId,
  };
}

function transformNotification(rec) {
  // user_id is nullable (null = broadcast)
  let targetUserId = undefined;
  if (rec.user_id != null) {
    targetUserId = userIdMap.get(String(rec.user_id));
    if (!targetUserId) {
      console.warn(
        `  [WARN] Notification ${rec.id} references unknown user_id="${rec.user_id}", setting targetUserId to null.`
      );
      targetUserId = undefined;
    }
  }

  // read_by_users and hidden_by_users are comma-separated strings in PostgreSQL
  const readByUserIds = rec.read_by_users
    ? String(rec.read_by_users)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const hiddenByUserIds = rec.hidden_by_users
    ? String(rec.hidden_by_users)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return {
    title: rec.title ?? "",
    message: rec.message ?? "",
    type: rec.type ?? "INFO",
    targetUserId,
    actionUrl: rec.action_url,
    relatedEntity: rec.related_entity,
    readByUserIds,
    hiddenByUserIds,
    createdAt: toEpochMs(rec.created_at) ?? Date.now(),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helper: strip temporary pgId before insertion
// ────────────────────────────────────────────────────────────────────────────

/**
 * Remove the temporary `pgId` field from a record before sending to Convex.
 * @param {object} rec
 * @returns {object}
 */
function stripPgId(rec) {
  if (rec == null) return rec;
  const { pgId, ...rest } = rec;
  return rest;
}

// ────────────────────────────────────────────────────────────────────────────
// Helper: strip undefined values (Convex doesn't accept explicit undefined)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Remove keys whose values are undefined or null. Convex optional fields
 * should simply be omitted rather than set to undefined/null.
 * (Required fields with null will still cause a Convex validation error,
 * which is the desired behavior.)
 */
function stripUndefined(obj) {
  if (obj == null) return obj;
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      clean[key] = value;
    }
  }
  return clean;
}

// ────────────────────────────────────────────────────────────────────────────
// Main migration steps
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(72));
  console.log("  ElGuindy Glass - PostgreSQL to Convex Migration");
  console.log("=".repeat(72));
  console.log(`  Convex URL : ${CONVEX_URL}`);
  console.log(`  Data dir   : ${DATA_DIR}`);
  console.log(`  Batch size : ${BATCH_SIZE}`);
  console.log("=".repeat(72));
  console.log();

  if (!fs.existsSync(DATA_DIR)) {
    console.error(`[FATAL] Data directory does not exist: ${DATA_DIR}`);
    console.error(
      "  Run the PostgreSQL export first:\n" +
        "    mkdir -p scripts/data\n" +
        "    psql -d elguindy -f scripts/export-postgres.sql"
    );
    process.exit(1);
  }

  // ── Step 1: Config tables (no dependencies) ────────────────────────────

  console.log("STEP 1: Config tables (cuttingRates, shatafRates, operationPrices, companyProfile)");
  console.log("-".repeat(72));

  // 1a. Cutting rates
  {
    const raw = await readJsonl(path.join(DATA_DIR, "cutting_rates.jsonl"));
    const records = raw.map(transformCuttingRate).map(stripUndefined);
    await insertInBatches("cuttingRates", records, "cuttingRates");
  }

  // 1b. Shataf rates
  {
    const raw = await readJsonl(path.join(DATA_DIR, "shataf_rates.jsonl"));
    const records = raw.map(transformShatafRate).map(stripUndefined);
    await insertInBatches("shatafRates", records, "shatafRates");
  }

  // 1c. Operation prices
  {
    const raw = await readJsonl(path.join(DATA_DIR, "operation_prices.jsonl"));
    const records = raw.map(transformOperationPrice).map(stripUndefined);
    await insertInBatches("operationPrices", records, "operationPrices");
  }

  // 1d. Company profile
  {
    const raw = await readJsonl(path.join(DATA_DIR, "company_profile.jsonl"));
    const records = raw.map(transformCompanyProfile).map(stripUndefined);
    await insertInBatches("companyProfile", records, "companyProfile");
  }

  console.log();

  // ── Step 2: Customers ──────────────────────────────────────────────────

  console.log("STEP 2: Customers");
  console.log("-".repeat(72));
  {
    const raw = await readJsonl(path.join(DATA_DIR, "customer.jsonl"));
    const transformed = raw.map(transformCustomer);
    const pgIds = transformed.map((r) => r.pgId);
    const records = transformed.map(stripPgId).map(stripUndefined);
    const ids = await insertInBatches("customers", records, "customers");

    for (let i = 0; i < pgIds.length; i++) {
      if (ids[i]) customerIdMap.set(pgIds[i], ids[i]);
    }
    console.log(`  Mapped ${customerIdMap.size} customer IDs.`);
  }
  console.log();

  // ── Step 3: Glass Types ────────────────────────────────────────────────

  console.log("STEP 3: Glass Types");
  console.log("-".repeat(72));
  {
    const raw = await readJsonl(path.join(DATA_DIR, "glass_type.jsonl"));
    const transformed = raw.map(transformGlassType);
    const pgIds = transformed.map((r) => r.pgId);
    const records = transformed.map(stripPgId).map(stripUndefined);
    const ids = await insertInBatches("glassTypes", records, "glassTypes");

    for (let i = 0; i < pgIds.length; i++) {
      if (ids[i]) glassTypeIdMap.set(pgIds[i], ids[i]);
    }
    console.log(`  Mapped ${glassTypeIdMap.size} glass type IDs.`);
  }
  console.log();

  // ── Step 4: Users ──────────────────────────────────────────────────────

  console.log("STEP 4: Users");
  console.log("-".repeat(72));
  console.log(
    "  NOTE: PostgreSQL password hashes are NOT migrated."
  );
  console.log(
    '  Placeholder clerkUserId values ("migrated_<uuid>") are generated.'
  );
  console.log(
    "  You MUST manually map these to real Clerk user IDs after migration."
  );
  {
    const raw = await readJsonl(path.join(DATA_DIR, "users.jsonl"));
    const transformed = raw.map(transformUser);
    const pgIds = transformed.map((r) => r.pgId);
    const records = transformed.map(stripPgId).map(stripUndefined);
    const ids = await insertInBatches("users", records, "users");

    for (let i = 0; i < pgIds.length; i++) {
      if (ids[i]) userIdMap.set(String(pgIds[i]), ids[i]);
    }
    console.log(`  Mapped ${userIdMap.size} user IDs.`);
  }
  console.log();

  // ── Step 5: Invoices ───────────────────────────────────────────────────

  console.log("STEP 5: Invoices");
  console.log("-".repeat(72));
  {
    const raw = await readJsonl(path.join(DATA_DIR, "invoice.jsonl"));
    const transformed = raw.map(transformInvoice);
    const validRecords = [];
    const pgIds = [];
    for (const rec of transformed) {
      if (rec != null) {
        pgIds.push(rec.pgId);
        validRecords.push(stripPgId(rec));
      } else {
        stats.tables["invoices"] = stats.tables["invoices"] || {
          total: 0,
          imported: 0,
          skipped: 0,
          errors: 0,
        };
        stats.tables["invoices"].skipped =
          (stats.tables["invoices"].skipped || 0) + 1;
      }
    }
    const records = validRecords.map(stripUndefined);
    const ids = await insertInBatches("invoices", records, "invoices");

    for (let i = 0; i < pgIds.length; i++) {
      if (ids[i]) invoiceIdMap.set(pgIds[i], ids[i]);
    }
    console.log(`  Mapped ${invoiceIdMap.size} invoice IDs.`);
  }
  console.log();

  // ── Step 6: Invoice Lines ──────────────────────────────────────────────

  console.log("STEP 6: Invoice Lines");
  console.log("-".repeat(72));
  {
    const raw = await readJsonl(path.join(DATA_DIR, "invoice_line.jsonl"));
    const transformed = raw.map(transformInvoiceLine);
    const validRecords = [];
    const pgIds = [];
    let skipped = 0;
    for (const rec of transformed) {
      if (rec != null) {
        pgIds.push(rec.pgId);
        validRecords.push(stripPgId(rec));
      } else {
        skipped++;
      }
    }
    const records = validRecords.map(stripUndefined);
    const ids = await insertInBatches("invoiceLines", records, "invoiceLines");

    for (let i = 0; i < pgIds.length; i++) {
      if (ids[i]) invoiceLineIdMap.set(pgIds[i], ids[i]);
    }
    if (stats.tables["invoiceLines"]) {
      stats.tables["invoiceLines"].skipped = skipped;
    }
    console.log(`  Mapped ${invoiceLineIdMap.size} invoice line IDs.`);
  }
  console.log();

  // ── Step 7: Invoice Line Operations ────────────────────────────────────

  console.log("STEP 7: Invoice Line Operations");
  console.log("-".repeat(72));
  {
    const raw = await readJsonl(
      path.join(DATA_DIR, "invoice_line_operation.jsonl")
    );
    const transformed = raw.map(transformInvoiceLineOperation);
    const validRecords = [];
    let skipped = 0;
    for (const rec of transformed) {
      if (rec != null) {
        validRecords.push(rec);
      } else {
        skipped++;
      }
    }
    const records = validRecords.map(stripUndefined);
    await insertInBatches(
      "invoiceLineOperations",
      records,
      "invoiceLineOperations"
    );
    if (stats.tables["invoiceLineOperations"]) {
      stats.tables["invoiceLineOperations"].skipped = skipped;
    }
  }
  console.log();

  // ── Step 8: Payments ───────────────────────────────────────────────────

  console.log("STEP 8: Payments");
  console.log("-".repeat(72));
  {
    const raw = await readJsonl(path.join(DATA_DIR, "payments.jsonl"));
    const transformed = raw.map(transformPayment);
    const validRecords = [];
    let skipped = 0;
    for (const rec of transformed) {
      if (rec != null) {
        validRecords.push(rec);
      } else {
        skipped++;
      }
    }
    const records = validRecords.map(stripUndefined);
    await insertInBatches("payments", records, "payments");
    if (stats.tables["payments"]) {
      stats.tables["payments"].skipped = skipped;
    }
  }
  console.log();

  // ── Step 9: Print Jobs ─────────────────────────────────────────────────

  console.log("STEP 9: Print Jobs");
  console.log("-".repeat(72));
  {
    const raw = await readJsonl(path.join(DATA_DIR, "print_job.jsonl"));
    const transformed = raw.map(transformPrintJob);
    const validRecords = [];
    let skipped = 0;
    for (const rec of transformed) {
      if (rec != null) {
        validRecords.push(rec);
      } else {
        skipped++;
      }
    }
    const records = validRecords.map(stripUndefined);
    await insertInBatches("printJobs", records, "printJobs");
    if (stats.tables["printJobs"]) {
      stats.tables["printJobs"].skipped = skipped;
    }
  }
  console.log();

  // ── Step 10: Notifications ─────────────────────────────────────────────

  console.log("STEP 10: Notifications");
  console.log("-".repeat(72));
  {
    const raw = await readJsonl(path.join(DATA_DIR, "notifications.jsonl"));
    const records = raw.map(transformNotification).map(stripUndefined);
    await insertInBatches("notifications", records, "notifications");
  }
  console.log();

  // ── Step 11: ID Counters ───────────────────────────────────────────────

  console.log("STEP 11: ID Counters");
  console.log("-".repeat(72));
  {
    // Scan all readableId values to find max counter per prefix.
    // Readable IDs follow the pattern: "INV-YYYY-NNN"
    // We extract the prefix "INV-YYYY" and the numeric suffix NNN.
    /** @type {Map<string, number>} prefix -> max counter */
    const prefixMaxMap = new Map();

    for (const readableId of invoiceIdMap.keys()) {
      // Match patterns like "INV-2026-001" or "INV-2026-42"
      const match = readableId.match(/^(.+)-(\d+)$/);
      if (match) {
        const prefix = match[1]; // e.g. "INV-2026"
        const num = parseInt(match[2], 10);
        const current = prefixMaxMap.get(prefix) || 0;
        if (num > current) {
          prefixMaxMap.set(prefix, num);
        }
      } else {
        console.warn(
          `  [WARN] Could not parse readableId for counter: "${readableId}"`
        );
      }
    }

    const counterRecords = [];
    for (const [prefix, currentValue] of prefixMaxMap.entries()) {
      counterRecords.push({ prefix, currentValue });
      console.log(`  Counter: ${prefix} -> ${currentValue}`);
    }

    if (counterRecords.length > 0) {
      await insertInBatches("idCounters", counterRecords, "idCounters");
    } else {
      console.log("  No ID counters to create (no invoices found).");
      initTableStats("idCounters");
    }
  }
  console.log();

  // ── Summary ────────────────────────────────────────────────────────────

  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);

  console.log("=".repeat(72));
  console.log("  Migration Summary");
  console.log("=".repeat(72));
  console.log();
  console.log(
    "  Table                     | Total | Imported | Skipped | Errors"
  );
  console.log(
    "  --------------------------+-------+----------+---------+-------"
  );

  const tableOrder = [
    "cuttingRates",
    "shatafRates",
    "operationPrices",
    "companyProfile",
    "customers",
    "glassTypes",
    "users",
    "invoices",
    "invoiceLines",
    "invoiceLineOperations",
    "payments",
    "printJobs",
    "notifications",
    "idCounters",
  ];

  let grandTotal = 0;
  let grandImported = 0;
  let grandSkipped = 0;
  let grandErrors = 0;

  for (const name of tableOrder) {
    const s = stats.tables[name] || {
      total: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
    };
    grandTotal += s.total;
    grandImported += s.imported;
    grandSkipped += s.skipped;
    grandErrors += s.errors;

    console.log(
      `  ${name.padEnd(26)}| ${String(s.total).padStart(5)} | ${String(
        s.imported
      ).padStart(8)} | ${String(s.skipped).padStart(7)} | ${String(
        s.errors
      ).padStart(5)}`
    );
  }

  console.log(
    "  --------------------------+-------+----------+---------+-------"
  );
  console.log(
    `  ${"TOTAL".padEnd(26)}| ${String(grandTotal).padStart(5)} | ${String(
      grandImported
    ).padStart(8)} | ${String(grandSkipped).padStart(7)} | ${String(
      grandErrors
    ).padStart(5)}`
  );
  console.log();
  console.log(`  Elapsed time: ${elapsed}s`);
  console.log();

  // ── ID Mappings Summary ────────────────────────────────────────────────

  console.log("  ID Mappings:");
  console.log(`    Customers    : ${customerIdMap.size} entries`);
  console.log(`    Glass Types  : ${glassTypeIdMap.size} entries`);
  console.log(`    Users        : ${userIdMap.size} entries`);
  console.log(`    Invoices     : ${invoiceIdMap.size} entries`);
  console.log(`    Invoice Lines: ${invoiceLineIdMap.size} entries`);
  console.log();

  if (grandErrors > 0) {
    console.log(
      `  [!] ${grandErrors} record(s) failed to import. Check the logs above for details.`
    );
    console.log();
  }

  if (userIdMap.size > 0) {
    console.log("  [ACTION REQUIRED] User migration notes:");
    console.log(
      '    - Migrated users have placeholder clerkUserId values ("migrated_<uuid>").'
    );
    console.log(
      "    - You MUST create corresponding Clerk users and update the"
    );
    console.log("      clerkUserId field for each user in the Convex dashboard.");
    console.log(
      "    - PostgreSQL password hashes were NOT migrated (Clerk manages auth)."
    );
    console.log();
  }

  console.log("=".repeat(72));
  console.log("  Migration complete.");
  console.log("=".repeat(72));

  if (grandErrors > 0) {
    process.exit(1);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Entry point
// ────────────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error("[FATAL] Unhandled error during migration:");
  console.error(err);
  process.exit(2);
});
