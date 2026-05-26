// POST /api/billing/checkout
// Creates a Stripe Checkout Session (subscription mode, 3-day trial) for the signed-in
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
  const { data } = await admin.from("partners").select("stripe_customer_id").eq("id", session.partnerId).maybeSingle();
  let customerId = (data as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? null;

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
    subscription_data: { trial_period_days: 3, metadata: { partner_id: session.partnerId } },
    allow_promotion_codes: true,
    success_url: `${origin}/?billing=success`,
    cancel_url: `${origin}/?billing=cancel`,
    metadata: { partner_id: session.partnerId },
  });

  return NextResponse.json({ url: checkout.url });
}
