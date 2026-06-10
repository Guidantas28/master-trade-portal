// PATCH /api/leads/pipeline  { leadId, pipelineStatus }

import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { isLeadPipelineStatus } from "@/lib/lead-pipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { leadId?: string; pipelineStatus?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const leadId = body.leadId?.trim();
  const pipelineStatus = body.pipelineStatus?.trim();
  if (!leadId || !pipelineStatus || !isLeadPipelineStatus(pipelineStatus)) {
    return NextResponse.json({ error: "leadId and valid pipelineStatus required" }, { status: 400 });
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
    return NextResponse.json({ error: "Contact this lead first to update its status" }, { status: 404 });
  }

  const { error } = await svc
    .from("lead_partner_offers")
    .update({ pipeline_status: pipelineStatus })
    .eq("lead_id", leadId)
    .eq("partner_id", session.partnerId);

  if (error) {
    if (/pipeline_status/.test(error.message)) {
      return NextResponse.json(
        { error: "Pipeline status not available yet — apply migration 231 on the database." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pipelineStatus });
}
