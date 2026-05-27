// POST /api/leads/respond  { leadId, status: "contacted" }
//
// Records that the signed-in partner contacted a published lead by inserting a lead_partner_offers
// row (lead_id, partner_id, offered_by). The table has no status column — the row's PRESENCE means
// "this partner reached out", which feeds the MAX_CONTACTS first-come cap. "declined" isn't stored
// (no column for it); the portal just hides a declined lead client-side. Service role after
// resolving the partner from the session.

import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { leadId?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { leadId, status } = body;
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  // Decline isn't persisted (no column on lead_partner_offers) — the portal hides it locally.
  if (status === "declined") return NextResponse.json({ ok: true });

  const svc = createServiceClient();

  // Idempotent: only insert if this partner hasn't already contacted this lead. Avoids relying on
  // a (lead_id, partner_id) unique constraint we don't control.
  const { data: existing } = await svc
    .from("lead_partner_offers")
    .select("id")
    .eq("lead_id", leadId)
    .eq("partner_id", session.partnerId)
    .maybeSingle();

  if (!existing) {
    const { error } = await svc.from("lead_partner_offers").insert({
      lead_id: leadId,
      partner_id: session.partnerId,
      offered_by: session.userId, // the partner's own app user id (external_partner)
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Reveal the customer's contact details now that this partner has reached out.
  const { data: lead } = await svc
    .from("leads")
    .select("email,phone,address,city")
    .eq("id", leadId)
    .maybeSingle();
  const contact = lead
    ? { email: lead.email ?? null, phone: lead.phone ?? null, address: [lead.address, lead.city].filter(Boolean).join(", ") || null }
    : { email: null, phone: null, address: null };

  return NextResponse.json({ ok: true, contact });
}
