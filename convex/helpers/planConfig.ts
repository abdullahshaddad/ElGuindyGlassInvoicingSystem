import type { TenantPlan, BillingCycle } from "./enums";

export interface PlanConfig {
  nameEn: string;
  nameAr: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxUsers: number;
  maxInvoicesPerMonth: number;
  features: string[];
  color: string;
}

export const PLAN_CONFIGS: Record<TenantPlan, PlanConfig> = {
  free: {
    nameEn: "Free",
    nameAr: "مجاني",
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 3,
    maxInvoicesPerMonth: 50,
    features: ["basic_invoicing", "single_location"],
    color: "gray",
  },
  starter: {
    nameEn: "Starter",
    nameAr: "بداية",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    maxUsers: 10,
    maxInvoicesPerMonth: 500,
    features: ["basic_invoicing", "single_location", "reports", "email_support"],
    color: "blue",
  },
  professional: {
    nameEn: "Professional",
    nameAr: "احترافي",
    monthlyPrice: 599,
    yearlyPrice: 5990,
    maxUsers: 25,
    maxInvoicesPerMonth: 2000,
    features: [
      "basic_invoicing",
      "multi_location",
      "reports",
      "advanced_analytics",
      "priority_support",
      "custom_branding",
    ],
    color: "purple",
  },
  enterprise: {
    nameEn: "Enterprise",
    nameAr: "مؤسسي",
    monthlyPrice: 999,
    yearlyPrice: 9990,
    maxUsers: 100,
    maxInvoicesPerMonth: -1, // unlimited
    features: [
      "basic_invoicing",
      "multi_location",
      "reports",
      "advanced_analytics",
      "priority_support",
      "custom_branding",
      "api_access",
      "dedicated_support",
      "sla",
    ],
    color: "amber",
  },
};

export function getPlanConfig(plan: TenantPlan): PlanConfig {
  return PLAN_CONFIGS[plan];
}

export function getPlanPrice(
  plan: TenantPlan,
  cycle: BillingCycle
): number {
  const config = PLAN_CONFIGS[plan];
  return cycle === "monthly" ? config.monthlyPrice : config.yearlyPrice;
}

/** Returns default plan configs as an array suitable for seeding the planConfigs table. */
export function getDefaultPlanSeeds() {
  const order: TenantPlan[] = ["free", "starter", "professional", "enterprise"];
  return order.map((key, idx) => ({
    planKey: key,
    ...PLAN_CONFIGS[key],
    isActive: true,
    displayOrder: idx,
  }));
}
