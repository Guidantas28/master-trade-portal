import { NextResponse, type NextRequest } from "next/server";
import { claimPartnerInvite } from "@/lib/partner-auth-claim";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** POST /api/auth/claim-invite — link OS partner row to auth + email OTP. */
export async function POST(req: NextRequest) {
  let body: { email?: unknown; inviteCode?: unknown; fullName?: unknown; company?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const inviteCode = typeof body.inviteCode === "string" ? body.inviteCode.trim() : undefined;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : undefined;
  const company = typeof body.company === "string" ? body.company.trim() : undefined;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code is required." }, { status: 400 });
  }

  try {
    const admin = createServiceClient();
    const result = await claimPartnerInvite(admin, { email, inviteCode, fullName, company });
    const dev = process.env.NODE_ENV !== "production";
    return NextResponse.json({
      ok: true,
      ...(dev && result.devCode ? { devCode: result.devCode } : {}),
      ...(dev && result.emailError ? { emailError: result.emailError } : {}),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    const status = err.status ?? 500;
    return NextResponse.json({ error: err.message || "Couldn't claim invite." }, { status });
  }
}
