import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchPartnerDocuments, missingRequiredDocs } from "@/lib/queries/partner-documents";

// Server-side enforcement of the document gate, mirroring the UI gate in app.tsx: a partner can't
// take on work (accept a job, contact a lead, bid) until every required document is on file. The
// UI gate is UX; this is the real enforcement on the action routes.
//
// Returns the human names of any still-missing required docs (empty = cleared to work). Unlike the
// UI (which fails OPEN on a transient error so it never locks someone out), the server fails CLOSED
// — if we can't verify, we don't let the action through.
export async function partnerMissingRequiredDocs(svc: SupabaseClient, partnerId: string): Promise<string[]> {
  try {
    const docs = await fetchPartnerDocuments(svc, partnerId);
    return missingRequiredDocs(docs).map((d) => d.name);
  } catch {
    return ["your documents could not be verified — try again"];
  }
}
