// GET /api/leads — open OS leads (service_requests) that match the signed-in partner's trades.
//
// Model: every open lead reflects to all matching partners (no manual distribution needed). A
// lead stays visible until MAX_CONTACTS partners have pressed "Contact" — then it closes for
// everyone except those who already contacted. Runs with the service role (RLS can't trade-match)
// after resolving the partner from the session; matching/exclusions happen here in JS.

import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { serviceMatchesAnyTrade } from "@/lib/trade-match";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const MAX_CONTACTS = 5;

function outward(pc?: string | null): string {
  if (!pc) return "";
  const s = pc.toUpperCase().replace(/\s+/g, "");
  return s.length > 3 ? s.slice(0, s.length - 3) : s;
}

interface SRRow {
  id: string;
  service_type: string | null;
  description: string | null;
  postcode: string | null;
  estimated_value: number | null;
  priority: string | null;
  request_kind: string | null;
  created_at: string | null;
}

export async function GET() {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const partner = session.partner;
  const svc = createServiceClient();

  const { data: srs, error } = await svc
    .from("service_requests")
    .select("id,service_type,description,postcode,estimated_value,priority,request_kind,created_at")
    .is("deleted_at", null)
    .not("status", "in", "(converted,declined)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const excluded = (partner.excludedPostcodes ?? []).map((e) => String(e).toUpperCase().replace(/\s+/g, "")).filter(Boolean);
  const matched = (srs as SRRow[]).filter((sr) => {
    if (!serviceMatchesAnyTrade(sr.service_type ?? "", partner.trades)) return false;
    const ow = outward(sr.postcode);
    if (ow && excluded.some((e) => ow.startsWith(e))) return false;
    return true;
  });
  if (matched.length === 0) return NextResponse.json({ leads: [] });

  const ids = matched.map((s) => s.id);
  const { data: offers } = await svc
    .from("service_request_partner_offers")
    .select("service_request_id,partner_id,status")
    .in("service_request_id", ids);

  const contacted = new Map<string, number>();
  const mine = new Map<string, string>();
  for (const o of offers ?? []) {
    if (o.status === "contacted") contacted.set(o.service_request_id as string, (contacted.get(o.service_request_id as string) ?? 0) + 1);
    if (o.partner_id === partner.id) mine.set(o.service_request_id as string, o.status as string);
  }

  const leads = matched
    .filter((sr) => {
      const myStatus = mine.get(sr.id);
      if (myStatus === "declined") return false;
      const cc = contacted.get(sr.id) ?? 0;
      return cc < MAX_CONTACTS || myStatus === "contacted"; // closed once MAX reached (unless I'm in)
    })
    .map((sr) => ({
      offerId: sr.id, // the service_request id — used by the respond endpoint
      status: (mine.get(sr.id) ?? "offered") as string,
      title: sr.service_type || "Customer enquiry",
      desc: sr.description || "",
      postcode: sr.postcode || "",
      budget: sr.estimated_value,
      priority: sr.priority,
      requestKind: sr.request_kind,
      posted: sr.created_at,
      contactedCount: contacted.get(sr.id) ?? 0,
      maxContacts: MAX_CONTACTS,
    }));

  return NextResponse.json({ leads });
}
