// Server-side partner identity. Resolves the signed-in Supabase user to a Fixfy OS
// `partners` row via `auth_user_id` (the same linkage the partner mobile app uses).

import { createClient } from "@/lib/supabase/server";
import { mapPartner, type PartnerRow } from "@/lib/map-partner";
import type { Partner } from "@/types";

export interface PartnerSession {
  userId: string;
  email: string | null;
  partnerId: string;
  partner: Partner;
}

export async function getPartnerSession(): Promise<PartnerSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("partners")
    .select("id, company_name, contact_name, email, phone, trade, trades, rating, jobs_completed, location, partner_address")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  // Best-effort: pull the columns added by later migrations (196/204). If those migrations
  // haven't been applied yet the select errors on the missing columns — we ignore it and fall
  // back to the base row, so sign-in never breaks.
  let extra: Partial<PartnerRow> = {};
  const { data: ext } = await supabase
    .from("partners")
    .select("trial_ends_at, subscription_status, bio, years_experience, service_radius_miles, excluded_postcodes")
    .eq("id", data.id)
    .maybeSingle();
  if (ext) extra = ext as Partial<PartnerRow>;

  return {
    userId: user.id,
    email: user.email ?? null,
    partnerId: data.id,
    partner: mapPartner({ ...(data as PartnerRow), ...extra }),
  };
}
