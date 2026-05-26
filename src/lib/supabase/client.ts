// Browser Supabase client — ready for the data-wiring phase.
//
// This portal reuses the SAME Supabase project/structure as Fixfy OS (master-os).
// It is intentionally NOT used yet: the current build is UI-first against mock data
// (see src/lib/mock-data.ts). When wiring real data, import this and swap the mock
// imports for queries scoped to the authenticated partner (jobs.partner_id, etc.).

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).",
    );
  }

  return createBrowserClient(url, anonKey);
}
