// ============================================================
// Enum types and metadata
// ============================================================

// ---------- Customer Type ----------
export type CustomerType = "CASH" | "REGULAR" | "COMPANY";

// ---------- Invoice Status ----------
export type InvoiceStatus = "PENDING" | "PAID" | "PARTIALLY_PAID" | "CANCELLED";

export const INVOICE_STATUS_ARABIC: Record<InvoiceStatus, string> = {
  PENDING: "معلق",
  PAID: "مدفوع",
  PARTIALLY_PAID: "مدفوع جزئياً",
  CANCELLED: "ملغي",
};

// ---------- Work Status ----------
export type WorkStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export const WORK_STATUS_ARABIC: Record<WorkStatus, string> = {
  PENDING: "معلق",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

// ---------- Line Status ----------
export type LineStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export const LINE_STATUS_ARABIC: Record<LineStatus, string> = {
  PENDING: "معلق",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

// ---------- Dimension Unit ----------
export type DimensionUnit = "MM" | "CM" | "M";

export const DIMENSION_UNIT_ARABIC: Record<DimensionUnit, string> = {
  MM: "مليمتر",
  CM: "سنتيمتر",
  M: "متر",
};

export const DIMENSION_CONVERSION_TO_METERS: Record<DimensionUnit, number> = {
  MM: 0.001,
  CM: 0.01,
  M: 1.0,
};

// ---------- Glass Pricing Method ----------
/** How a glass type's price is computed — per square metre (AREA) or per linear metre (LENGTH). */
export type GlassPricingMethod = "AREA" | "LENGTH";

export const GLASS_PRICING_METHOD_ARABIC: Record<GlassPricingMethod, string> = {
  AREA: "مساحة",
  LENGTH: "طول",
};

// ---------- Operation Category (for operationPrices configuration table) ----------
export type OperationCategory = "BEVELING" | "CALCULATION" | "LASER";

// ---------- Beveling Type (edge finish style) ----------
// Codes are consistent with operationTypeCode + bevelingType in schema.ts.
export type BevelingType =
  | "KHARZAN"
  | "CHAMBOURLIEH"
  | "BEVEL_1_CM"
  | "BEVEL_2_CM"
  | "BEVEL_3_CM"
  | "JULIA"
  | "SANDING"
  | "LASER"
  | "CURVE_ARCH"
  | "PANELS";

export const BEVELING_TYPE_ARABIC: Record<BevelingType, string> = {
  KHARZAN:      "خرزان",
  CHAMBOURLIEH: "شمبورليه",
  BEVEL_1_CM:   "1 سم",
  BEVEL_2_CM:   "2 سم",
  BEVEL_3_CM:   "3 سم",
  JULIA:        "جوليا",
  SANDING:      "صنفرة",
  LASER:        "ليزر (يدوي)",
  CURVE_ARCH:   "دوران (يدوي)",
  PANELS:       "تابلوهات (يدوي)",
};

/** Configuration for a beveling type (edge finish) */
export interface BevelingTypeConfig {
  arabicName: string;
  /** Priced per linear metre using a perimeter formula */
  formulaBased: boolean;
  /** Price entered manually by the cashier */
  manualInput: boolean;
  /** Priced per square metre (e.g. frosted/sanded glass) */
  areaBased: boolean;
}

export const BEVELING_TYPE_CONFIG: Record<BevelingType, BevelingTypeConfig> = {
  KHARZAN:      { arabicName: "خرزان",           formulaBased: true,  manualInput: false, areaBased: false },
  CHAMBOURLIEH: { arabicName: "شمبورليه",         formulaBased: true,  manualInput: false, areaBased: false },
  BEVEL_1_CM:   { arabicName: "1 سم",             formulaBased: true,  manualInput: false, areaBased: false },
  BEVEL_2_CM:   { arabicName: "2 سم",             formulaBased: true,  manualInput: false, areaBased: false },
  BEVEL_3_CM:   { arabicName: "3 سم",             formulaBased: true,  manualInput: false, areaBased: false },
  JULIA:        { arabicName: "جوليا",            formulaBased: true,  manualInput: false, areaBased: false },
  SANDING:      { arabicName: "صنفرة",            formulaBased: false, manualInput: false, areaBased: true  },
  LASER:        { arabicName: "ليزر (يدوي)",      formulaBased: false, manualInput: true,  areaBased: false },
  CURVE_ARCH:   { arabicName: "دوران (يدوي)",     formulaBased: false, manualInput: true,  areaBased: false },
  PANELS:       { arabicName: "تابلوهات (يدوي)",  formulaBased: false, manualInput: true,  areaBased: false },
};

export function isBevelingFormulaBased(bt: BevelingType): boolean {
  return BEVELING_TYPE_CONFIG[bt].formulaBased;
}

export function isBevelingManualInput(bt: BevelingType): boolean {
  return BEVELING_TYPE_CONFIG[bt].manualInput;
}

export function isBevelingAreaBased(bt: BevelingType): boolean {
  return BEVELING_TYPE_CONFIG[bt].areaBased;
}

export function bevelingRequiresThicknessRate(bt: BevelingType): boolean {
  const c = BEVELING_TYPE_CONFIG[bt];
  return c.formulaBased || c.areaBased;
}

// ---------- Beveling Calculation Type (perimeter formula) ----------
// Codes are consistent with calculationMethodCode in schema.ts.
export type BevelingCalcType =
  | "STRAIGHT"
  | "FRAME_HEAD"
  | "2_FRAME_HEADS"
  | "FRAME_SIDE"
  | "2_FRAME_SIDES"
  | "FRAME_HEAD_SIDE"
  | "2_FRAME_HEADS_SIDE"
  | "2_FRAME_SIDES_HEAD"
  | "FULL_FRAME"
  | "CIRCLE"
  | "CURVE_ARCH"
  | "PANELS";

export const BEVELING_CALC_TYPE_ARABIC: Record<BevelingCalcType, string> = {
  STRAIGHT:             "عدل (2 × (طول + عرض))",
  FRAME_HEAD:           "فرما رأس 1",
  "2_FRAME_HEADS":      "فرما رأسين",
  FRAME_SIDE:           "فرما جنب 1",
  "2_FRAME_SIDES":      "فرما جنبين",
  FRAME_HEAD_SIDE:      "فرما رأس وجنب",
  "2_FRAME_HEADS_SIDE": "فرما رأسين وجنب",
  "2_FRAME_SIDES_HEAD": "فرما جنبين ورأس",
  FULL_FRAME:           "فرما كامل",
  CIRCLE:               "العجلة (6 × القطر)",
  CURVE_ARCH:           "الدوران (يدوي)",
  PANELS:               "التابلوهات (يدوي)",
};

/** Returns true when the calculation requires a diameter value (CIRCLE). */
export function bevelingCalcRequiresDiameter(ft: BevelingCalcType): boolean {
  return ft === "CIRCLE";
}

/** Returns true when the edge length must be entered manually (CURVE_ARCH / PANELS). */
export function isBevelingCalcManual(ft: BevelingCalcType): boolean {
  return ft === "CURVE_ARCH" || ft === "PANELS";
}

export function bevelingCalcHasFormula(ft: BevelingCalcType): boolean {
  return !isBevelingCalcManual(ft);
}

// ---------- Payment Method ----------
export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "CHECK" | "VODAFONE_CASH" | "OTHER";

// ---------- Print Status ----------
export type PrintStatus = "QUEUED" | "PRINTING" | "PRINTED" | "FAILED";

export const PRINT_STATUS_ARABIC: Record<PrintStatus, string> = {
  QUEUED: "في الانتظار",
  PRINTING: "يطبع",
  PRINTED: "مطبوع",
  FAILED: "فشل",
};

// ---------- Print Type ----------
export type PrintType = "CLIENT" | "OWNER" | "STICKER";

export const PRINT_TYPE_ARABIC: Record<PrintType, string> = {
  CLIENT: "عميل",
  OWNER: "مالك",
  STICKER: "ملصق",
};

// ---------- Notification Type ----------
export type NotificationType = "SUCCESS" | "ERROR" | "WARNING" | "INFO";

// ---------- User Role ----------
export type UserRole = "WORKER" | "CASHIER" | "ADMIN" | "OWNER" | "SUPERADMIN";

export const USER_ROLE_ARABIC: Record<UserRole, string> = {
  WORKER: "عامل",
  CASHIER: "كاشير",
  ADMIN: "مدير",
  OWNER: "مالك",
  SUPERADMIN: "مدير النظام",
};

export const USER_ROLE_HIERARCHY: Record<UserRole, number> = {
  WORKER: 1,
  CASHIER: 2,
  ADMIN: 3,
  OWNER: 4,
  SUPERADMIN: 5,
};

export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  return USER_ROLE_HIERARCHY[managerRole] > USER_ROLE_HIERARCHY[targetRole];
}

export function isRoleEqualOrHigher(role: UserRole, other: UserRole): boolean {
  return USER_ROLE_HIERARCHY[role] >= USER_ROLE_HIERARCHY[other];
}

// ---------- Tenant Plan ----------
export type TenantPlan = "free" | "starter" | "professional" | "enterprise";

// ---------- Tenant Role ----------
export type TenantRole = "owner" | "admin" | "manager" | "operator" | "viewer";

export const TENANT_ROLE_HIERARCHY: Record<TenantRole, number> = {
  viewer: 1,
  operator: 2,
  manager: 3,
  admin: 4,
  owner: 5,
};

export function canManageTenantRole(managerRole: TenantRole, targetRole: TenantRole): boolean {
  return TENANT_ROLE_HIERARCHY[managerRole] > TENANT_ROLE_HIERARCHY[targetRole];
}

/**
 * Map legacy UserRole to TenantRole for migration.
 * OWNER→owner, ADMIN→admin, CASHIER→manager, WORKER→operator
 */
export const USER_ROLE_TO_TENANT_ROLE: Record<UserRole, TenantRole> = {
  SUPERADMIN: "owner",
  OWNER: "owner",
  ADMIN: "admin",
  CASHIER: "manager",
  WORKER: "operator",
};

// ---------- Invitation Status ----------
export type InvitationStatus = "pending" | "accepted" | "expired";

// ---------- Subscription Status ----------
export type SubscriptionStatus = "active" | "trial" | "past_due" | "cancelled" | "expired";

// ---------- Billing Cycle ----------
export type BillingCycle = "monthly" | "yearly";

// ---------- Subscription Payment Status ----------
export type SubscriptionPaymentStatus = "paid" | "pending" | "failed" | "refunded";

// ---------- Audit Severity ----------
export type AuditSeverity = "info" | "warning" | "critical";

// ---------- RBAC Permissions ----------
export type Permission = `${ResourceType}:${ActionType}`;

export type ResourceType =
  | "orders"
  | "invoices"
  | "products"
  | "stickers"
  | "customers"
  | "inventory"
  | "users"
  | "roles"
  | "settings"
  | "audit"
  | "reports"
  | "tenant";

export type ActionType =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "print"
  | "generate"
  | "invite"
  | "manage"
  | "view";

/** Default permissions per tenant role */
export const TENANT_ROLE_PERMISSIONS: Record<TenantRole, Permission[]> = {
  owner: [
    "orders:create", "orders:read", "orders:update", "orders:delete", "orders:export",
    "invoices:create", "invoices:read", "invoices:update", "invoices:delete", "invoices:print", "invoices:export",
    "products:create", "products:read", "products:update", "products:delete",
    "stickers:generate", "stickers:print",
    "customers:create", "customers:read", "customers:update", "customers:delete",
    "inventory:read", "inventory:update",
    "users:read", "users:invite", "users:manage", "users:delete",
    "roles:read", "roles:manage",
    "settings:read", "settings:update",
    "audit:read", "audit:export",
    "reports:view", "reports:export",
    "tenant:manage",
  ],
  admin: [
    "orders:create", "orders:read", "orders:update", "orders:delete", "orders:export",
    "invoices:create", "invoices:read", "invoices:update", "invoices:delete", "invoices:print", "invoices:export",
    "products:create", "products:read", "products:update", "products:delete",
    "stickers:generate", "stickers:print",
    "customers:create", "customers:read", "customers:update", "customers:delete",
    "inventory:read", "inventory:update",
    "users:read", "users:invite", "users:manage",
    "roles:read",
    "settings:read", "settings:update",
    "audit:read", "audit:export",
    "reports:view", "reports:export",
  ],
  manager: [
    "orders:create", "orders:read", "orders:update", "orders:delete",
    "invoices:create", "invoices:read", "invoices:update", "invoices:print",
    "products:create", "products:read", "products:update",
    "stickers:generate", "stickers:print",
    "customers:create", "customers:read", "customers:update",
    "inventory:read", "inventory:update",
    "users:read",
    "reports:view",
  ],
  operator: [
    "orders:create", "orders:read",
    "invoices:read",
    "products:create", "products:read",
    "stickers:generate", "stickers:print",
    "customers:read",
    "inventory:read",
  ],
  viewer: [
    "orders:read",
    "invoices:read",
    "products:read",
    "customers:read",
    "inventory:read",
    "reports:view",
  ],
};

// ---------- Permission Presets ----------

/** Named presets for quick permission assignment (replaces role-based assignment) */
export const PERMISSION_PRESETS: Record<string, Permission[]> = {
  fullAccess: TENANT_ROLE_PERMISSIONS.owner,
  management: TENANT_ROLE_PERMISSIONS.admin,
  basic: TENANT_ROLE_PERMISSIONS.manager,
  readOnly: TENANT_ROLE_PERMISSIONS.viewer,
};

/** All available permission preset keys */
export type PermissionPresetKey = keyof typeof PERMISSION_PRESETS;

// ---------- Permission Categories (for UI grouping) ----------

export interface PermissionCategoryDef {
  resource: ResourceType;
  actions: ActionType[];
}

/**
 * Permissions grouped by resource for rendering grouped checkboxes in the UI.
 * Each category lists the actions available for that resource.
 */
export const PERMISSION_CATEGORIES: PermissionCategoryDef[] = [
  { resource: "invoices", actions: ["create", "read", "update", "delete", "print", "export"] },
  { resource: "orders", actions: ["create", "read", "update", "delete", "export"] },
  { resource: "customers", actions: ["create", "read", "update", "delete"] },
  { resource: "products", actions: ["create", "read", "update", "delete"] },
  { resource: "stickers", actions: ["generate", "print"] },
  { resource: "inventory", actions: ["read", "update"] },
  { resource: "reports", actions: ["view", "export"] },
  { resource: "users", actions: ["read", "invite", "manage", "delete"] },
  { resource: "roles", actions: ["read", "manage"] },
  { resource: "settings", actions: ["read", "update"] },
  { resource: "audit", actions: ["read", "export"] },
  { resource: "tenant", actions: ["manage"] },
];

/**
 * Derive a tenant role label from a permissions array.
 * Returns the closest matching preset key or "custom".
 */
export function deriveRoleFromPermissions(permissions: Permission[]): TenantRole {
  const sorted = [...permissions].sort();
  const sortedStr = sorted.join(",");

  // Check exact match against role permissions (in priority order)
  const roleOrder: TenantRole[] = ["owner", "admin", "manager", "operator", "viewer"];
  for (const role of roleOrder) {
    const rolePerms = [...TENANT_ROLE_PERMISSIONS[role]].sort().join(",");
    if (sortedStr === rolePerms) return role;
  }

  // No exact match — find closest by counting permissions
  const count = permissions.length;
  if (count >= TENANT_ROLE_PERMISSIONS.owner.length) return "admin";
  if (count >= TENANT_ROLE_PERMISSIONS.admin.length) return "admin";
  if (count >= TENANT_ROLE_PERMISSIONS.manager.length) return "manager";
  if (count >= TENANT_ROLE_PERMISSIONS.operator.length) return "operator";
  return "viewer";
}
