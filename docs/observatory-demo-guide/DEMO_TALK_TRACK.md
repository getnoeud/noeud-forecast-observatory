# Demo Talk Track

Use this as the high-level narrative while presenting.

## Opening Frame

Suggested opening:

> We are not only building forecasting models. We are building decision systems that can help African businesses protect margin and survive periods of currency volatility. The observatory is the layer that tells us whether our forecasting system is actually earning trust in the real world.

Then make the key distinction:

> A forecast is only a claim until the market resolves it. The observatory exists to evaluate those claims after they mature.

## What Problem This Solves

Without an observatory, a team can easily say:

- "the model predicted something"
- "the output looked reasonable"
- "the chart was impressive"

But that is not enough for production confidence.

The observatory gives us:

- a historical audit trail
- pair-by-pair accountability
- row-level evidence
- a way to compare quant-only versus sentiment-adjusted behavior
- a weekly reporting surface for team review

## Core Story For The CEO

Suggested phrasing:

> This dashboard helps us turn model development into operating discipline. It tells us where our system is dependable, where it is still fragile, and whether our sentiment layer is genuinely improving decision quality. That matters because our goal is not to produce interesting forecasts. Our goal is to help businesses make safer decisions under volatile market conditions.

## Core Story For The MLOps Team

Suggested phrasing:

> This is our real-world evaluation layer. It sits after inference and after price ingestion. Once a forecast matures, we compare the stored prediction against realized market data and compute metrics that are stable enough for ongoing operational review.

## Demo Sequence

## 1. Overview

Say:

> This is the management layer. It gives us the current state of model behavior across pairs and over a chosen evaluation window.

Focus on:

- KPI cards
- rolling performance
- pair-level charts
- leaderboard tables

## 2. Pair Review

Say:

> This is where we stop thinking in aggregates and inspect one pair in depth. If Overview tells us where to look, Pair Review tells us why.

Focus on:

- pair KPIs
- predicted versus actual
- error distribution
- forecast path
- sentiment tab
- audit trail

## 3. Weekly Reports

Say:

> This is our operating review surface. It compresses the same evaluation logic into a weekly frame that is easier to discuss, export, and compare.

Focus on:

- report week
- summary cards
- quant delta
- pair breakdown table
- CSV export

## 4. Help

Say:

> This page explains the evaluation contract behind the dashboard so nobody has to guess what the metrics mean or when rows appear.

## Questions You Should Be Ready For

### Why do some forecasts show up in one place but not another?

Answer:

Fresh forecast issuances can appear in forecast history immediately, but they only appear in evaluation views after the target date matures and actual market data is available.

### Why is 7 days the default?

Answer:

Because it is the most practical beta horizon for frequent operational review. The system is horizon-aware, but 7-day forecasting is the live first surface.

### What does "sentiment improvement" really mean?

Answer:

It means the sentiment-adjusted forecast beat the quant-only baseline on realized absolute error. If the adjusted forecast is closer to the actual outcome, sentiment added value on that row.

### Why should anyone trust this?

Answer:

Because the system preserves each forecast issuance, waits for the market to resolve it, then measures actual realized performance rather than relying on subjective interpretation.

## Strong Closing

Suggested close:

> The observatory gives us something every serious ML system needs: not just outputs, but evidence. It is how we move from model excitement to model accountability.
