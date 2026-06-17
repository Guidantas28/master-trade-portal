import type { SupabaseClient } from "@supabase/supabase-js";

export type PartnerAccessStatus = "active" | "onboarding" | "inactive" | "on_break" | "needs_attention" | string;

export async function getPartnerAccessStatus(
  svc: SupabaseClient,
  partnerId: string,
): Promise<PartnerAccessStatus | null> {
  const { data } = await svc.from("partners").select("status").eq("id", partnerId).maybeSingle();
  return (data as { status?: PartnerAccessStatus } | null)?.status ?? null;
}

/** Returns an error message when the partner cannot take work actions yet. */
export async function partnerWorkAccessBlocked(
  svc: SupabaseClient,
  partnerId: string,
): Promise<string | null> {
  const status = await getPartnerAccessStatus(svc, partnerId);
  if (!status || status === "active") return null;
  if (status === "onboarding") {
    return "Your account is in review. We'll email you when you're approved to receive jobs.";
  }
  return "Your account isn't active yet. Contact support if you need help.";
}
