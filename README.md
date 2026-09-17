# Noeud Forecast Observatory

Internal monitoring surface for
[**Noeud FX Forecast Intelligence**](../noeud-fx-forecast-intelligence) — the
service that produces probabilistic 30-calendar-day forecasts of USD/GHS,
EUR/GHS and GBP/GHS.

The observatory exists so the team can watch a live experiment run for weeks
without reading the database by hand: what the models are forecasting, what the
event-intelligence layer concluded and why, how yesterday's forecasts scored
against today's rate, and whether the pipeline is actually running.

It is read-only. Nothing on this dashboard writes to the forecasting database.

> **Replaces the previous observatory.** This app used to read the halted
> `noeud_ml_forecast` FastAPI backend. That contract, its sentiment tables and
> its `7d` horizon focus are gone; the app now reads the
> `noeud_forecast` Supabase schema directly.

## Pages

| Route | What it answers |
| --- | --- |
| `/` | What did the pipeline produce today, across all three pairs? |
| `/forecast` | What is the live 30-day distribution, and what did each model say about each date? |
| `/accuracy` | How are matured forecasts scoring against the rates that actually printed? |
| `/intelligence` | What did the LLM read, reject, and conclude — on any recorded day? |
| `/models` | Which model produced this, how is it identified, and where is it in the promotion state machine? |
| `/market` | Five years of calendar-day rates, their diagnostics, and any suspect prints |
| `/operations` | Pipeline runs, provider ingestion, and the leases that keep work exactly-once |
| `/methodology` | How every number on the dashboard is produced |

### Things worth knowing about the UI

- **Forward forecasting is the centrepiece.** The fan chart draws all nine
  quantiles, with a 50 / 90 / 98% coverage toggle. Target dates that have
  already matured stay on the observed line *inside* the fan, so a miss is
  visible the day after issuance rather than at the end of the month.
- **The tracking chart** puts the observed rate, the Chronos median and the
  bootstrap median on one axis by target date. Left of the marker all three are
  settled; right of it only the models have an opinion.
- **Time travel.** `/forecast` has a Chronos-origin selector and
  `/intelligence` has an assessment-day selector, both URL-driven
  (`?origin=…`, `?date=…`), so any historical state is linkable. The decision
  history strip on `/intelligence` doubles as navigation.
- **Failed reads are shown as failed reads.** There is no fixture fallback: a
  dashboard that silently mixes live and mock rows is worse than one that is
  visibly down.

## Data access

The `noeud_forecast` schema is deliberately **absent from the Supabase Data
API's exposed-schema list**, so no browser key can reach it and PostgREST is not
an option. The observatory therefore reads PostgreSQL directly from the Next.js
server and ships rendered HTML:

```text
Server Component  ->  lib/server/views.ts | forecast-view.ts   (page models)
                  ->  lib/server/queries.ts                    (typed SQL reads)
                  ->  lib/server/db.ts                         (pg Pool, server-only)
                  ->  Supabase session pooler (IPv4, TLS)
```

`lib/analytics.ts` holds every derivation (fan rows, interval widths, skew,
rolling volatility, correlation, accuracy rollups) as pure functions shared by
server and client, so charts never recompute anything the tables disagree with.

### Environment

Copy `.env.example` to `.env` and fill it in.

```env
OBSERVATORY_SHARED_SECRET=...
OBSERVATORY_COOKIE_SECRET=...
OBSERVATORY_DATABASE_URL=postgresql://<role>.<project-ref>:<password>@<pooler-host>:5432/postgres
OBSERVATORY_DB_SCHEMA=noeud_forecast
OBSERVATORY_DB_POOL_MAX=4
NEXT_PUBLIC_SUPABASE_PROJECT_REF=...
NEXT_PUBLIC_FORECAST_TIMEZONE=Africa/Accra
```

Notes:

- Use the **session pooler** URI from Supabase → Connect. The direct
  `db.<ref>.supabase.co` host is IPv6-only and will not resolve on most
  networks.
- `sslmode` in the URI is stripped at runtime; TLS is configured explicitly
  because Supabase's chain is not in the local trust store.
- **Use the least-privilege reader login.** The backend repo provisions
  `noeud_forecast_api` via `noeud-forecast provision-postgres-roles`; point
  `OBSERVATORY_DATABASE_URL` at that role rather than the database owner. The
  observatory only ever issues `SELECT`.
- `OBSERVATORY_DATABASE_URL` is server-only and is never sent to the browser.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. You will be asked for the shared observatory key
(`OBSERVATORY_SHARED_SECRET`) before anything renders.

```bash
npm run build
npm run start
npm run lint
```

## Auth

Shared-secret login, HMAC-signed HTTP-only session cookie, route protection in
`src/proxy.ts`. Deliberately simple: this is an internal dashboard for a
time-boxed experiment, not a product surface. Full identity is out of scope.

## Stack

Next.js App Router (16) · TypeScript · shadcn/ui on Base UI · Recharts ·
Tailwind v4 · `pg`.

Charts follow a fixed, validated categorical palette (`src/app/globals.css`):
slots 1–3 are the pair identities and clear the colour-vision-deficiency and
normal-vision separation floors in both light and dark mode; the four status
colours are reserved and always ship with an icon and a label, never colour
alone.

## Key files

- `src/lib/server/db.ts` — connection pool, reload-aware in dev
- `src/lib/server/queries.ts` — every SQL read, one function per question
- `src/lib/server/views.ts`, `forecast-view.ts` — page-level models
- `src/lib/analytics.ts` — derivations shared by server and client
- `src/components/charts/` — the chart library
- `src/components/obs/` — observatory-specific UI (badges, tables, selectors)
- `src/app/methodology/page.tsx` — the written explanation of everything above

## Related

- [`../noeud-fx-forecast-intelligence/docs/supabase-setup-runbook.md`](../noeud-fx-forecast-intelligence/docs/supabase-setup-runbook.md)
- [`../noeud-fx-forecast-intelligence/docs/event-intelligence.md`](../noeud-fx-forecast-intelligence/docs/event-intelligence.md)
- [`../noeud-fx-forecast-intelligence/docs/model-gates.md`](../noeud-fx-forecast-intelligence/docs/model-gates.md)
- [`../noeud-fx-forecast-intelligence/supabase/migrations/`](../noeud-fx-forecast-intelligence/supabase/migrations/)
