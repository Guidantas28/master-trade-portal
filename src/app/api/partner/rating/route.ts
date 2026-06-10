import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import {
  complaintPenaltyPoints,
  displayPartnerRating,
  normalizeComplaintReason,
  partnerRatingBreakdown,
  rankPartnerComplaints,
  type PartnerComplaintDetail,
  type PartnerComplaintJob,
  type PartnerComplaintJobStatus,
} from "@/lib/partner-rating";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ComplaintRow = {
  id: string;
  reference: string | null;
  title: string | null;
  status: PartnerComplaintJobStatus;
  on_hold_reason: string | null;
  on_hold_complaint_description: string | null;
  on_hold_at: string | null;
};

/** GET /api/partner/rating — live score from complaint jobs (same source as OS). */
export async function GET() {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("jobs")
    .select(
      "id, reference, title, status, on_hold_reason, on_hold_complaint_description, on_hold_at",
    )
    .eq("partner_id", session.partnerId)
    .eq("on_hold_reason_preset_id", "complaint")
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as ComplaintRow[];
  const complaints: PartnerComplaintJob[] = rows.map((r) => ({ status: r.status }));
  const breakdown = partnerRatingBreakdown(complaints);
  const stored = displayPartnerRating(session.partner.rating);

  const details: PartnerComplaintDetail[] = rows.map((r) => ({
    id: r.id,
    reference: r.reference?.trim() || undefined,
    title: r.title?.trim() || undefined,
    status: r.status,
    reason: normalizeComplaintReason(r.on_hold_complaint_description, r.on_hold_reason),
    penalty: complaintPenaltyPoints(r.status),
    onHoldAt: r.on_hold_at,
  }));
  const topComplaints = rankPartnerComplaints(details).map((c) => ({
    id: c.id,
    reference: c.reference,
    title: c.title,
    status: c.status,
    reason: c.reason,
    penalty: c.penalty,
    onHoldAt: c.onHoldAt,
  }));

  if (Math.abs(stored - breakdown.rating) > 0.009) {
    await svc.from("partners").update({ rating: breakdown.rating }).eq("id", session.partnerId);
  }

  return NextResponse.json({
    rating: breakdown.rating,
    max: 5,
    complaintCount: breakdown.complaintCount,
    pointsLost: breakdown.pointsLost,
    storedRating: stored,
    topComplaints,
  });
}
