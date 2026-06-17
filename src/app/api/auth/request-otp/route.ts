// POST /api/auth/request-otp  { email, inviteCode? }
// Generates a sign-in OTP server-side via admin.generateLink (this does NOT send any
// email) and delivers the 6-digit code via Resend — only to addresses that belong to a
// partner. Always returns { ok: true } (enumeration defence).

import { NextResponse, type NextRequest } from "next/server";
import { ensureAuthUserForPartner } from "@/lib/partner-auth-claim";
import { createServiceClient } from "@/lib/supabase/service";
import { sendOtpEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let email = "";
  let inviteCode = "";
  try {
    const body = (await req.json()) as { email?: unknown; inviteCode?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    inviteCode = typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";
  } catch {
    return NextResponse.json({ ok: true });
  }
  if (!email || !email.includes("@")) return NextResponse.json({ ok: true });

  let devCode: string | undefined;
  let emailError: string | undefined;
  let genError: string | undefined;
  try {
    const admin = createServiceClient();

    const [appUsers, partnerRows] = await Promise.all([
      admin.from("users").select("id").ilike("email", email).eq("user_type", "external_partner").limit(1),
      admin.from("partners").select("id, auth_user_id").ilike("email", email).limit(1),
    ]);
    const partnerRow = partnerRows.data?.[0] as { id: string; auth_user_id?: string | null } | undefined;
    const isPartner = (appUsers.data?.length ?? 0) > 0 || Boolean(partnerRow?.id);
    if (!isPartner) {
      const dev = process.env.NODE_ENV !== "production";
      return NextResponse.json(dev ? { ok: true, notPartner: true } : { ok: true });
    }

    if (partnerRow?.id && !partnerRow.auth_user_id?.trim()) {
      if (inviteCode) {
        const { claimPartnerInvite } = await import("@/lib/partner-auth-claim");
        const result = await claimPartnerInvite(admin, { email, inviteCode });
        const dev = process.env.NODE_ENV !== "production";
        return NextResponse.json({
          ok: true,
          ...(dev && result.devCode ? { devCode: result.devCode } : {}),
          ...(dev && result.emailError ? { emailError: result.emailError } : {}),
        });
      }
      await ensureAuthUserForPartner(admin, partnerRow.id, email);
    }

    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (error) genError = error.message;
    if (!error && data?.user) {
      const otp = data.properties?.email_otp;
      if (otp) {
        if (process.env.NODE_ENV !== "production") devCode = otp;
        try {
          await sendOtpEmail(email, otp);
        } catch (e) {
          emailError = e instanceof Error ? e.message : String(e);
          console.error("[auth/request-otp] email send failed:", e);
        }
      } else {
        genError = genError ?? "No OTP returned by Supabase generateLink.";
      }
    }
  } catch (err) {
    genError = err instanceof Error ? err.message : String(err);
    console.error("[auth/request-otp]", err);
  }

  const dev = process.env.NODE_ENV !== "production";
  return NextResponse.json({
    ok: true,
    ...(dev && devCode ? { devCode } : {}),
    ...(dev && emailError ? { emailError } : {}),
    ...(dev && genError ? { genError } : {}),
  });
}
