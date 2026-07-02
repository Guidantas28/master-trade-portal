// POST /api/partner/onboarding-draft — progressive save before account verification.
// GET  /api/partner/onboarding-draft?code= — restore draft prefill.

import { NextResponse, type NextRequest } from "next/server";
import { loadOnboardingDraft, upsertOnboardingDraft } from "@/lib/partner-onboarding-draft";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  if (!code) return NextResponse.json({ error: "Missing code." }, { status: 400 });

  try {
    const svc = createServiceClient();
    const draft = await loadOnboardingDraft(svc, code);
    if (!draft) return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    return NextResponse.json({ ok: true, ...draft });
  } catch (e) {
    console.error("[partner/onboarding-draft] GET failed:", e);
    return NextResponse.json({ error: "Couldn't load draft." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const svc = createServiceClient();
    const result = await upsertOnboardingDraft(svc, {
      inviteCode: typeof body.inviteCode === "string" ? body.inviteCode : undefined,
      draftCode: typeof body.draftCode === "string" ? body.draftCode : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      fullName: typeof body.fullName === "string" ? body.fullName : undefined,
      company: typeof body.company === "string" ? body.company : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      partnerAddress: typeof body.partnerAddress === "string" ? body.partnerAddress : undefined,
      trades: Array.isArray(body.trades) ? body.trades : undefined,
      primaryTrade: typeof body.primaryTrade === "string" ? body.primaryTrade : undefined,
      catalogServiceIds: Array.isArray(body.catalogServiceIds) ? body.catalogServiceIds : undefined,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const err = e as Error & { status?: number };
    console.error("[partner/onboarding-draft] POST failed:", e);
    return NextResponse.json(
      { error: err.message || "Couldn't save your progress." },
      { status: err.status ?? 500 },
    );
  }
}
