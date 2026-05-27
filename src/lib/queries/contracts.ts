// Reads the partner's real contracts: the active contract_versions (Terms of Use + Self-bill
// Agreement) and whether this partner has signed each (partner_contract_signatures).
// In-portal e-signing isn't wired yet (signature capture), so this surfaces read + status.

import type { SupabaseClient } from "@supabase/supabase-js";

interface VersionRow {
  id: string;
  contract_type: string;
  version: string | null;
  title: string | null;
  body_html: string | null;
}
interface SignatureRow {
  contract_type: string;
  contract_version_id: string;
  signed_at: string | null;
}

export interface PartnerContract {
  versionId: string;
  type: string;
  title: string;
  version: string;
  bodyHtml: string;
  signed: boolean;
  signedAt: string | null;
}

const LONDON = "Europe/London";
function fmt(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: LONDON });
}

export async function fetchContracts(supabase: SupabaseClient, partnerId: string): Promise<PartnerContract[]> {
  const [{ data: versions, error: vErr }, { data: sigs, error: sErr }] = await Promise.all([
    supabase.from("contract_versions").select("id,contract_type,version,title,body_html").eq("is_active", true),
    supabase.from("partner_contract_signatures").select("contract_type,contract_version_id,signed_at").eq("partner_id", partnerId),
  ]);
  if (vErr) throw vErr;
  if (sErr) throw sErr;

  const signatures = (sigs as SignatureRow[]) ?? [];
  return ((versions as VersionRow[]) ?? []).map((v) => {
    const sig = signatures.find((s) => s.contract_version_id === v.id) ?? signatures.find((s) => s.contract_type === v.contract_type);
    return {
      versionId: v.id,
      type: v.contract_type,
      title: v.title || (v.contract_type === "self_bill_agreement" ? "Self-bill agreement" : "Terms of use"),
      version: v.version || "",
      bodyHtml: v.body_html || "",
      signed: !!sig,
      signedAt: fmt(sig?.signed_at ?? null),
    };
  });
}
