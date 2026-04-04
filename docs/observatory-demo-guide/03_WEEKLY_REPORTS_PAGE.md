# Weekly Reports Page

Route:

- `/reports/weekly`

Purpose:

- turn evaluation data into a clean operating review for a specific week

This page is designed for:

- recurring internal review
- export
- concise discussion of the latest resolved performance

It is especially good for team rituals because it converts the broader observatory into a time-boxed reporting surface.

## Why A Weekly Page Exists

The overview page is great for exploratory analysis.

The weekly report page is better for:

- repeatable review cadences
- comparing one report week to another
- creating a clean exportable snapshot

Suggested phrasing:

> Overview helps us explore. Weekly Reports helps us operate.

## Filters

The page lets you choose:

- horizon
- currency pair
- report week

If no week is chosen, the page resolves to:

- latest week with evaluation data

Why that matters:

- it keeps the page useful even when the user does not know the most recent available reporting week

## Main Summary Card

The top card shows:

- week start and week end
- whether it is the latest available evaluation week
- horizon
- pair filter context
- CSV export action

How to explain it:

> This is our reporting frame. Everything on this page is scoped to this resolved week and the selected horizon.

## Summary Metrics

The first summary band shows:

- evaluations
- hit rate
- MAE
- RMSE

These are the four fastest weekly signals.

How to explain them:

- `Evaluations`: how much weekly evidence we are looking at
- `Hit Rate`: whether direction was useful that week
- `MAE`: typical miss size
- `RMSE`: whether large misses made the week unstable

## Secondary Metrics

The second band shows:

- bias
- MAPE
- quant MAE
- quant delta

### Bias

Why it matters:

- tells us whether the week leaned systematically high or low

### MAPE

Why it matters:

- gives a normalized percentage-based reading of error

### Quant MAE

Why it matters:

- shows the baseline before sentiment adjustment

### Quant Delta

Why it matters:

- directly evaluates the sentiment layer for the week

Interpretation:

- negative delta: adjusted forecast won
- positive delta: quant-only won

How to explain it:

> Quant Delta is one of the most important governance numbers here because it tells us whether our adjustment layer earned its keep this week.

## Metric Guide Card

The page includes a built-in metric guide for:

- MAE
- RMSE
- MAPE
- Bias
- Quant MAE
- Quant Delta

Why it matters:

- this makes the page presentable to mixed audiences without needing a separate technical explanation every time

How to explain it:

> The page is intentionally self-explanatory enough for recurring review meetings.

## Pair Breakdown Table

This table shows weekly pair-level performance using fields like:

- pair
- evaluation count
- hit rate
- MAE
- RMSE
- MAPE
- bias
- quant delta

Why it matters:

- a week may look fine overall while hiding weak pair-specific behavior
- this table prevents portfolio averages from masking pair-level problems

How to explain it:

> This is where we break the weekly report back down into pair-level accountability.

## Export CSV

The page supports:

- CSV export from `/evaluation/export`

Why it matters:

- useful for offline review
- useful for management summaries
- useful for keeping weekly artifacts outside the UI

How to explain it:

> This makes the reporting layer portable. We can discuss it in the app and also move it into other internal workflows.

## What To Emphasize In Front Of The CEO

- this page is a management reporting surface, not only an engineering console
- it supports repeatable weekly accountability
- it shows whether the system is improving in a business-routine way

## What To Emphasize In Front Of MLOps

- it is driven by the weekly evaluation endpoint
- it supports latest-available week resolution
- it aligns with the same matured evaluation logic used elsewhere in the observatory

## Strong One-Liner For This Page

> Weekly Reports turns model evaluation into a repeatable operating cadence.
