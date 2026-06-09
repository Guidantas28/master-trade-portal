import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import { partnerCanAccessQuote } from "@/lib/partner-quote-access";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/quotes/decline  { quoteId } — partner passes on a quote (shows as Lost in portal). */
export async function POST(req: Request) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let quoteId: string | undefined;
  try {
    ({ quoteId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!quoteId || typeof quoteId !== "string") {
    return NextResponse.json({ error: "quoteId required" }, { status: 400 });
  }

  const svc = createServiceClient();
  const allowed = await partnerCanAccessQuote(svc, session.partnerId, quoteId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: quote } = await svc
    .from("quotes")
    .select("id, status")
    .eq("id", quoteId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  if (!["bidding", "in_survey"].includes(quote.status ?? "")) {
    return NextResponse.json({ error: "This quote is no longer open for bids." }, { status: 409 });
  }

  const partnerName =
    session.partner.tradingName?.trim() ||
    `${session.partner.firstName} ${session.partner.lastName}`.trim() ||
    "Partner";
  const now = new Date().toISOString();

  const { data: existing } = await svc
    .from("quote_bids")
    .select("id")
    .eq("quote_id", quoteId)
    .eq("partner_id", session.partnerId)
    .maybeSingle();

  if (existing?.id) {
    // Withdraw an existing submitted bid → mark it rejected.
    const { error } = await svc
      .from("quote_bids")
      .update({ status: "rejected", updated_at: now })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, withdrawn: true });
  }

  // Passing on a BROADCAST quote the partner never bid on: do NOT write a
  // `rejected` quote_bids row. That row was irreversible (no un-decline path in
  // the UI → quote stuck as "Lost") and polluted the OS approve pool with
  // null-amount rejections. Treat it as a client-side hide instead.
  return NextResponse.json({ ok: true, hidden: true });
}
