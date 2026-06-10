// Partner score — same rules as Fixfy OS (master-os/src/lib/partner-rating.ts).
// Starts at 5.0; each partner-fault complaint deducts 0.5 pts (half if job completed).

export const PARTNER_RATING_MAX = 5;
export const PARTNER_COMPLAINT_PENALTY_POINTS = 0.5;

export type PartnerComplaintJobStatus = "scheduled" | "in_progress" | "final_check" | "completed" | "cancelled";

export type PartnerComplaintJob = {
  status: PartnerComplaintJobStatus;
};

export type PartnerComplaintDetail = {
  id: string;
  reference?: string;
  title?: string;
  status: PartnerComplaintJobStatus;
  reason: string;
  penalty: number;
  onHoldAt?: string | null;
};

export function complaintPenaltyMultiplier(status: PartnerComplaintJobStatus): number {
  if (status === "cancelled") return 1;
  if (status === "completed") return 0.5;
  return 1;
}

export function complaintPenaltyPoints(status: PartnerComplaintJobStatus): number {
  return Math.round(PARTNER_COMPLAINT_PENALTY_POINTS * complaintPenaltyMultiplier(status) * 10) / 10;
}

export function normalizeComplaintReason(
  complaintDescription?: string | null,
  holdReason?: string | null,
): string {
  const desc = complaintDescription?.trim();
  if (desc) return desc;
  const reason = holdReason?.trim();
  if (reason && !/^complaint$/i.test(reason)) return reason;
  return "Customer complaint";
}

export function truncateComplaintReason(text: string, max = 120): string {
  const line = text.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? text.trim();
  if (line.length <= max) return line;
  return `${line.slice(0, max - 1).trim()}…`;
}

/** Biggest impact first (penalty pts), then most recent. */
export function rankPartnerComplaints(complaints: readonly PartnerComplaintDetail[]): PartnerComplaintDetail[] {
  return [...complaints].sort((a, b) => {
    if (b.penalty !== a.penalty) return b.penalty - a.penalty;
    const at = a.onHoldAt ? new Date(a.onHoldAt).getTime() : 0;
    const bt = b.onHoldAt ? new Date(b.onHoldAt).getTime() : 0;
    return bt - at;
  });
}

export function computePartnerRatingFromComplaints(complaints: readonly PartnerComplaintJob[]): number {
  let deduction = 0;
  for (const row of complaints) {
    deduction += PARTNER_COMPLAINT_PENALTY_POINTS * complaintPenaltyMultiplier(row.status);
  }
  const raw = PARTNER_RATING_MAX - deduction;
  return Math.max(0, Math.round(raw * 10) / 10);
}

/** UI display when DB rating is unset or legacy zero. */
export function displayPartnerRating(rating: number | null | undefined): number {
  if (rating == null || Number.isNaN(rating) || rating === 0) return PARTNER_RATING_MAX;
  return rating;
}

export function partnerRatingBreakdown(complaints: readonly PartnerComplaintJob[]): {
  rating: number;
  complaintCount: number;
  pointsLost: number;
} {
  let deduction = 0;
  for (const row of complaints) {
    deduction += PARTNER_COMPLAINT_PENALTY_POINTS * complaintPenaltyMultiplier(row.status);
  }
  const roundedDeduction = Math.round(deduction * 10) / 10;
  return {
    rating: Math.max(0, Math.round((PARTNER_RATING_MAX - deduction) * 10) / 10),
    complaintCount: complaints.length,
    pointsLost: roundedDeduction,
  };
}

export function partnerRatingLabel(rating: number): string {
  if (rating >= 4.8) return "Excellent";
  if (rating >= 4) return "Strong";
  if (rating >= 3) return "Fair";
  return "At risk";
}

export function partnerRatingTone(rating: number): "green" | "amber" | "coral" {
  if (rating >= 4.5) return "green";
  if (rating >= 3) return "amber";
  return "coral";
}
