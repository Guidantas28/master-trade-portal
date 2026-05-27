// POST /api/payouts/connect → returns a Stripe Connect onboarding/update link for the partner.
//
// Creates an Express account on first use (stored on partners.stripe_connect_account_id), then an
// account link the partner follows to Stripe-hosted onboarding. Bank details live with Stripe.
// Requires Stripe Connect to be enabled on the platform account.

import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { requireStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const stripe = requireStripe();
  const svc = createServiceClient();
  const origin = req.headers.get("origin") || new URL(req.url).origin;

  try {
    const { data: row } = await svc
      .from("partners")
      .select("stripe_connect_account_id")
      .eq("id", session.partnerId)
      .maybeSingle();

    let accountId = row?.stripe_connect_account_id as string | undefined;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: session.email ?? undefined,
        business_type: "individual",
        capabilities: { transfers: { requested: true } },
        metadata: { partner_id: session.partnerId },
      });
      accountId = account.id;
      await svc.from("partners").update({ stripe_connect_account_id: accountId }).eq("id", session.partnerId);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/?payouts=refresh`,
      return_url: `${origin}/?payouts=return`,
      type: "account_onboarding",
    });
    return NextResponse.json({ url: link.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Stripe Connect not available" }, { status: 500 });
  }
}
