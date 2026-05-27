// POST /api/leads/respond  { serviceRequestId, status: "contacted" | "declined" }
//
// Records the partner's response to an OS lead by upserting a service_request_partner_offers row
// (so the OS sees who contacted, and the MAX_CONTACTS cap can close the lead). Service role after
// resolving the partner from the session.

import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { serviceRequestId?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { serviceRequestId, status } = body;
  if (!serviceRequestId || (status !== "contacted" && status !== "declined")) {
    return NextResponse.json({ error: "serviceRequestId and status (contacted|declined) required" }, { status: 400 });
  }

  const svc = createServiceClient();
  const patch: Record<string, unknown> = {
    service_request_id: serviceRequestId,
    partner_id: session.partnerId,
    status,
    last_channel: "portal",
    updated_at: new Date().toISOString(),
  };
  if (status === "contacted") patch.contacted_at = new Date().toISOString();

  // onConflict (service_request_id, partner_id) — offered_at keeps its default on first insert.
  const { error } = await svc.from("service_request_partner_offers").upsert(patch, { onConflict: "service_request_id,partner_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
