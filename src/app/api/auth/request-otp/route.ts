// POST /api/auth/request-otp  { email }
// Generates a sign-in OTP server-side via admin.generateLink (this does NOT send any
// email) and delivers the 6-digit code via Resend — only to addresses that belong to a
// partner. Always returns { ok: true } (enumeration defence).

import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendOtpEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let email = "";
  try {
    const body = (await req.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ ok: true });
  }
  if (!email || !email.includes("@")) return NextResponse.json({ ok: true });

  let devCode: string | undefined;
  try {
    const admin = createServiceClient();

    // Gate to registered partners: only emails that belong to an external_partner app user
    // (public.users) get a code. Checked BEFORE generateLink so non-partners never even create
    // an auth user. The linked partners row is then ensured at sign-in (getPartnerSession RPC).
    const { data: appUser } = await admin
      .from("users")
      .select("id")
      .ilike("email", email)
      .eq("user_type", "external_partner")
      .maybeSingle();
    if (!appUser) return NextResponse.json({ ok: true }); // not a partner — silent (enumeration defence)

    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (!error && data?.user) {
      const otp = data.properties?.email_otp;
      if (otp) {
        // Dev convenience: surface the code on localhost so you can sign in even when
        // email delivery isn't configured (e.g. invalid RESEND_API_KEY). Never in prod.
        if (process.env.NODE_ENV !== "production") devCode = otp;
        try {
          await sendOtpEmail(email, otp);
        } catch (e) {
          console.error("[auth/request-otp] email send failed (set a valid RESEND_API_KEY):", e);
        }
      }
    }
  } catch (err) {
    console.error("[auth/request-otp]", err);
  }

  return NextResponse.json(devCode ? { ok: true, devCode } : { ok: true });
}
