// Partner rate card backed by the real per-service pricing (partner_service_prices joined to
// service_catalog). Each row is one catalog service the partner is set up for: either the catalog
// standard cost (use_standard) or the partner's own override (fixed or hourly, per pricing_mode).

import type { SupabaseClient } from "@supabase/supabase-js";

interface PSPRow {
  id: string;
  use_standard: boolean | null;
  fixed_partner_cost: number | null;
  hourly_partner_rate: number | null;
  default_hours: number | null;
  service_catalog: {
    name: string | null;
    pricing_mode: string | null;
    fixed_price: number | null;
    hourly_rate: number | null;
    default_hours: number | null;
    is_active: boolean | null;
  } | null;
}

export interface ServicePrice {
  id: string;
  name: string;
  mode: "fixed" | "hourly";
  standardFixed: number;
  standardHourly: number;
  standardHours: number;
  useStandard: boolean;
  fixedPartnerCost: number | null;
  hourlyPartnerRate: number | null;
  defaultHours: number | null;
}

export function mapServicePrice(row: PSPRow): ServicePrice {
  const c = row.service_catalog;
  return {
    id: row.id,
    name: c?.name || "Service",
    mode: (c?.pricing_mode === "hourly" ? "hourly" : "fixed") as "fixed" | "hourly",
    standardFixed: c?.fixed_price ?? 0,
    standardHourly: c?.hourly_rate ?? 0,
    standardHours: c?.default_hours ?? 1,
    useStandard: row.use_standard ?? true,
    fixedPartnerCost: row.fixed_partner_cost,
    hourlyPartnerRate: row.hourly_partner_rate,
    defaultHours: row.default_hours,
  };
}

export async function fetchRateCard(supabase: SupabaseClient, partnerId: string): Promise<ServicePrice[]> {
  const { data, error } = await supabase
    .from("partner_service_prices")
    .select(
      "id,use_standard,fixed_partner_cost,hourly_partner_rate,default_hours,service_catalog(name,pricing_mode,fixed_price,hourly_rate,default_hours,is_active)",
    )
    .eq("partner_id", partnerId)
    .is("deleted_at", null);
  if (error) throw error;
  return (data as unknown as PSPRow[])
    .filter((r) => r.service_catalog?.is_active !== false)
    .map(mapServicePrice)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface RateCardPatch {
  id: string;
  use_standard: boolean;
  fixed_partner_cost: number | null;
  hourly_partner_rate: number | null;
  default_hours: number | null;
}

export async function saveRateCard(supabase: SupabaseClient, patches: RateCardPatch[]): Promise<void> {
  for (const p of patches) {
    const { error } = await supabase
      .from("partner_service_prices")
      .update({
        use_standard: p.use_standard,
        fixed_partner_cost: p.fixed_partner_cost,
        hourly_partner_rate: p.hourly_partner_rate,
        default_hours: p.default_hours,
        updated_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    if (error) throw error;
  }
}
