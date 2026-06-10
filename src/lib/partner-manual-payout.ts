// Manual UK bank details for partner payouts — stored on the partner row (no Stripe call).
// Uses partners.notification_prefs._portal.payoutBank so we don't need a new migration;
// notification UI only reads known event keys, so this nested blob is ignored there.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ManualPayoutBank {
  accountHolder: string;
  sortCode: string;
  accountNumber: string;
  savedAt: string;
}

interface PortalPrefs {
  payoutBank?: ManualPayoutBank;
}

interface NotificationPrefsRow {
  _portal?: PortalPrefs;
  [key: string]: unknown;
}

export async function getManualPayoutBank(
  svc: SupabaseClient,
  partnerId: string,
): Promise<ManualPayoutBank | null> {
  const { data } = await svc.from("partners").select("notification_prefs").eq("id", partnerId).maybeSingle();
  const prefs = (data as { notification_prefs?: NotificationPrefsRow } | null)?.notification_prefs;
  return prefs?._portal?.payoutBank ?? null;
}

export async function saveManualPayoutBank(
  svc: SupabaseClient,
  partnerId: string,
  bank: Omit<ManualPayoutBank, "savedAt">,
): Promise<void> {
  const { data } = await svc.from("partners").select("notification_prefs").eq("id", partnerId).maybeSingle();
  const existing = ((data as { notification_prefs?: NotificationPrefsRow } | null)?.notification_prefs ?? {}) as NotificationPrefsRow;

  const notification_prefs: NotificationPrefsRow = {
    ...existing,
    _portal: {
      ...(existing._portal ?? {}),
      payoutBank: { ...bank, savedAt: new Date().toISOString() },
    },
  };

  const { error } = await svc
    .from("partners")
    .update({ notification_prefs, payouts_enabled: true })
    .eq("id", partnerId);
  if (error) throw error;
}
