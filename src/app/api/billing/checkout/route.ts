// POST /api/billing/checkout
// Creates a Stripe Checkout Session (subscription mode, trial = remaining 30-day platform trial) for the signed-in
// partner and returns the redirect URL. Reuses the partner's Stripe customer if one
// exists; otherwise creates it and stores the id (best-effort — tolerates the
// stripe_customer_id column not existing until migration 196 is applied).

import { NextResponse, type NextRequest } from "next/server";
import { FIXFY_PRO_PRICE_ID, requireStripe } from "@/lib/stripe";
import { getPartnerSession } from "@/lib/partner-auth";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!FIXFY_PRO_PRICE_ID) {
    return NextResponse.json({ error: "STRIPE_PRICE_FIXFY_PRO is not set" }, { status: 503 });
  }

  const stripe = requireStripe();
  const admin = createServiceClient();

  // Reuse existing customer (column may not exist yet — error is tolerated).
  const { data } = await admin
    .from("partners")
    .select("stripe_customer_id, trial_ends_at")
    .eq("id", session.partnerId)
    .maybeSingle();
  let customerId = (data as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? null;

  // Honour the 30-day platform free trial: don't start charging until the
  // partner's signup trial actually ends. Subscribing mid-trial keeps the
  // remaining free days; if the trial already ended, no Stripe trial is added.
  const trialEndsAt = (data as { trial_ends_at?: string | null } | null)?.trial_ends_at ?? null;
  const remainingTrialDays = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : 30;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.email ?? undefined,
      name: session.partner.tradingName,
      metadata: { partner_id: session.partnerId },
    });
    customerId = customer.id;
    await admin.from("partners").update({ stripe_customer_id: customerId }).eq("id", session.partnerId);
  }

  const origin = req.nextUrl.origin;
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: FIXFY_PRO_PRICE_ID, quantity: 1 }],
    subscription_data: {
      // Stripe requires trial_period_days >= 1; omit the trial when it's over.
      ...(remainingTrialDays >= 1 ? { trial_period_days: remainingTrialDays } : {}),
      metadata: { partner_id: session.partnerId },
    },
    allow_promotion_codes: true,
    success_url: `${origin}/?billing=success`,
    cancel_url: `${origin}/?billing=cancel`,
    metadata: { partner_id: session.partnerId },
  });

  return NextResponse.json({ url: checkout.url });
}
