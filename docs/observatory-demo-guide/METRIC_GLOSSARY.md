# Metric Glossary

This is the shared metric language behind the observatory.

## Matured Count

Definition:

- the number of forecast issuances that have reached a resolvable outcome and have been evaluated against real market data

Why it matters:

- it tells us how much evidence we have
- a high hit rate on 5 rows means less than a moderate hit rate on 200 rows

How to explain it:

> This is our sample size for real-world evaluation, not just how many forecasts we issued.

## Directional Hit Rate

Definition:

- how often the model correctly predicted the direction of movement from the issuance current rate to the realized rate

Why it matters:

- for many business decisions, direction matters more than exact magnitude
- if we can reliably say a currency is likely to weaken or strengthen, that can already be operationally useful

How to explain it:

> This tells us whether the model got the move right, even if it did not nail the exact final level.

Current UI heuristic:

- `55%+` is treated as a healthy directional edge

## MAE

Definition:

- mean absolute error
- average size of the miss, ignoring whether the miss was above or below the actual

Why it matters:

- it is easy to explain
- it tells us the typical error magnitude

How to explain it:

> If we are wrong, how wrong are we on average?

Current UI heuristic:

- below `0.05` is treated as a favorable quick-read signal in the current beta UI

## RMSE

Definition:

- root mean squared error
- similar to MAE, but larger misses are penalized more heavily

Why it matters:

- it helps expose instability and outlier misses

How to explain it:

> MAE tells us the typical miss. RMSE tells us whether some misses are much worse than the average.

## Bias

Definition:

- average signed error
- positive means the model tends to over-predict
- negative means the model tends to under-predict

Why it matters:

- a model can have a decent hit rate but still drift systematically high or low

How to explain it:

> Bias tells us whether our misses lean in one direction instead of cancelling out fairly.

## MAPE

Definition:

- mean absolute percentage error
- error size relative to the realized value

Why it matters:

- useful for comparing performance across pairs with different price levels

How to explain it:

> This normalizes the error into percentage terms so comparisons are easier across pairs.

## Quant MAE

Definition:

- the MAE of the quant-only baseline before sentiment adjustment

Why it matters:

- it gives us the baseline we are trying to beat

How to explain it:

> This shows how the raw quant model performed before the sentiment layer touched the forecast.

## Adjusted vs Quant MAE Delta

Definition:

- adjusted MAE minus quant-only MAE

Interpretation:

- negative is good
- positive is bad

Why it matters:

- it tells us whether sentiment improved the forecast or degraded it

How to explain it:

> If this number is negative, sentiment helped. If it is positive, the quant-only baseline would have been better.

## Sentiment Improvement Rate

Definition:

- the share of matured rows where the sentiment-adjusted forecast beat the quant-only baseline

Why it matters:

- it answers whether sentiment helps occasionally or consistently

How to explain it:

> This is the win rate of the sentiment layer against the quant-only forecast.

## Signed Error

Definition:

- predicted rate minus actual rate

Interpretation:

- positive: forecast was too high
- negative: forecast was too low

Why it matters:

- this powers bias analysis and the error distribution chart

## Absolute Error

Definition:

- absolute value of signed error

Why it matters:

- this is the cleanest row-level measure of how far off a forecast was

## APE

Definition:

- absolute percentage error at the individual row level

Why it matters:

- it makes row-level misses comparable in percentage terms
