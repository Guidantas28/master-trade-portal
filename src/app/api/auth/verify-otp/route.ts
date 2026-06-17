// POST /api/auth/verify-otp  { email, token }
// Verifies the 6-digit code (server client → sets the SSR session cookie) and confirms
// the user is a partner, otherwise signs them out.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let email = "";
  let token = "";
  try {
    const body = (await req.json()) as { email?: unknown; token?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    token = typeof body.token === "string" ? body.token.trim().replace(/\s+/g, "") : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !email.includes("@")) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  if (!/^\d{6}$/.test(token)) return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      const msg = (error.message ?? "").toLowerCase();
      if (msg.includes("expired")) {
        return NextResponse.json({ error: "That code expired. Request a new one." }, { status: 410 });
      }
      return NextResponse.json({ error: "That code is invalid. Check the digits or request a new one." }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      let { data: partner } = await supabase.from("partners").select("id").eq("auth_user_id", user.id).maybeSingle();
      if (!partner) {
        const admin = createServiceClient();
        const { data: byEmail } = await admin
          .from("partners")
          .select("id, auth_user_id")
          .ilike("email", email)
          .limit(1);
        const row = byEmail?.[0] as { id: string; auth_user_id?: string | null } | undefined;
        if (row?.id && !row.auth_user_id?.trim()) {
          await admin.from("partners").update({ auth_user_id: user.id }).eq("id", row.id);
          partner = { id: row.id };
        }
      }
      if (!partner) {
        await supabase.auth.signOut();
        return NextResponse.json({ error: "This email isn't registered as a Fixfy trade." }, { status: 403 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/verify-otp]", err);
    return NextResponse.json({ error: "Couldn't verify your code. Try again." }, { status: 500 });
  }
}
