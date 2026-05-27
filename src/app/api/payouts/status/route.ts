// GET /api/payouts/status → the partner's Stripe Connect payout status (source of truth = Stripe).
// Refreshes the cached partners.payouts_enabled flag as a side effect.

import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { requireStripe } from "@/lib/stripe";

export async function GET() {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const svc = createServiceClient();
  const { data: row } = await svc
    .from("partners")
    .select("stripe_connect_account_id")
    .eq("id", session.partnerId)
    .maybeSingle();
  const accountId = row?.stripe_connect_account_id as string | undefined;
  if (!accountId) return NextResponse.json({ connected: false, payoutsEnabled: false, detailsSubmitted: false });

  try {
    const account = await requireStripe().accounts.retrieve(accountId);
    const payoutsEnabled = !!account.payouts_enabled;
    await svc.from("partners").update({ payouts_enabled: payoutsEnabled }).eq("id", session.partnerId);
    return NextResponse.json({
      connected: true,
      payoutsEnabled,
      detailsSubmitted: !!account.details_submitted,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Stripe error", connected: true, payoutsEnabled: false }, { status: 200 });
  }
}
