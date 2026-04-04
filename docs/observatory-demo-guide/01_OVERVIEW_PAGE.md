# Overview Page

Route:

- `/`

Purpose:

- provide a fast operating summary of real-world forecast performance across the selected window

This is the best page to start with because it answers the first management questions:

- how much evaluated evidence do we have
- are we directionally useful
- how large are our misses
- is sentiment helping
- which pairs look strongest or weakest

## What This Page Is Really For

The overview page is the control tower for matured evaluations.

It is not showing all forecasts ever issued. It is showing forecasts that:

- were issued earlier
- reached their target date
- had actual market data available
- were converted into evaluation rows

That distinction is important because it makes the page credible.

Suggested phrasing:

> This page is our real-world scoreboard. It only uses forecasts that the market has already judged.

## Filters At The Top

The overview page supports:

- currency pair filter
- horizon filter
- evaluation date window

Current defaults:

- pair: `ALL`
- horizon: `7`
- window: last `60` days
- chart mode: error

Why this matters:

- you can move between portfolio-level and pair-level thinking
- you can compare short-horizon behavior versus longer horizons
- you can isolate recent periods if market regime changed

Suggested phrasing:

> We can narrow this to a pair, a horizon, and a time window so we are not forced into a one-size-fits-all interpretation.

## KPI Cards

## 1. Matured Forecasts

What it shows:

- the number of evaluation rows in the current filter window

Why it matters:

- it is the evidence base behind every other metric
- it keeps us from overreacting to tiny sample sizes

How to explain it:

> Before judging model quality, we first need to know how much resolved history we are judging it on.

Supporting details on the card:

- bias
- MAPE

Good follow-up point:

> A strong metric on a tiny sample should be treated carefully. This card tells us how much signal we really have.

## 2. Directional Hit Rate

What it shows:

- how often the model got the direction right

Why it matters:

- for hedging, timing, pricing, and procurement decisions, direction can be as important as exact level

UI interpretation:

- `55%+` is treated as "model has directional edge"
- below that is treated as needing investigation

How to explain it:

> This is the quickest answer to whether the model is useful in practice. If it keeps getting direction right, it may still support real decisions even if exact levels are imperfect.

## 3. Mean Absolute Error

What it shows:

- average miss size

Why it matters:

- it translates model performance into error magnitude

Supporting detail on the card:

- RMSE

How to explain it:

> This tells us the typical miss, while RMSE helps reveal whether a few bad misses are stretching the risk profile.

## 4. Sentiment Improvement

What it shows:

- how often the sentiment-adjusted forecast beat the quant-only baseline

Supporting detail:

- delta equals adjusted MAE minus quant-only MAE
- negative delta is good

Why it matters:

- sentiment should justify itself
- this prevents us from treating the sentiment layer as automatically beneficial

How to explain it:

> We are not assuming sentiment helps. We measure whether it actually moved the forecast closer to reality.

## Rolling Performance Chart

Chart title:

- `Rolling Performance`

Modes:

- `Error`
- `Hit Rate`

Time windows:

- `90 days`
- `30 days`
- `7 days`

### Error Mode

Shows:

- daily MAE
- daily RMSE
- grouped by resolved actual date

Why it matters:

- helps you see whether performance is tightening, drifting, or becoming unstable over time

How to explain it:

> This is the trend view. Instead of just one average number, it shows whether the model is getting steadier or noisier over time.

Good interpretation patterns:

- MAE and RMSE both trending down: quality is improving
- RMSE much higher than MAE: outlier misses exist
- sudden jump in both: possible market regime shift or model weakness

### Hit Rate Mode

Shows:

- daily directional hit rate

Why it matters:

- direction may remain healthy even when error magnitudes become noisier

How to explain it:

> Sometimes the model still reads direction correctly even when exact pricing gets harder. This view helps us separate those two stories.

## Insight Charts

## 1. Evaluation Share by Pair

What it shows:

- which pairs contribute the most matured rows

Why it matters:

- some pairs may look better simply because they have more history
- it tells the team where the evidence density is coming from

How to explain it:

> This tells us how the evaluation sample is distributed across pairs, so we know where the dashboard is most informed versus still sparse.

## 2. Directional Accuracy by Pair

What it shows:

- hit rate per pair

Why it matters:

- useful for deciding where the system is more dependable

How to explain it:

> This is where we stop treating the portfolio as one lump and look at which currency relationships the model understands better.

## 3. Sentiment Lift by Pair

What it shows:

- sentiment win rate by pair

Why it matters:

- sentiment may help some pairs more than others

How to explain it:

> Sentiment is not equally valuable everywhere. This view shows where it is actually earning its place.

## Table Views

The overview table has three tabs:

- `Pair Leaderboard`
- `Direction Analysis`
- `Sentiment Impact`

## Pair Leaderboard

Best for:

- a general ranking conversation

Fields include:

- matured count
- hit rate
- MAE
- RMSE
- bias
- MAPE
- average sentiment adjustment

How to explain it:

> This is the all-around scorecard. It balances evidence volume, directional usefulness, and error quality in one place.

## Direction Analysis

Best for:

- explaining model behavior rather than just rank

Fields emphasize:

- hit rate
- signal count
- bias label
- RMSE
- MAPE

How to explain it:

> This view is helpful when we want to know not just how a pair scored, but how it tends to fail or succeed.

## Sentiment Impact

Best for:

- auditing whether the adjustment layer deserves trust

Fields emphasize:

- adjusted MAE
- quant MAE
- delta
- win rate
- average adjustment

How to explain it:

> This view isolates the sentiment layer and asks a simple question: did it improve realized forecast quality or not?

## What To Emphasize In Front Of The CEO

- This page is about trust, not vanity metrics.
- It shows whether the system is becoming decision-worthy.
- It helps us understand where we can be confident and where we should be cautious.

## What To Emphasize In Front Of MLOps

- The frontend is reading backend evaluation endpoints, not raw DB tables.
- The window is filterable by pair, horizon, and dates.
- The metrics are built on persisted matured evaluation rows.

## Strong One-Liner For This Page

> Overview tells us whether the forecasting system is earning operational trust across the portfolio.
