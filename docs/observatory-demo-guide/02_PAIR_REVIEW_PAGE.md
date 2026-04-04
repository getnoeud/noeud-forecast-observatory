# Pair Review Page

Route:

- `/pairs/[pair]`

Purpose:

- inspect one currency pair in depth across evaluation outcomes, raw forecast issuances, sentiment records, and audit-level rows

If Overview tells you where to look, Pair Review tells you why.

This is the most important page for technical credibility because it shows:

- aggregate pair KPIs
- chart-level behavior
- issuance-level behavior
- sentiment-level evidence
- row-level auditability

## Header Controls

The page lets you switch:

- currency pair
- horizon

Current supported choices visible in the UI:

- `7 days`
- `14 days`
- `30 days`

This page also remembers the last pair/horizon you opened and uses that for the sidebar shortcut.

Why that matters:

- it makes repeat review faster for the team

## Top KPI Cards

## 1. Matured Rows

What it shows:

- number of evaluation rows for the selected pair and horizon

Why it matters:

- keeps the discussion honest about sample size

## 2. Hit Rate

What it shows:

- percentage of matured rows where direction was correct

Why it matters:

- this is usually the first pair-level decision metric

UI behavior:

- progress bar
- upward signal if `>= 55%`
- downward signal if below

## 3. MAE

What it shows:

- average absolute error for that pair

Why it matters:

- tells us typical miss size for that specific pair rather than the whole portfolio

UI behavior:

- favorable quick-read if below `0.05`

## 4. Sentiment Wins

What it shows:

- share of rows where sentiment-adjusted beat quant-only

Why it matters:

- reveals whether the sentiment layer helps this specific pair

UI behavior:

- positive quick-read if above `50%`

## Bias Badge

The page also shows:

- bias
- a status badge indicating whether the pair appears to have directional edge

Why this matters:

- a pair may hit direction often but still systematically overshoot or undershoot price levels

How to explain it:

> Bias helps us catch structural leaning, not just hit-or-miss outcomes.

## Tabs On This Page

- `Charts`
- `Forecast Path`
- `Sentiment`
- `Audit Trail`

## Charts Tab

This tab answers:

- how close were adjusted forecasts to actual outcomes
- whether misses are centered or lopsided

### Predicted vs Actual

What it shows:

- actual rate
- adjusted forecast
- quant forecast

Plotted by:

- resolved actual date

Why it matters:

- gives an intuitive visual comparison between realized market outcomes and both forecast variants

How to explain it:

> The actual line is the market reality. The adjusted and quant lines show how close our two forecast versions came to that reality.

Good interpretation patterns:

- adjusted line consistently closer to actual than quant line: sentiment is helping
- both lines close to actual: strong pair behavior
- both lines drifting away: pair likely needs model attention
- quant line closer than adjusted: sentiment is harming quality for that period

### Error Distribution

What it shows:

- histogram of signed errors

Interpretation:

- positive signed error means we over-predicted
- negative signed error means we under-predicted

Why it matters:

- shows whether errors are centered and balanced or skewed to one side

How to explain it:

> This tells us whether misses are random around the truth or whether the model tends to lean too high or too low.

Good interpretation patterns:

- centered around zero: good calibration tendency
- mostly positive: systematic over-prediction
- mostly negative: systematic under-prediction
- very wide spread: unstable pair behavior

## Forecast Path Tab

This tab is very important because it complements matured evaluation with live issuance behavior.

### Latest Forecast Path

What it shows:

- day-by-day forecast steps from the most recent stored issuance that includes daily path data
- current rate at issuance
- predicted path
- confidence lower bound
- confidence upper bound

Why it matters:

- shows how the model thinks the move unfolds over the horizon, not only where it lands

How to explain it:

> This is the shape of the forecast, not just the endpoint. It helps us see whether the forecast implies a gradual move, a sharp move, or a noisy path.

### Prediction vs Current Rate Across Issuances

What it shows:

- current rate
- day-1 forecast
- final forecast

Across:

- recent forecast dates

Why it matters:

- helps spot shifting model conviction across recent runs

How to explain it:

> This lets us compare how the model has been positioning itself across recent issuance dates, not just in one isolated run.

### Recent Forecast Issuances Table

Fields include:

- forecast date
- target date
- current
- day 1
- final
- sentiment score
- release

Why it matters:

- this is the operational history of what the system actually produced

How to explain it:

> This is the issuance ledger. It shows the concrete forecast objects the backend stored over time.

## Sentiment Tab

This tab is where the adjustment layer becomes inspectable instead of mysterious.

### Sentiment Overlay

What it shows:

- sentiment score
- size of sentiment adjustment
- realized absolute error

Aligned by:

- forecast date

Why it matters:

- lets you compare sentiment strength with actual forecast quality

How to explain it:

> This helps us see whether stronger sentiment signals were associated with helpful adjustments or whether they simply increased movement without improving outcomes.

Important nuance:

- adjustment size is shown as absolute magnitude
- a large adjustment is not automatically good
- it only matters if realized error improves

### Sentiment Records

What it shows:

- stored sentiment rows for the pair
- score
- direction
- top positive and negative factors
- review dialog with rationale, narrative, uncertainties, retrieval sources, citations, and sanitized LLM audit traces

Why it matters:

- makes the sentiment layer transparent
- gives the team a way to inspect why a score existed

How to explain it:

> We are not treating sentiment as a black box. We can inspect the score, the narrative behind it, and the safe audit trail of the LLM interaction.

Important safety point:

- prompts are intentionally redacted from API responses

Why that matters:

- we preserve auditability without exposing internal prompt logic in the UI

## Audit Trail Tab

This is the strongest governance page in the product.

Fields include:

- forecast date
- target date
- predicted
- actual
- absolute error
- APE
- direction hit or miss
- whether sentiment beat quant
- model identifier

Why it matters:

- every forecast issuance remains reviewable after the market resolves it
- this is what makes the system defensible in front of technical scrutiny

How to explain it:

> This is the row-level proof layer. If anyone asks what exactly happened on a specific forecast, we can answer with stored evidence.

## What To Emphasize In Front Of The CEO

- This page shows that the system is inspectable, not magical.
- It helps us identify where trust is deserved pair by pair.
- It shows that Noeud is building operating intelligence, not only predictions.

## What To Emphasize In Front Of MLOps

- This page joins three backend views conceptually: evaluation history, prediction history, and sentiment history.
- The evaluation tab is matured-only, while forecast path reflects raw issuance history.
- The audit trail is row-level and suitable for debugging, validation, and release review.

## Strong One-Liner For This Page

> Pair Review is where model performance stops being abstract and becomes explainable.
