import { serviceCategory } from "@/lib/service-category";

/** Hourly partner pay derived from catalog partner_cost ÷ default_hours (master-os). */
export function catalogPartnerHourlyRate(
  partnerCost: number | null | undefined,
  defaultHours: number | null | undefined,
): number {
  const cost = partnerCost != null ? Number(partnerCost) : 0;
  if (!(cost > 0)) return 0;
  const hours = defaultHours && Number(defaultHours) > 0 ? Number(defaultHours) : 1;
  return Math.round((cost / hours) * 100) / 100;
}

/** Partner-facing pay amount from catalog (what Fixfy pays — not customer sell). */
export function formatCatalogPartnerPay(
  mode: "fixed" | "hourly",
  partnerCost: number,
  defaultHours: number,
  serviceName: string,
  format: (n: number) => string,
): string {
  if (mode === "hourly") {
    const hourly = catalogPartnerHourlyRate(partnerCost, defaultHours);
    // Trades call out: same label as fixed — amount shown as £/hr only.
    if (serviceCategory(serviceName) === "Trades") {
      return `${format(hourly)}/hr`;
    }
    return `${format(hourly)}/hr · ${defaultHours}h · ${format(partnerCost)} total`;
  }
  return format(partnerCost);
}
