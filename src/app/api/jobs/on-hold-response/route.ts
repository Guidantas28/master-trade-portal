import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import { partnerOnHoldLabel } from "@/lib/queries/map-job";
import { tryCreateServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "job-photos";
const MAX_PHOTOS = 12;

type JobOnHoldRow = {
  id: string;
  reference: string;
  title: string | null;
  status: string;
  partner_id: string | null;
  on_hold_reason: string | null;
  on_hold_reason_preset_id: string | null;
  on_hold_complaint_description: string | null;
  on_hold_submission_at: string | null;
  on_hold_submission: { notes?: string | null; photos?: string[] } | null;
};

function complaintReasonText(job: JobOnHoldRow): string | null {
  const desc = job.on_hold_complaint_description?.trim();
  if (desc) return desc;
  const reason = job.on_hold_reason?.trim();
  if (reason) return reason;
  return null;
}

/** GET /api/jobs/on-hold-response?jobId= — on-hold context for portal card/drawer. */
export async function GET(req: Request) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const jobId = new URL(req.url).searchParams.get("jobId")?.trim();
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const svc = tryCreateServiceClient();
  if (!svc) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }

  const { data, error } = await svc
    .from("jobs")
    .select(
      "id, reference, title, status, partner_id, on_hold_reason, on_hold_reason_preset_id, on_hold_complaint_description, on_hold_submission_at",
    )
    .eq("id", jobId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const job = data as JobOnHoldRow;
  if (job.partner_id !== session.partnerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    jobReference: job.reference,
    jobTitle: job.title,
    onHoldLabel: partnerOnHoldLabel(job),
    onHoldReason: complaintReasonText(job),
    isOnHold: job.status === "on_hold",
    alreadySubmitted: Boolean(job.on_hold_submission_at),
    submittedAt: job.on_hold_submission_at,
  });
}

/** POST /api/jobs/on-hold-response — partner reply (session auth, multipart). */
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
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const notes = String(form.get("notes") ?? "").trim();
  if (!notes) {
    return NextResponse.json({ error: "Please add a short summary of how you can resolve this." }, { status: 400 });
  }

  const photoFiles: File[] = [];
  for (const [key, value] of form.entries()) {
    if ((key === "photos[]" || key === "photos") && value instanceof File && value.size > 0) {
      photoFiles.push(value);
    }
  }
  if (photoFiles.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `Please send at most ${MAX_PHOTOS} photos.` }, { status: 400 });
  }

  const svc = tryCreateServiceClient();
  if (!svc) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }

  const { data: jobRow, error: jobErr } = await svc
    .from("jobs")
    .select("id, reference, status, partner_id, on_hold_submission")
    .eq("id", jobId)
    .is("deleted_at", null)
    .maybeSingle();

  if (jobErr || !jobRow) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const job = jobRow as {
    id: string;
    reference: string;
    status: string;
    partner_id: string | null;
    on_hold_submission: { notes?: string | null; photos?: string[] } | null;
  };

  if (job.partner_id !== session.partnerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (job.status !== "on_hold") {
    return NextResponse.json({ error: "This job is no longer on hold." }, { status: 409 });
  }

  const newPaths: string[] = [];
  for (let i = 0; i < photoFiles.length; i++) {
    const f = photoFiles[i];
    const bytes = new Uint8Array(await f.arrayBuffer());
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `${job.id}/on-hold/${ts}-${i}.jpg`;
    const { error: upErr } = await svc.storage.from(BUCKET).upload(path, bytes, {
      contentType: f.type || "image/jpeg",
      upsert: false,
    });
    if (upErr) {
      console.error("[on-hold-response] photo upload failed:", upErr);
      continue;
    }
    newPaths.push(path);
  }

  const now = new Date().toISOString();
  const priorPhotos = Array.isArray(job.on_hold_submission?.photos) ? job.on_hold_submission!.photos! : [];
  const submission = {
    notes,
    photos: [...priorPhotos, ...newPaths],
    partner_id: session.partnerId,
    submitted_at: now,
  };

  const { error: updErr } = await svc
    .from("jobs")
    .update({ on_hold_submission: submission, on_hold_submission_at: now, updated_at: now })
    .eq("id", job.id);

  if (updErr) {
    console.error("[on-hold-response] job update failed:", updErr);
    return NextResponse.json({ error: "Could not save your update. Please try again." }, { status: 500 });
  }

  void svc
    .from("audit_logs")
    .insert({
      entity_type: "job",
      entity_id: job.id,
      entity_ref: job.reference,
      action: "updated",
      field_name: "on_hold_submission",
      new_value: `${newPaths.length} photo(s) + notes`,
      metadata: { source: "partner_portal_on_hold", photos_added: newPaths.length },
    })
    .then(({ error }) => {
      if (error) console.error("[on-hold-response] audit insert failed:", error);
    });

  return NextResponse.json({ ok: true, jobReference: job.reference, photosUploaded: newPaths.length });
}
