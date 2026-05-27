// POST /api/auth/signup  { email, fullName, company, trade, phone? }
//
// Self-registration for new trades. Creates the auth user + public.users (external_partner) +
// public.partners row with a 30-day free trial (no card), then emails a 6-digit OTP via Resend so
// they can sign in. After verifying the code the app opens the onboarding flow. The partner the
// portal resolves from the session (partner-auth) is this same partners row.

import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendOtpEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const TRIAL_DAYS = 30;
const VALID_TRADES = new Set([
  "Plumbing",
  "General Maintenance",
  "Light Carpentry",
  "Electrical",
  "Painting & Decorating",
  "Tiling",
  "Plastering",
  "Flooring",
]);

export async function POST(req: NextRequest) {
  let body: { email?: unknown; fullName?: unknown; company?: unknown; trade?: unknown; phone?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const trade = typeof body.trade === "string" ? body.trade.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!email || !email.includes("@")) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  if (!fullName) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  if (!company) return NextResponse.json({ error: "Enter your company or trading name." }, { status: 400 });
  if (!VALID_TRADES.has(trade)) return NextResponse.json({ error: "Pick your primary trade." }, { status: 400 });

  const admin = createServiceClient();

  // Already registered? Send them to sign-in instead of creating a duplicate.
  const [existingUser, existingPartner] = await Promise.all([
    admin.from("users").select("id").ilike("email", email).limit(1),
    admin.from("partners").select("id").ilike("email", email).limit(1),
  ]);
  if ((existingUser.data?.length ?? 0) > 0 || (existingPartner.data?.length ?? 0) > 0) {
    return NextResponse.json({ error: "That email is already registered. Sign in instead." }, { status: 409 });
  }

  // 1) Auth user (email pre-confirmed so the OTP sign-in works immediately).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, company, role: "external_partner" },
  });
  if (createErr || !created?.user) {
    const msg = (createErr?.message ?? "").toLowerCase();
    if (msg.includes("already")) return NextResponse.json({ error: "That email is already registered. Sign in instead." }, { status: 409 });
    return NextResponse.json({ error: "Couldn't create your account. Try again." }, { status: 500 });
  }
  const userId = created.user.id;

  // 2) App user row (external_partner) — the linkage the portal + OS expect. The handle_new_user
  //    trigger already inserted a public.users row (with a non-partner default type), so UPSERT to
  //    flip it to external_partner rather than insert (which would hit users_pkey).
  const { error: usersErr } = await admin
    .from("users")
    .upsert({ id: userId, email, full_name: fullName, user_type: "external_partner", userActive: true }, { onConflict: "id" });
  if (usersErr) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    console.error("[auth/signup] users upsert failed:", usersErr);
    return NextResponse.json({ error: "Couldn't set up your account. Try again." }, { status: 500 });
  }

  // 3) Partner row with a 30-day free trial (no card). Operational data keys off partners.id.
  const trialEnds = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error: partnerErr } = await admin.from("partners").insert({
    auth_user_id: userId,
    email,
    company_name: company,
    contact_name: fullName,
    phone: phone || null,
    trade,
    trades: [trade],
    location: "",
    subscription_status: "trialing",
    plan: "pro",
    trial_ends_at: trialEnds,
  });
  if (partnerErr) {
    await admin.from("users").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    console.error("[auth/signup] partners insert failed:", partnerErr);
    return NextResponse.json({ error: "Couldn't set up your trade profile. Try again." }, { status: 500 });
  }

  // 4) Email the 6-digit sign-in code (generateLink itself sends nothing).
  let devCode: string | undefined;
  let emailError: string | undefined;
  const { data: link, error: genErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const otp = link?.properties?.email_otp;
  if (!genErr && otp) {
    if (process.env.NODE_ENV !== "production") devCode = otp;
    try {
      await sendOtpEmail(email, otp);
    } catch (e) {
      emailError = e instanceof Error ? e.message : String(e);
      console.error("[auth/signup] OTP email send failed:", e);
    }
  } else if (genErr) {
    console.error("[auth/signup] generateLink failed:", genErr);
  }

  const dev = process.env.NODE_ENV !== "production";
  return NextResponse.json({
    ok: true,
    trialDays: TRIAL_DAYS,
    ...(dev && devCode ? { devCode } : {}),
    ...(dev && emailError ? { emailError } : {}),
  });
}
