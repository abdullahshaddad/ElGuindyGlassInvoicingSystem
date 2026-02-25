import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ============================================================
// Scalar / enum validators
// ============================================================

export const customerType = v.union(
  v.literal("CASH"),
  v.literal("REGULAR"),
  v.literal("COMPANY")
);

export const invoiceStatus = v.union(
  v.literal("PENDING"),
  v.literal("PAID"),
  v.literal("PARTIALLY_PAID"),
  v.literal("CANCELLED")
);

export const workStatus = v.union(
  v.literal("PENDING"),
  v.literal("IN_PROGRESS"),
  v.literal("COMPLETED"),
  v.literal("CANCELLED")
);

export const lineStatus = v.union(
  v.literal("PENDING"),
  v.literal("IN_PROGRESS"),
  v.literal("COMPLETED"),
  v.literal("CANCELLED")
);

export const dimensionUnit = v.union(
  v.literal("MM"),
  v.literal("CM"),
  v.literal("M")
);

/** How a glass type's price is computed — per square metre (AREA) or per linear metre (LENGTH). */
export const glassPricingMethod = v.union(
  v.literal("AREA"),
  v.literal("LENGTH")
);

export const paymentMethod = v.union(
  v.literal("CASH"),
  v.literal("CARD"),
  v.literal("BANK_TRANSFER"),
  v.literal("CHECK"),
  v.literal("VODAFONE_CASH"),
  v.literal("OTHER")
);

export const printStatus = v.union(
  v.literal("QUEUED"),
  v.literal("PRINTING"),
  v.literal("PRINTED"),
  v.literal("FAILED")
);

export const printType = v.union(
  v.literal("CLIENT"),
  v.literal("OWNER"),
  v.literal("STICKER")
);

export const notificationType = v.union(
  v.literal("SUCCESS"),
  v.literal("ERROR"),
  v.literal("WARNING"),
  v.literal("INFO")
);

export const userRole = v.union(
  v.literal("WORKER"),
  v.literal("CASHIER"),
  v.literal("ADMIN"),
  v.literal("OWNER")
);

/**
 * Edge-finish styles stored in the `bevelingRates` configuration table.
 * Codes are intentionally consistent with `operationTypeCode` used on invoice lines.
 */
export const bevelingType = v.union(
  v.literal("KHARZAN"),      // Bullnose / Round edge
  v.literal("CHAMBOURLIEH"), // Chamfered / Ogee edge
  v.literal("BEVEL_1_CM"),   // 1 cm Bevel
  v.literal("BEVEL_2_CM"),   // 2 cm Bevel
  v.literal("BEVEL_3_CM"),   // 3 cm Bevel
  v.literal("JULIA"),        // Decorative edge profile
  v.literal("SANDING"),      // Frosted / Sanding (per m²)
  v.literal("LASER"),        // Laser cut
  v.literal("CURVE_ARCH"),   // Curve / Arch shape
  v.literal("PANELS")        // Panels (Tableaus)
);

/** High-level operation category used in the `operationPrices` configuration table. */
export const operationCategory = v.union(
  v.literal("BEVELING"),    // Edge-finish operations (Kharzan, Bevel, etc.)
  v.literal("CALCULATION"), // Perimeter formula variants (Frame Head, Full Frame, etc.)
  v.literal("LASER")        // Laser cutting operations
);

// ============================================================
// Invoice Line Operations — bilingual label validators
//
// Operations are embedded directly inside each `invoiceLines`
// document.  Storing the full bilingual label (code + ar + en)
// — not just a code — means every historical invoice remains
// readable and printable even if the operation catalogue
// changes in the future.
// ============================================================

/** Internal code for the edge-finish / cutting style applied to a glass piece. */
export const operationTypeCode = v.union(
  v.literal("KHARZAN"),      // خرزان        – Bullnose / Round edge
  v.literal("CHAMBOURLIEH"), // شمبورليه      – Chamfered / Ogee edge
  v.literal("BEVEL_1_CM"),   // 1 سم          – 1 cm Bevel
  v.literal("BEVEL_2_CM"),   // 2 سم          – 2 cm Bevel
  v.literal("BEVEL_3_CM"),   // 3 سم          – 3 cm Bevel
  v.literal("JULIA"),        // جوليا         – Decorative edge profile
  v.literal("LASER"),        // ليزر           – Laser (Manual entry)
  v.literal("SANDING")       // صنفرة          – Sanding / Frosted (per m²)
);

/** Internal code for the perimeter formula used to derive beveling edge length. */
export const calculationMethodCode = v.union(
  v.literal("STRAIGHT"),            // عدل               – Straight (Standard)
  v.literal("FRAME_HEAD"),          // راس فارمة          – Frame Head
  v.literal("2_FRAME_HEADS"),       // 2 راس فارمة        – 2 Frame Heads
  v.literal("FRAME_SIDE"),          // جنب فارمة          – Frame Side
  v.literal("2_FRAME_SIDES"),       // 2 جنب فارمة        – 2 Frame Sides
  v.literal("FRAME_HEAD_SIDE"),     // رأس + جنب فارمة    – Frame Head + Side
  v.literal("2_FRAME_HEADS_SIDE"),  // 2 رأس + جنب فارمة  – 2 Frame Heads + Side
  v.literal("2_FRAME_SIDES_HEAD"),  // 2 جنب + راس فارمة  – 2 Frame Sides + Head
  v.literal("FULL_FRAME"),          // فارمة كاملة        – Full Frame
  v.literal("CIRCLE"),              // العجلة             – Wheel / Circle
  v.literal("CURVE_ARCH"),          // الدوران            – Curve / Arch
  v.literal("PANELS")               // التابلوهات         – Panels (Tableaus)
);

/**
 * A bilingual label snapshot: the internal code alongside the Arabic and English
 * display names captured at invoice creation time.
 */
export const operationTypeLabel = v.object({
  code: operationTypeCode,
  ar:   v.string(),
  en:   v.string(),
});

export const calculationMethodLabel = v.object({
  code: calculationMethodCode,
  ar:   v.string(),
  en:   v.string(),
});

/**
 * A single operation embedded inside an invoice line.
 *
 * Example — Kharzan, Straight:
 *   { operationType:     { code: "KHARZAN",  ar: "خرزان", en: "Kharzan (Bullnose / Round edge)" },
 *     calculationMethod: { code: "STRAIGHT", ar: "عدل",   en: "Straight (Standard)" },
 *     price: 45 }
 *
 * Example — Laser, manual metres:
 *   { operationType: { code: "LASER", ar: "ليزر (إدخال يدوي)", en: "Laser (Manual entry)" },
 *     manualMeters: 2.4,
 *     price: 96 }
 */
export const invoiceLineOperationValidator = v.object({
  /** Edge-finish / cutting style (e.g. Kharzan, 1 cm Bevel, Laser). */
  operationType: operationTypeLabel,

  /**
   * Perimeter formula used to derive the beveling edge length in metres.
   * Omitted for area-based operations (SANDING) or when length is entered manually.
   */
  calculationMethod: v.optional(calculationMethodLabel),

  /**
   * Manually entered edge length in metres.
   * Required when the edge length cannot be auto-derived from the glass dimensions
   * (e.g. irregular shapes, or when calculationMethod is absent).
   */
  manualMeters: v.optional(v.number()),

  /** Final price charged for this operation on this line (EGP). */
  price: v.number(),
});

// ============================================================
// Schema Definition
// ============================================================

export default defineSchema({
  // ---------------------- Customers ----------------------
  customers: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    customerType: customerType,
    balance: v.number(),
    createdAt: v.number(), // epoch ms
    updatedAt: v.optional(v.number()),
  })
    .index("by_phone", ["phone"])
    .index("by_name",  ["name"])
    .searchIndex("search_name", { searchField: "name" }),

  // ---------------------- Glass Types ----------------------
  glassTypes: defineTable({
    name: v.string(),
    thickness: v.number(),     // mm
    color: v.optional(v.string()),
    pricePerMeter: v.number(),
    pricingMethod: v.optional(glassPricingMethod), // AREA | LENGTH
    active: v.boolean(),
  })
    .index("by_active", ["active"])
    .index("by_name",   ["name"]),

  // ---------------------- Invoices ----------------------
  invoices: defineTable({
    readableId: v.string(),              // e.g. "INV-2024-001"
    invoiceNumber: v.optional(v.number()), // sequential numeric ID; optional for legacy docs
    customerId: v.id("customers"),
    issueDate: v.number(),               // epoch ms
    paymentDate: v.optional(v.number()),
    totalPrice: v.number(),
    amountPaidNow: v.number(),
    remainingBalance: v.number(),
    status: invoiceStatus,
    workStatus: workStatus,
    notes: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_readableId",           ["readableId"])
    .index("by_invoiceNumber",        ["invoiceNumber"])
    .index("by_customerId",           ["customerId"])
    .index("by_status",               ["status"])
    .index("by_issueDate",            ["issueDate"])
    .index("by_customerId_issueDate", ["customerId", "issueDate"]),

  // ---------------------- Invoice Lines ----------------------
  //
  // One document per glass piece / batch.  Operations are embedded as an
  // array so a single document read returns the complete line with all
  // pricing detail — no secondary query required.
  invoiceLines: defineTable({
    invoiceId: v.id("invoices"),

    // ── Glass type ──────────────────────────────────────────────────────────
    /** Live reference — used for admin lookups and rate-table joins. */
    glassTypeId: v.id("glassTypes"),

    /**
     * Immutable snapshot of glass-type data captured at invoice creation time.
     * Ensures PDFs and audit trails stay accurate even if the glass-type record
     * is later renamed, repriced, or deleted.
     */
    glassTypeSnapshot: v.object({
      name:      v.string(),
      thickness: v.number(),            // mm
      color:     v.optional(v.string()),
    }),

    // ── Dimensions ──────────────────────────────────────────────────────────
    /**
     * Dimensions as entered by the cashier, stored in the original unit.
     * Use dimensionUtils.ts to convert to metres for calculations.
     */
    dimensions: v.object({
      width:         v.number(),
      height:        v.number(),
      measuringUnit: dimensionUnit,     // "MM" | "CM" | "M"
    }),

    /** Diameter in the original unit — populated for circular / arch shapes. */
    diameter: v.optional(v.number()),

    /** Number of identical pieces in this line. */
    quantity: v.number(),

    // ── Derived measurements (computed at creation, stored for display) ─────
    areaM2:         v.optional(v.number()), // glass area in m²
    lengthM:        v.optional(v.number()), // glass perimeter / edge length in m
    bevelingMeters: v.optional(v.number()), // total beveling edge length in m

    // ── Edge treatment ───────────────────────────────────────────────────────
    /** Broad category: "BEVELING" | "LASER" — used for filtering and display. */
    edgeTreatment: v.optional(v.union(v.literal("BEVELING"), v.literal("LASER"))),
    manualCuttingPrice: v.optional(v.number()), // overrides rate-table lookup
    cuttingPrice:       v.optional(v.number()), // final resolved cutting cost
    cuttingRate:        v.optional(v.number()), // rate per metre used

    // ── Pricing ──────────────────────────────────────────────────────────────
    glassPrice: v.optional(v.number()), // area/length × pricePerMeter
    lineTotal:  v.optional(v.number()), // glassPrice + cuttingPrice + Σ operation prices

    // ── Embedded operations ───────────────────────────────────────────────────
    /**
     * All edge-finish / cutting / sanding operations applied to this piece.
     * Each entry carries a bilingual label snapshot so the record is
     * self-contained and language-independent.
     */
    operations: v.array(invoiceLineOperationValidator),

    // ── Workflow ──────────────────────────────────────────────────────────────
    notes:  v.optional(v.string()),
    status: lineStatus,
  })
    .index("by_invoiceId", ["invoiceId"])
    .index("by_status",    ["status"]),

  // ---------------------- Payments ----------------------
  payments: defineTable({
    customerId: v.id("customers"),
    invoiceId: v.optional(v.id("invoices")),
    amount: v.number(),
    paymentMethod: paymentMethod,
    paymentDate: v.number(), // epoch ms
    referenceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.optional(v.string()),
  })
    .index("by_customerId",  ["customerId"])
    .index("by_invoiceId",   ["invoiceId"])
    .index("by_paymentDate", ["paymentDate"]),

  // ---------------------- Print Jobs ----------------------
  printJobs: defineTable({
    invoiceId: v.id("invoices"),
    invoiceReadableId: v.optional(v.string()),
    readableId: v.optional(v.string()),
    type: printType,
    status: printStatus,
    pdfStorageId: v.optional(v.id("_storage")),
    pdfPath: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    printedAt: v.optional(v.number()),
    invoiceLineId: v.optional(v.id("invoiceLines")), // for single-line sticker jobs
  })
    .index("by_invoiceId",      ["invoiceId"])
    .index("by_status",         ["status"])
    .index("by_invoiceId_type", ["invoiceId", "type"])
    .index("by_readableId",     ["readableId"]),

  // ---------------------- Laser Rates ----------------------
  // Rate lookup: given a glass thickness, what is the laser cutting rate per metre?
  laserRates: defineTable({
    minThickness: v.number(), // mm (inclusive)
    maxThickness: v.number(), // mm (inclusive)
    ratePerMeter: v.number(),
    active: v.boolean(),
  }).index("by_active", ["active"]),

  // ---------------------- Beveling Rates ----------------------
  // Rate lookup: given an edge-finish style and glass thickness, what is the rate per metre?
  bevelingRates: defineTable({
    bevelingType: bevelingType,
    minThickness: v.number(), // mm (inclusive)
    maxThickness: v.number(), // mm (inclusive)
    ratePerMeter: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_bevelingType_active", ["bevelingType", "active"]),

  // ---------------------- Operation Prices ----------------------
  operationPrices: defineTable({
    category: operationCategory, // BEVELING | CALCULATION | LASER
    subtype: v.string(),
    arabicName: v.string(),
    englishName: v.optional(v.string()),
    basePrice: v.number(),
    unit: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.boolean(),
    displayOrder: v.optional(v.number()),
  }).index("by_category_subtype", ["category", "subtype"]),

  // ---------------------- Company Profile ----------------------
  companyProfile: defineTable({
    companyName: v.string(),
    companyNameArabic: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    taxId: v.optional(v.string()),
    commercialRegister: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    logoBase64: v.optional(v.string()),
    logoContentType: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    footerText: v.optional(v.string()),
  }),

  // ---------------------- Users ----------------------
  users: defineTable({
    clerkUserId: v.string(),
    username: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: userRole,
    isActive: v.boolean(),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_username",    ["username"]),

  // ---------------------- Notifications ----------------------
  notifications: defineTable({
    title: v.string(),
    message: v.string(),
    type: notificationType,
    targetUserId: v.optional(v.id("users")), // undefined = broadcast to all
    actionUrl: v.optional(v.string()),
    relatedEntity: v.optional(v.string()),
    readByUserIds: v.array(v.string()),
    hiddenByUserIds: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_targetUserId", ["targetUserId"])
    .index("by_createdAt",    ["createdAt"]),

  // ---------------------- ID Counters ----------------------
  idCounters: defineTable({
    prefix: v.string(),
    currentValue: v.number(),
  }).index("by_prefix", ["prefix"]),
});
