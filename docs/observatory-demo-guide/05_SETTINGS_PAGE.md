# Settings Page

Route:

- `/settings`

Purpose:

- expose a lightweight beta preferences surface without pretending the observatory already has a full settings model

This page is intentionally small.

That is a good thing.

It signals product discipline:

- the team built only what was useful now
- full preference complexity is intentionally deferred

## Theme And Layout

What it communicates:

- theme switching exists in the header
- sidebar collapse is remembered locally
- pair review remembers the last pair and horizon you opened

Why it matters:

- improves internal usability for repeat reviewers
- makes the dashboard feel operational rather than purely experimental

How to explain it:

> We kept the settings light, but we still covered the quality-of-life features that matter for repeated internal use.

## Current Beta Defaults

The page explicitly calls out:

- default live horizon: `7 days`
- evaluation window preset: last `60 days`
- reports page default: weekly export flow

Why it matters:

- these defaults encode product intent
- the observatory is live-first on 7-day performance
- longer horizons remain supported but are more clearly in evaluation mode

How to explain it:

> The defaults reflect the current beta strategy: keep the live focus on the most operationally useful horizon while preserving horizon-aware design.

## Best Use During The Demo

You do not need to spend much time here unless someone asks:

- why 7-day is the default
- whether the product remembers user context
- whether this is meant to be an internal daily-use tool

## Strong One-Liner For This Page

> Settings shows that the observatory is intentionally lightweight, opinionated, and built for internal operational use.
