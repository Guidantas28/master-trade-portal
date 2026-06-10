// POST /api/payouts/bank — save UK bank details entered manually (no Stripe API).
// Connect-with-Stripe flow uses /api/payouts/connect instead.

import { NextResponse } from "next/server";
import { getPartnerSession } from "@/lib/partner-auth";
import { saveManualPayoutBank } from "@/lib/partner-manual-payout";
import { createServiceClient } from "@/lib/supabase/service";

function digits(v: unknown, len: number): string | null {
  if (typeof v !== "string") return null;
  const d = v.replace(/\D/g, "");
  return d.length === len ? d : null;
}

export async function POST(req: Request) {
  const session = await getPartnerSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { accountHolder?: string; sortCode?: string; accountNumber?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const accountHolder = typeof body.accountHolder === "string" ? body.accountHolder.trim() : "";
  const sortCode = digits(body.sortCode, 6);
  const accountNumber = digits(body.accountNumber, 8);

  if (!accountHolder) return NextResponse.json({ error: "Account holder name is required" }, { status: 400 });
  if (!sortCode) return NextResponse.json({ error: "Sort code must be 6 digits" }, { status: 400 });
  if (!accountNumber) return NextResponse.json({ error: "Account number must be 8 digits" }, { status: 400 });

  try {
    const svc = createServiceClient();
    await saveManualPayoutBank(svc, session.partnerId, { accountHolder, sortCode, accountNumber });
    return NextResponse.json({ ok: true, payoutsEnabled: true, method: "manual" });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't save bank details" }, { status: 500 });
  }
}
