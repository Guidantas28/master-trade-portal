import { redirect } from "next/navigation";
import { getPartnerSession } from "@/lib/partner-auth";
import { Providers } from "@/components/providers";
import { TradePortalApp } from "@/components/app";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const session = await getPartnerSession();

  // Authenticated but no linked partner row, or not signed in → back to login.
  if (!session) {
    const sp = await searchParams;
    const email = sp.email?.trim();
    redirect(email ? `/login?email=${encodeURIComponent(email)}` : "/login");
  }

  return (
    <Providers partner={session.partner}>
      <TradePortalApp />
    </Providers>
  );
}
