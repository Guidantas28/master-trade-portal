// Service-role Supabase client — SERVER ONLY. Bypasses RLS.
// Use only in trusted server routes (e.g. the Stripe webhook updating partner
// subscription state). Never import this into a client component.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new Error("Service client env missing: NEXT_PUBLIC_SUPABASE_URL / SERVICE_ROLE_KEY.");
  }
  return createSupabaseClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
