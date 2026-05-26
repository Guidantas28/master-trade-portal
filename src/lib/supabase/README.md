# Data wiring plan

This portal is **UI-first**: every screen renders from typed mock data in
`src/lib/mock-data.ts`. It is built to reuse the **same Supabase database/structure**
as Fixfy OS (`master-os`). When you wire real data, keep the shapes in `src/types`
and replace the mock imports with Supabase queries.

## Identity

The trade portal is the supply side — the authenticated user is a **partner** (trade).
`master-os` already ships partner-portal session plumbing (`partner-portal-session.ts`,
`partner-portal-allowlist.ts`, `partner-portal-crypto.ts`). This deliverable is
**dev-open** (no auth gate); auth is a follow-up step. Resolve the current partner once,
then scope all queries to it.

## Entity → table mapping

| Portal type (`src/types`) | Fixfy OS table | Notes |
|---|---|---|
| `Partner` (Marcus) | `partners` | The authenticated trade. |
| `MyJob` | `jobs` (where `partner_id = me`) | `status`: scheduled / in_progress / awaiting_signoff / completed. |
| `Customer` | clients / job contacts | Name, address, postcode, prior-job count. |
| `Lead` | `service_requests` not yet quoted | **Lead distribution** (max-5-contacts) likely needs new columns/RPC. |
| `AvailableJob` | `jobs` quoted + signed off, unassigned | First-to-accept pool; needs an atomic claim RPC. |
| `QuoteRequest` | `quotes` (`quote_type = 'partner'`) + bids | Partner bids / leading-bid. |
| `ScheduleEvent` | `job_visits` / `jobs.scheduled_*` | Calendar. |
| self-bills | `self_bills` | Settings → Self-bill, Net-7 payout. |
| documents | `partner_documents` | Settings → Documents. |

## Concepts that may not exist in the schema yet

- **Lead distribution** with a hard cap of 5 contacting trades per lead.
- **Available-jobs pool** with atomic, race-safe acceptance (first wins).
- **Partner quote bidding** with a visible leading bid.

These need migrations/RPCs added to `master-os` before this portal can fully wire up.
Treat the UI here as the contract those need to satisfy.
