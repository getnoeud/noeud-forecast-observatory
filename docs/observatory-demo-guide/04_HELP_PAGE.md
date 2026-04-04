# Help Page

Route:

- `/help`

Purpose:

- explain the evaluation contract behind the observatory so users do not have to guess how the data appears or what the metrics mean

This page is especially useful when someone asks:

- when does a forecast become evaluable
- why is the dashboard empty for some periods
- what does a metric actually mean

## Evaluation Lifecycle Section

The help page explains the five-step evaluation flow:

1. daily forecast flow writes issuances into `predictions`
2. daily price ingestion updates `raw_price_data`
3. evaluation waits for the target date to mature
4. if target date is non-trading, the next available market day is used and stored as `resolved_actual_date`
5. matured rows are written into `forecast_evaluations`

Why this matters:

- it explains why evaluation is delayed by design
- it clarifies that the dashboard is based on realized market evidence

How to explain it:

> A forecast is not judged at issuance time. It is judged only after the market gives us a valid realized outcome.

## Metric Explanation Cards

The page explains four main concepts:

- directional hit rate
- MAE and RMSE
- bias
- sentiment lift

These are not meant to be exhaustive academic definitions. They are meant to make the dashboard readable.

## How To Read The Main Views

The help page already gives a quick map:

- rolling performance
- pair leaderboard
- forecast path
- sentiment
- audit trail

Why this matters:

- it makes the product easier to adopt across internal users

How to explain it:

> This page is the built-in orientation layer for anyone new to the observatory.

## Best Use During The Demo

Use this page if:

- the CEO asks how the evaluation pipeline works
- the MLOps team wants to confirm row maturity logic
- someone is confused about why a newly issued forecast is missing from evaluation views

## Strong One-Liner For This Page

> Help makes the observatory legible by explaining the rules behind the numbers.
