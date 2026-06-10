// PATCH /api/leads/notes  { leadId, notes }

import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_NOTES_LENGTH = 4000;

export async function PATCH(req: Request) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { leadId?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const leadId = body.leadId?.trim();
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const notes = body.notes == null ? "" : String(body.notes);
  if (notes.length > MAX_NOTES_LENGTH) {
    return NextResponse.json({ error: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer` }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: existing, error: findErr } = await svc
    .from("lead_partner_offers")
    .select("id")
    .eq("lead_id", leadId)
    .eq("partner_id", session.partnerId)
    .maybeSingle();

  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!existing) {
    return NextResponse.json({ error: "Contact this lead first to add notes" }, { status: 404 });
  }

  const { error } = await svc
    .from("lead_partner_offers")
    .update({ notes: notes.trim() || null })
    .eq("lead_id", leadId)
    .eq("partner_id", session.partnerId);

  if (error) {
    if (/notes/.test(error.message)) {
      return NextResponse.json(
        { error: "Notes not available yet — apply migration 232 on the database." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, notes: notes.trim() || null });
}
