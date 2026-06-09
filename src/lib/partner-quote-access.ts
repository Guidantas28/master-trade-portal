// Server-side: whether a signed-in partner may view or act on a bidding quote.

import type { SupabaseClient } from "@supabase/supabase-js";

const BROADCAST_OPEN_STATUSES = ["bidding", "in_survey"];

function extractPostcode(address: string | null | undefined): string {
  if (!address) return "";
  const m = address.match(/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i);
  return m ? m[1].toUpperCase() : "";
}

export { extractPostcode };

export async function partnerCanAccessQuote(
  supabase: SupabaseClient,
  partnerId: string,
  quoteId: string,
): Promise<boolean> {
  const { data: inv } = await supabase
    .from("quote_partner_invitations")
    .select("quote_id")
    .eq("partner_id", partnerId)
    .eq("quote_id", quoteId)
    .maybeSingle();
  if (inv) return true;

  const { data: prow } = await supabase
    .from("partners")
    .select("catalog_service_ids")
    .eq("id", partnerId)
    .maybeSingle();
  const partnerCatalogIds = new Set(
    ((prow as { catalog_service_ids: string[] | null } | null)?.catalog_service_ids ?? []).filter(Boolean),
  );

  const { data: q } = await supabase
    .from("quotes")
    .select("id, status, catalog_service_id")
    .eq("id", quoteId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!q) return false;
  const status = (q as { status: string | null }).status ?? "";
  if (!BROADCAST_OPEN_STATUSES.includes(status)) {
    const { data: bid } = await supabase
      .from("quote_bids")
      .select("id")
      .eq("quote_id", quoteId)
      .eq("partner_id", partnerId)
      .maybeSingle();
    return !!bid;
  }

  // This route serves the service-role client (RLS bypassed) and returns customer
  // PII (name / address / site photos). Gate broadcast access on EXACT catalog-
  // service membership only — the old loose trade fuzzy-match let any partner
  // with an overlapping trade word pull a stranger's PII. (Invitation already
  // returned true above.) When the quote drawer is wired into the UI, align this
  // with fetchAvailableQuotes so the list and detail agree.
  const catalogId = (q as { catalog_service_id: string | null }).catalog_service_id;
  return !!(catalogId && partnerCatalogIds.has(catalogId));
}

export function normalizeImageUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter((u) => u.startsWith("http://") || u.startsWith("https://"));
}
