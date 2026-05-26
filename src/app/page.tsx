import { redirect } from "next/navigation";
import { getPartnerSession } from "@/lib/partner-auth";
import { Providers } from "@/components/providers";
import { TradePortalApp } from "@/components/app";

export default async function Page() {
  const session = await getPartnerSession();

  // Authenticated but no linked partner row, or not signed in → back to login.
  if (!session) redirect("/login");

  return (
    <Providers partner={session.partner}>
      <TradePortalApp />
    </Providers>
  );
}
