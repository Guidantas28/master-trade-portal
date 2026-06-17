import { redirect } from "next/navigation";
import { getPartnerSession } from "@/lib/partner-auth";
import { Providers } from "@/components/providers";
import { TradePortalApp } from "@/components/app";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; invite?: string }>;
}) {
  const session = await getPartnerSession();

  // Authenticated but no linked partner row, or not signed in → back to login.
  if (!session) {
    const sp = await searchParams;
    const email = sp.email?.trim();
    const invite = sp.invite?.trim();
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (invite) params.set("invite", invite);
    const qs = params.toString();
    redirect(qs ? `/login?${qs}` : "/login");
  }

  return (
    <Providers partner={session.partner}>
      <TradePortalApp />
    </Providers>
  );
}
