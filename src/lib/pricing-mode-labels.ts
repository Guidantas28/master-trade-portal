import { serviceCategory, type ServiceCategory } from "@/lib/service-category";

/** UI copy for catalog `pricing_mode` — aligned with master-os terminology. */
export const PRICING_MODE_LABELS = {
  fixed: "Call Out",
  hourly: "Call Out",
} as const;

export function pricingModeLabel(mode: "fixed" | "hourly"): string {
  return PRICING_MODE_LABELS[mode];
}

const LABEL_BY_CATEGORY: Record<ServiceCategory, string> = {
  Trades: "Call Out",
  Certificates: "Standard",
  Cleaning: "Complete visit",
};

/** Partner-facing pricing type label — same for fixed and hourly; only the amount format differs. */
export function servicePricingLabel(_mode: "fixed" | "hourly", serviceName: string): string {
  return LABEL_BY_CATEGORY[serviceCategory(serviceName)];
}
