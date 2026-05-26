// POST /api/billing/portal
// Opens the Stripe Billing Portal for the signed-in partner (manage card, cancel, etc.).

import { NextResponse, type NextRequest } from "next/server";
import { requireStripe } from "@/lib/stripe";
import { getPartnerSession } from "@/lib/partner-auth";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createServiceClient();
  const { data } = await admin.from("partners").select("stripe_customer_id").eq("id", session.partnerId).maybeSingle();
  const customerId = (data as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? null;

  if (!customerId) {
    return NextResponse.json({ error: "no_subscription" }, { status: 400 });
  }

  const portal = await requireStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${req.nextUrl.origin}/?billing=portal`,
  });

  return NextResponse.json({ url: portal.url });
}
