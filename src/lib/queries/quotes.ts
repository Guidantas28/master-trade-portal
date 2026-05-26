// Maps real Fixfy OS `quotes` (the partner is invited to bid on) → the portal's
// QuoteRequest UI type, and submits partner bids into `quote_bids`.
//
// Invitations live in `quote_partner_invitations` (one row per invited partner). The
// `quotes` table is thin (title/total_value/status); description + postcode are joined
// from the originating `service_requests` row. There is no per-quote "trade" or distance
// in the schema, so those stay empty/0.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuoteRequest, QuoteRequestStatus } from "@/types";

interface InvitationRow {
  quote_id: string;
}
interface QuoteRow {
  id: string;
  reference: string | null;
  title: string | null;
  status: string | null;
  total_value: number | null;
  expires_at: string | null;
  request_id: string | null;
}
interface BidRow {
  quote_id: string;
  partner_id: string;
  bid_amount: number | null;
  status: string | null;
}

const LONDON = "Europe/London";
function fmtDeadline(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: LONDON });
}

// to-quote: invited, no bid yet, quote still open
// submitted: my bid pending
// won: my bid approved
// lost: my bid rejected, or quote closed to someone else
function deriveStatus(quoteStatus: string, myBidStatus: string | null): QuoteRequestStatus {
  if (myBidStatus === "approved") return "won";
  if (myBidStatus === "rejected") return "lost";
  if (myBidStatus === "submitted") return "submitted";
  // no bid from me
  if (["approved", "sent", "expired"].includes(quoteStatus)) return "lost";
  return "to-quote";
}

export async function fetchAvailableQuotes(supabase: SupabaseClient, partnerId: string): Promise<QuoteRequest[]> {
  const { data: invites, error: invErr } = await supabase
    .from("quote_partner_invitations")
    .select("quote_id")
    .eq("partner_id", partnerId);
  if (invErr) throw invErr;
  const quoteIds = (invites as InvitationRow[]).map((r) => r.quote_id);
  if (quoteIds.length === 0) return [];

  // No service_requests embed: RLS scopes service_requests to staff/portal-clients only
  // (a back-reference would create recursive RLS — see migration 198), so a partner can't
  // read the originating request. Postcode/description are therefore omitted from the card.
  const { data: quotes, error: qErr } = await supabase
    .from("quotes")
    .select("id,reference,title,status,total_value,expires_at,request_id")
    .in("id", quoteIds)
    .is("deleted_at", null);
  if (qErr) throw qErr;

  const { data: bids, error: bErr } = await supabase
    .from("quote_bids")
    .select("quote_id,partner_id,bid_amount,status")
    .in("quote_id", quoteIds);
  if (bErr) throw bErr;
  const bidRows = bids as BidRow[];

  return (quotes as unknown as QuoteRow[]).map((q) => {
    const quoteBids = bidRows.filter((b) => b.quote_id === q.id);
    const myBid = quoteBids.find((b) => b.partner_id === partnerId);
    const competing = quoteBids.filter((b) => b.partner_id !== partnerId && b.bid_amount != null).map((b) => b.bid_amount as number);
    const leadingBid = competing.length ? Math.min(...competing) : undefined;
    const status = deriveStatus(q.status ?? "", myBid?.status ?? null);

    return {
      id: q.id,
      reference: q.reference ?? undefined,
      title: q.title || "Quote request",
      desc: "", // originating service_request isn't partner-readable (RLS)
      trades: [], // no per-quote trade in the schema
      postcode: "", // see above
      distance: 0, // no geo distance available
      deadline: fmtDeadline(q.expires_at),
      status,
      yourBid: myBid?.bid_amount ?? undefined,
      leadingBid,
      awardedAmount: status === "won" ? myBid?.bid_amount ?? q.total_value ?? undefined : undefined,
    } satisfies QuoteRequest;
  });
}

export async function submitBid(
  supabase: SupabaseClient,
  args: { quoteId: string; partnerId: string; partnerName: string; amount: number; notes?: string },
): Promise<void> {
  const { error } = await supabase.from("quote_bids").insert({
    quote_id: args.quoteId,
    partner_id: args.partnerId,
    partner_name: args.partnerName,
    bid_amount: args.amount,
    notes: args.notes || null,
    status: "submitted",
  });
  if (error) throw error;
}
