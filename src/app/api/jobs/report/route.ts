// Partner work-report submission from the trade portal.
//   GET  ?jobId=...   → current start_report / final_report + submitted flags (to prefill/lock)
//   POST (multipart)  → save the START + FINAL report to the DB and upload photos
//
// Mirrors master-os /api/quotes/submit-report exactly (same jobs.* JSONB shape + job-reports
// bucket + status→final_check), but authenticated by the partner SESSION instead of a link token.
// The partner is resolved from the session and must own the job (jobs.partner_id).

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getPartnerSession } from "@/lib/partner-auth";
import { createServiceClient, tryCreateServiceClient } from "@/lib/supabase/service";

/** Fresh 503 response (a NextResponse body can only be consumed once). */
const misconfig = () =>
  NextResponse.json(
    { error: "Server configuration error", code: "server_misconfigured", message: "SERVICE_ROLE_KEY is not set on the trade portal." },
    { status: 503 },
  );

/** Map a File's mime type to a storage extension. Defaults to jpg. */
function extForFile(file: File): string {
  const t = (file.type ?? "").toLowerCase();
  const name = file.name.toLowerCase();
  if (t.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("gif")) return "gif";
  if (t.includes("heic")) return "heic";
  return "jpg";
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "job-reports";
const VALID_TEMPLATES = new Set(["general", "gardener", "cleaner", "certificate"]);

type Svc = ReturnType<typeof createServiceClient>;

async function partnerOwnsJob(svc: Svc, jobId: string, partnerId: string): Promise<boolean> {
  const { data } = await svc.from("jobs").select("id").eq("id", jobId).eq("partner_id", partnerId).maybeSingle();
  return !!data;
}

export async function GET(req: Request) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const jobId = new URL(req.url).searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const svc = tryCreateServiceClient();
  if (!svc) return misconfig();
  const { data: job } = await svc
    .from("jobs")
    .select("id, partner_id, start_report, final_report, start_report_submitted, final_report_submitted")
    .eq("id", jobId)
    .maybeSingle();
  if (!job || job.partner_id !== session.partnerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    startReport: job.start_report ?? null,
    finalReport: job.final_report ?? null,
    submitted: !!(job.start_report_submitted && job.final_report_submitted),
  });
}

export async function POST(req: Request) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body." }, { status: 400 });
  }

  const jobId = String(form.get("jobId") ?? "").trim();
  if (!jobId) return NextResponse.json({ error: "jobId is required." }, { status: 400 });

  const template = String(form.get("template") ?? "").trim();
  if (!VALID_TEMPLATES.has(template)) return NextResponse.json({ error: "Invalid template." }, { status: 400 });

  let startData: Record<string, unknown> = {};
  let finalData: Record<string, unknown> = {};
  try {
    startData = JSON.parse(String(form.get("startData") ?? "{}")) as Record<string, unknown>;
    finalData = JSON.parse(String(form.get("finalData") ?? "{}")) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid startData/finalData JSON." }, { status: 400 });
  }

  // Group photo slots: photos[<slot>][] -> { slotKey: File[] }
  const photoEntries: Record<string, File[]> = {};
  for (const [key, value] of form.entries()) {
    const m = key.match(/^photos\[([^\]]+)\]\[\]$/);
    if (!m || !(value instanceof File)) continue;
    (photoEntries[m[1]] ??= []).push(value);
  }

  const svc = tryCreateServiceClient();
  if (!svc) return misconfig();
  const { data: job } = await svc
    .from("jobs")
    .select("id, reference, status, partner_id, start_report_submitted, final_report_submitted")
    .eq("id", jobId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  if (job.partner_id !== session.partnerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (job.status === "cancelled" || job.status === "completed") {
    return NextResponse.json({ error: `This job is ${job.status} — you can't submit a report for it.` }, { status: 409 });
  }
  if (job.start_report_submitted && job.final_report_submitted) {
    return NextResponse.json({ error: "A report has already been submitted for this job." }, { status: 409 });
  }

  const failures: string[] = [];
  const startPhotos = await uploadSlotPhotos(svc, job.id, "start", photoEntries, template, failures);
  const finalPhotos = await uploadSlotPhotos(svc, job.id, "final", photoEntries, template, failures);

  // Don't silently lose evidence: if any photo failed to upload, abort WITHOUT
  // flipping the job to final_check, so the partner can retry instead of being
  // locked into a "submitted" report missing photos.
  if (failures.length > 0) {
    return NextResponse.json(
      { error: `${failures.length} photo${failures.length === 1 ? "" : "s"} failed to upload — please check your connection and try again.`, code: "photo_upload_failed" },
      { status: 502 },
    );
  }

  const now = new Date().toISOString();
  const startPayload = { template, submitted_at: now, photos: startPhotos, ...startData };
  const finalPayload = { template, submitted_at: now, photos: finalPhotos, ...finalData };

  const { data: updated, error: updErr } = await svc
    .from("jobs")
    .update({
      // Partner submission auto-approves the report (approved_at = now) and moves the job to
      // final_check — that's the stage where the office does its final validation (and can revoke
      // from the dashboard if needed). Columns added by migration 168. approved_by stays null
      // (no staff approver — it's the partner's own submission).
      start_report: startPayload,
      start_report_submitted: true,
      start_report_skipped: false,
      start_report_approved_at: now,
      final_report: finalPayload,
      final_report_submitted: true,
      final_report_skipped: false,
      final_report_approved_at: now,
      status: "final_check",
      // Close the work timer — the job is done. Without this the elapsed clock
      // would run forever and OS payout/duration logic would read an unbounded time.
      partner_timer_ended_at: now,
      partner_timer_is_paused: false,
      updated_at: now,
    })
    // Atomic guard against a double-submit race: only the first submission (where
    // final_report_submitted is still false) wins; a concurrent second one updates
    // 0 rows and is treated as "already submitted".
    .eq("id", job.id)
    .eq("final_report_submitted", false)
    .select("id");
  if (updErr) {
    console.error("[jobs/report] update failed:", updErr);
    return NextResponse.json({ error: "Could not save the report." }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "A report has already been submitted for this job." }, { status: 409 });
  }

  void svc
    .from("audit_logs")
    .insert({
      entity_type: "job",
      entity_id: job.id,
      entity_ref: job.reference,
      action: "report_submitted",
      field_name: "start_report+final_report",
      old_value: job.status,
      new_value: "final_check",
      metadata: { source: "trade_portal", template, partner_id: session.partnerId },
    })
    .then(({ error }) => {
      if (error) console.error("audit_logs (jobs/report)", error);
    });

  return NextResponse.json({ ok: true, jobReference: job.reference });
}

/** Cleaner: returns `{ slot: [urls...] }` map; others return flat array. Matches normalizeReport.
 *  Failed uploads are collected into `failures` so the caller can abort instead of
 *  silently dropping the partner's evidence. */
async function uploadSlotPhotos(
  svc: Svc,
  jobId: string,
  kind: "start" | "final",
  photoEntries: Record<string, File[]>,
  template: string,
  failures: string[],
): Promise<string[] | Record<string, string[]>> {
  const startSlots =
    template === "cleaner"
      ? new Set(["equipment", "living_room", "hallways", "kitchen", "bathrooms", "bedrooms", "steam_cleaning"])
      : new Set(["before"]);
  const finalSlots =
    template === "cleaner"
      ? new Set(["living_room", "hallways", "kitchen", "bathrooms", "bedrooms", "steam_cleaning"])
      : template === "certificate"
        ? new Set(["certificate"])
        : new Set(["after"]);

  const usesSlotMap = template === "cleaner" || template === "certificate";
  const allowed = kind === "start" ? startSlots : finalSlots;

  if (!usesSlotMap) {
    const flatSlot = kind === "start" ? "before" : "after";
    return uploadFlat(svc, jobId, kind, photoEntries[flatSlot] ?? [], failures);
  }

  const result: Record<string, string[]> = {};
  for (const [slot, files] of Object.entries(photoEntries)) {
    if (!allowed.has(slot)) continue;
    result[slot] = await uploadFlat(svc, jobId, `${kind}-${slot}`, files, failures);
  }
  return result;
}

async function uploadFlat(svc: Svc, jobId: string, prefix: string, files: File[], failures: string[]): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const bytes = new Uint8Array(await f.arrayBuffer());
    const ext = extForFile(f);
    const path = `${jobId}/${prefix}-${randomUUID()}.${ext}`;
    const contentType = ext === "pdf" ? "application/pdf" : f.type || "image/jpeg";
    const { error } = await svc.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: false });
    if (error) {
      console.error("[jobs/report] photo upload failed:", error);
      failures.push(`${prefix}-${i}`);
      continue;
    }
    const { data } = svc.storage.from(BUCKET).getPublicUrl(path);
    if (data?.publicUrl) out.push(data.publicUrl);
    else failures.push(`${prefix}-${i}`);
  }
  return out;
}
