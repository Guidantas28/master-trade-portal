// POST /api/jobs/start  { jobId }
//
// Partner starts an assigned job from the portal: status → in_progress and the partner work timer
// starts (partner_timer_started_at = now). This reflects straight back in the OS (the OS reads the
// same jobs row + live partner timer). Session-authed; the partner must own the job and it must
// still be scheduled (idempotent-ish: a job already in_progress just returns ok).

import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import { tryCreateServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const misconfig = () =>
  NextResponse.json(
    { error: "Server configuration error", code: "server_misconfigured", message: "SERVICE_ROLE_KEY is not set on the trade portal." },
    { status: 503 },
  );

export async function POST(req: Request) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let jobId: string | undefined;
  try {
    ({ jobId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!jobId || typeof jobId !== "string") return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const svc = tryCreateServiceClient();
  if (!svc) return misconfig();
  const { data: job } = await svc
    .from("jobs")
    .select("id, partner_id, status")
    .eq("id", jobId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  if (job.partner_id !== session.partnerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (job.status === "in_progress") return NextResponse.json({ ok: true, status: "in_progress" });
  if (job.status === "completed" || job.status === "cancelled" || job.status === "final_check") {
    return NextResponse.json({ error: `This job is ${job.status} — it can't be started.` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { error } = await svc
    .from("jobs")
    .update({
      status: "in_progress",
      partner_timer_started_at: now,
      partner_timer_is_paused: false,
      partner_timer_pause_began_at: null,
      partner_timer_accum_paused_ms: 0,
      updated_at: now,
    })
    .eq("id", job.id);
  if (error) {
    console.error("[jobs/start] update failed:", error);
    return NextResponse.json({ error: "Couldn't start the job. Try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, status: "in_progress" });
}
