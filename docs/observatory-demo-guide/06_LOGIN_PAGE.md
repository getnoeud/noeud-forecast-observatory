# Login Page

Route:

- `/login`

Purpose:

- protect the observatory as an internal beta tool using a simple shared-secret access flow

This page matters less for evaluation logic, but it matters for product posture.

## What It Communicates

- the observatory is internal-only
- access is gated
- this is not yet a full enterprise identity layer

Current auth model:

- shared secret login
- signed HTTP-only session cookie
- route protection before users reach the dashboard

Why this matters:

- appropriate for the current stage
- simple enough for internal velocity
- clear enough that the dashboard is not public-facing

How to explain it:

> For beta, we chose lightweight internal access control instead of overbuilding a full identity stack before the observatory itself proved useful.

## Visual Framing

The page positions the product as:

- Noeud Observatory
- internal use only
- focused on validating production forecasts against realized FX market data

Why that matters:

- even the entry point reinforces the evaluation mission of the product

## Best Use During The Demo

Only discuss this page briefly unless someone asks:

- whether this is public
- how access is controlled
- whether the frontend is already production-auth ready

## Strong One-Liner For This Page

> Login makes it clear that the observatory is an internal control surface, not a public dashboard.
