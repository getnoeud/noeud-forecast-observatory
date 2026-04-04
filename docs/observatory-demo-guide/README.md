# Noeud Observatory Demo Guide

This folder is a practical walkthrough for presenting the current Noeud Forecast Observatory to internal stakeholders.

It is written for two audiences at once:

- technical teammates who want to understand what the dashboard is measuring
- non-technical stakeholders who need to understand why the dashboard matters to the business

The observatory exists because building forecasts is only the first half of the job. If Noeud is going to help African SMEs protect margin, pricing decisions, procurement timing, and broader resilience against FX volatility, we need a reliable way to answer:

- what exactly did we predict
- what actually happened in the market
- how often were we directionally right
- how large were our misses when we were wrong
- did sentiment improve the forecast or only add noise
- which pairs and time windows deserve more trust

That is the role of the observatory.

## What The Observatory Is

The observatory is an internal evaluation dashboard for matured forecasts.

Important distinction:

- the forecasting system issues predictions today
- the observatory evaluates those predictions only after the market has had time to realize the outcome

So this is not just a "prediction viewer." It is an audit and performance layer.

## Current Implemented Pages

- `Login`
- `Overview`
- `Pair Review`
- `Weekly Reports`
- `Help`
- `Settings`

The sidebar also shows future placeholders:

- `Monthly Reports`
- `Investor View`

Those are intentionally not active yet.

## Recommended Demo Flow

If you have about 10 to 20 minutes, this order works well:

1. Start with [DEMO_TALK_TRACK.md](./DEMO_TALK_TRACK.md)
2. Move to [01_OVERVIEW_PAGE.md](./01_OVERVIEW_PAGE.md)
3. Go deeper with [02_PAIR_REVIEW_PAGE.md](./02_PAIR_REVIEW_PAGE.md)
4. Show governance and exports with [03_WEEKLY_REPORTS_PAGE.md](./03_WEEKLY_REPORTS_PAGE.md)
5. Use [04_HELP_PAGE.md](./04_HELP_PAGE.md) if someone asks "how does this evaluation actually work?"
6. Close with [05_SETTINGS_PAGE.md](./05_SETTINGS_PAGE.md) and [06_LOGIN_PAGE.md](./06_LOGIN_PAGE.md) only if relevant

## Quick Operating Truths To Repeat In The Demo

- The dashboard evaluates matured forecasts, not fresh unresolved forecasts.
- Each forecast issuance is treated as its own contract and audited separately.
- The 7-day horizon is the live default because it is the most operationally useful for beta.
- The dashboard reads the FastAPI backend, not Supabase directly.
- The point is not only model accuracy. The point is operational trust.

## File Map

- [DEMO_TALK_TRACK.md](./DEMO_TALK_TRACK.md)
- [METRIC_GLOSSARY.md](./METRIC_GLOSSARY.md)
- [01_OVERVIEW_PAGE.md](./01_OVERVIEW_PAGE.md)
- [02_PAIR_REVIEW_PAGE.md](./02_PAIR_REVIEW_PAGE.md)
- [03_WEEKLY_REPORTS_PAGE.md](./03_WEEKLY_REPORTS_PAGE.md)
- [04_HELP_PAGE.md](./04_HELP_PAGE.md)
- [05_SETTINGS_PAGE.md](./05_SETTINGS_PAGE.md)
- [06_LOGIN_PAGE.md](./06_LOGIN_PAGE.md)
