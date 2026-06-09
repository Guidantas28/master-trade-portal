// Pricing presets ("bands") + add-ons ("additionals") for a catalog service.
// Ported from master-os/src/lib/catalog-pricing-presets.ts — pure parsers over the
// service_catalog.pricing_presets / pricing_addons jsonb columns. Read-only here:
// the portal shows them so the partner knows a job may carry a band or add-on.

export interface ServicePricingPreset {
  id: string;
  label: string;
  sort_order: number;
  pricing_mode?: "fixed" | "hourly";
  fixed_price?: number;
  hourly_rate?: number;
  default_hours?: number;
  partner_cost?: number;
}

export interface ServicePricingAddon {
  id: string;
  label: string;
  sort_order: number;
  fixed_price: number;
  partner_cost?: number;
}

/** Parse DB jsonb into add-on list; invalid entries dropped. */
export function parsePricingAddons(raw: unknown): ServicePricingAddon[] {
  if (!Array.isArray(raw)) return [];
  const out: ServicePricingAddon[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : "";
    const label = typeof o.label === "string" ? o.label.trim() : "";
    if (!id || !label) continue;
    const sort_order = typeof o.sort_order === "number" && Number.isFinite(o.sort_order) ? o.sort_order : 0;
    const fixed_price = typeof o.fixed_price === "number" && Number.isFinite(o.fixed_price) ? o.fixed_price : null;
    if (fixed_price == null) continue;
    const addon: ServicePricingAddon = { id, label, sort_order, fixed_price };
    if (typeof o.partner_cost === "number" && Number.isFinite(o.partner_cost)) addon.partner_cost = o.partner_cost;
    out.push(addon);
  }
  return out.sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

/** Parse DB jsonb into preset ("band") list; invalid entries dropped. */
export function parsePricingPresets(raw: unknown): ServicePricingPreset[] {
  if (!Array.isArray(raw)) return [];
  const out: ServicePricingPreset[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : "";
    const label = typeof o.label === "string" ? o.label.trim() : "";
    if (!id || !label) continue;
    const sort_order = typeof o.sort_order === "number" && Number.isFinite(o.sort_order) ? o.sort_order : 0;
    const preset: ServicePricingPreset = { id, label, sort_order };
    if (o.pricing_mode === "fixed" || o.pricing_mode === "hourly") preset.pricing_mode = o.pricing_mode;
    if (typeof o.fixed_price === "number" && Number.isFinite(o.fixed_price)) preset.fixed_price = o.fixed_price;
    if (typeof o.hourly_rate === "number" && Number.isFinite(o.hourly_rate)) preset.hourly_rate = o.hourly_rate;
    if (typeof o.default_hours === "number" && Number.isFinite(o.default_hours)) preset.default_hours = o.default_hours;
    if (typeof o.partner_cost === "number" && Number.isFinite(o.partner_cost)) preset.partner_cost = o.partner_cost;
    out.push(preset);
  }
  return out.sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}
