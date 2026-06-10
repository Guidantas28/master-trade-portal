// GET /api/payouts/status → partner payout setup (manual bank on file, or Stripe Connect).

import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import { getManualPayoutBank } from "@/lib/partner-manual-payout";
import { createServiceClient } from "@/lib/supabase/service";
import { requireStripe } from "@/lib/stripe";

export async function GET() {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const svc = createServiceClient();

  const manual = await getManualPayoutBank(svc, session.partnerId);
  if (manual) {
    return NextResponse.json({
      connected: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      method: "manual",
      accountHolder: manual.accountHolder,
      sortCodeMasked: `${manual.sortCode.slice(0, 2)}-${manual.sortCode.slice(2, 4)}-**`,
      accountLast4: manual.accountNumber.slice(-4),
    });
  }

  const { data: row } = await svc
    .from("partners")
    .select("stripe_connect_account_id, payouts_enabled")
    .eq("id", session.partnerId)
    .maybeSingle();

  const accountId = row?.stripe_connect_account_id as string | undefined;
  if (!accountId) {
    return NextResponse.json({ connected: false, payoutsEnabled: false, detailsSubmitted: false, method: null });
  }

  try {
    const account = await requireStripe().accounts.retrieve(accountId);
    const payoutsEnabled = !!account.payouts_enabled;
    await svc.from("partners").update({ payouts_enabled: payoutsEnabled }).eq("id", session.partnerId);
    return NextResponse.json({
      connected: true,
      payoutsEnabled,
      detailsSubmitted: !!account.details_submitted,
      method: "stripe",
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : "Stripe error",
      connected: true,
      payoutsEnabled: !!row?.payouts_enabled,
      detailsSubmitted: false,
      method: "stripe",
    }, { status: 200 });
  }
}
