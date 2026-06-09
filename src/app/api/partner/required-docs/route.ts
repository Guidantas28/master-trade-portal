// GET /api/partner/required-docs
// Dynamic mandatory-document checklist for the signed-in partner, driven by their
// legal type + trades, honouring the OS doc rules in
// company_settings.frontend_setup.partner_document_rules. Ported (minimally) from
// master-os/src/lib/partner-required-docs.ts. Service-role read of company_settings
// (office-only RLS); the partner is resolved from the session.

import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import { tryCreateServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface RequiredDocDef {
  docType: string;
  name: string;
  description: string;
  group: "core" | "legal" | "trade_cert";
}

const CORE: RequiredDocDef[] = [
  { docType: "id_proof", name: "Photo ID", description: "Passport or driving licence", group: "core" },
  { docType: "proof_of_address", name: "Proof of Address", description: "Utility bill or bank statement (last 3 months)", group: "core" },
  { docType: "right_to_work", name: "Right to Work", description: "Share code, birth certificate, or passport", group: "core" },
  { docType: "insurance", name: "Public Liability Insurance", description: "Active public liability policy", group: "core" },
];

// Trade keyword → certificate names. Ported/adapted from master-os
// CERT_REQUIREMENTS_BY_TRADE; matched against the partner's trades/service names.
const CERTS_BY_KEYWORD: { keywords: string[]; certs: string[] }[] = [
  { keywords: ["electr", "eicr", "niceic", "rewire", "consumer unit", "fuse board"], certs: ["NICEIC / NAPIT registration", "18th Edition Wiring Regulations"] },
  { keywords: ["gas", "boiler", "central heating"], certs: ["Gas Safe registration"] },
  { keywords: ["plumb"], certs: ["Water Regulations (WRAS)"] },
  { keywords: ["pat", "appliance test"], certs: ["PAT Testing Certificate"] },
  { keywords: ["fire alarm"], certs: ["Fire Alarm Certification"] },
  { keywords: ["emergency lighting"], certs: ["Emergency Lighting Certification"] },
  { keywords: ["extinguisher"], certs: ["BAFE / extinguisher servicing certificate"] },
];

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export async function GET() {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const svc = tryCreateServiceClient();
  if (!svc) {
    // Fall back to core docs so the page still works if the service env is missing.
    return NextResponse.json({ required: CORE });
  }

  const { data: prow } = await svc
    .from("partners")
    .select("trades, trade, partner_legal_type")
    .eq("id", session.partnerId)
    .maybeSingle();
  const p = prow as { trades?: string[] | null; trade?: string | null; partner_legal_type?: string | null } | null;
  const trades = [...(p?.trades ?? []), p?.trade ?? ""].filter(Boolean).map((t) => t.toLowerCase());

  // Honour OS-disabled core docs (rules default to enabled when absent).
  let rules: Record<string, { enabled?: boolean }> = {};
  try {
    const { data: cs } = await svc.from("company_settings").select("frontend_setup").limit(1).maybeSingle();
    const fs = (cs as { frontend_setup?: { partner_document_rules?: Record<string, { enabled?: boolean }> } } | null)?.frontend_setup;
    if (fs?.partner_document_rules) rules = fs.partner_document_rules;
  } catch {
    /* settings not readable — use defaults */
  }
  const enabled = (id: string) => rules[id]?.enabled !== false;

  const out: RequiredDocDef[] = CORE.filter((d) => enabled(d.docType));

  // Legal docs — company proof for limited companies, UTR for sole traders.
  if (p?.partner_legal_type === "limited_company") {
    out.push({ docType: "company_registration", name: "Proof of company", description: "Certificate of Incorporation or Companies House record", group: "legal" });
  } else {
    out.push({ docType: "utr", name: "UTR (HMRC)", description: "Proof of your Unique Taxpayer Reference (HMRC letter or screenshot)", group: "legal" });
  }

  // Per-trade certificates (keyword-matched against the partner's services).
  const seen = new Set<string>();
  for (const { keywords, certs } of CERTS_BY_KEYWORD) {
    if (!trades.some((t) => keywords.some((k) => t.includes(k)))) continue;
    for (const cert of certs) {
      const dt = `cert_${slug(cert)}`;
      if (seen.has(dt)) continue;
      seen.add(dt);
      out.push({ docType: dt, name: cert, description: "Trade certificate required for your services", group: "trade_cert" });
    }
  }

  return NextResponse.json({ required: out });
}
