// Resend email — sends the sign-in OTP ourselves so we don't depend on GoTrue SMTP
// (the self-hosted Supabase has no SMTP configured). SERVER ONLY.

import { Resend } from "resend";
import { T } from "@/lib/tokens";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (!resend) throw new Error("RESEND_API_KEY not set");
  const from = process.env.RESEND_FROM_EMAIL || "Fixfy <onboarding@resend.dev>";

  const html = `
  <div style="font-family:Inter,-apple-system,Segoe UI,sans-serif;background:${T.paper};padding:32px;color:${T.ink}">
    <div style="max-width:420px;margin:0 auto;background:#fff;border:1px solid ${T.line};border-radius:16px;overflow:hidden">
      <div style="padding:20px 24px;border-bottom:1px solid ${T.line}">
        <span style="font-size:20px;font-weight:600;letter-spacing:-0.5px;color:${T.navy}">fixfy</span>
        <span style="font-size:10px;font-weight:500;color:${T.mute};background:${T.paper2};border-radius:4px;padding:2px 6px;margin-left:8px;letter-spacing:0.4px">TRADE</span>
      </div>
      <div style="padding:24px">
        <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:${T.navy}">Your sign-in code</p>
        <p style="margin:0 0 16px;font-size:13px;color:${T.mute};line-height:1.5">Enter this code in the trade portal to sign in. It expires shortly.</p>
        <div style="font-family:Menlo,monospace;font-size:30px;font-weight:600;letter-spacing:6px;color:${T.coral};background:${T.coralTint};border-radius:10px;padding:16px;text-align:center">${code}</div>
        <p style="margin:16px 0 0;font-size:11.5px;color:${T.mute};line-height:1.5">Didn't request this? You can safely ignore this email.</p>
      </div>
    </div>
  </div>`;

  await resend.emails.send({
    from,
    to,
    subject: `${code} is your Fixfy sign-in code`,
    html,
  });
}
