# Mathematical Calculations Documentation

This document describes the statistical methods and formulas used in the Inventory Analytics Suite. It matches `client/src/lib/inventory-math.ts`.

Demand series are treated as **monthly periods**. Lead time is entered in days and converted with `DAYS_PER_PERIOD = 30`:

```
L = TRR_days / 30
```

Service level is a **cycle service level**: the probability that demand during one replenishment cycle does not exceed the buffer. It is not a fill rate and it is not a guarantee of zero stockouts.

---

## Table of Contents

1. [Demand Forecasting](#demand-forecasting)
2. [Normality Testing](#normality-testing)
3. [Forecast Accuracy (MASE)](#forecast-accuracy-mase)
4. [Buffer Calculation](#buffer-calculation)
5. [Reverse TRR Calculation](#reverse-trr-calculation)
6. [Monte Carlo Simulation](#monte-carlo-simulation)
7. [Statistical Functions](#statistical-functions)
8. [Validation and Edge Cases](#validation-and-edge-cases)
9. [References](#references)

---

## Demand Forecasting

### Sample mean (regular demand)

When the series passes the normality test, expected demand per period is the sample mean:

```
μ = (1/n) × Σ d_i
```

- `μ` = mean demand per period
- `n` = number of periods
- `d_i` = demand in period i

Sample standard deviation uses `n − 1`:

```
σ² = Σ (d_i − μ)² / (n − 1)
```

### Croston's method (intermittent demand)

When the series contains zeros, Croston's method forecasts demand **size** and the **interval** between nonzero demands separately.

**Step 1 — Separate events**

```
z_t = d_t  when d_t > 0
p_t = periods since the previous nonzero demand
```

On the first nonzero observation, size is initialized to that demand and the interval is initialized to the period index from the start of the series (`i + 1`).

If only one nonzero demand exists, the interval is taken as `n / 1`.
If every period is zero, the forecast is 0.

**Step 2 — Exponential smoothing**

```
z'_t = α × z_t + (1 − α) × z'_{t−1}
p'_t = α × p_t + (1 − α) × p'_{t−1}
```

Default `α = 0.15` (typical range for intermittent demand: 0.1–0.2).

**Step 3 — Croston level**

```
ŷ_Croston = z' / p'
```

### Syntetos–Boylan approximation (SBA)

Croston's estimator is positively biased. SBA applies:

```
ŷ_SBA = (1 − α/2) × (z' / p')
```

`ŷ_SBA` is the displayed intermittent forecast and the value used in MASE. The Monte Carlo buffer path uses the smoothed interval `p'` and the **empirical nonzero sizes**, not `ŷ_SBA`, as the demand generator.

---

## Normality Testing

### Anderson–Darling test

The app uses the Anderson–Darling test of normality with estimated mean and variance. The test is more sensitive to tail deviations than a Kolmogorov–Smirnov test.

**Step 1 — Sort**

```
x_(1) ≤ x_(2) ≤ … ≤ x_(n)
```

**Step 2 — Standardize and map through the standard normal CDF**

```
y_i = Φ( (x_(i) − μ) / σ )
```

**Step 3 — Statistic**

```
A² = −n − (1/n) × Σ_{i=1..n} [ (2i − 1) × (ln y_i + ln(1 − y_{n+1−i})) ]
```

**Step 4 — Stephens size correction (unknown mean and variance)**

```
A²* = A² × (1 + 0.75/n + 2.25/n²)
```

**Decision rule (as implemented)**

A p-value is computed from `A²*` using the D'Agostino / Stephens piecewise approximation.

- If `p > 0.05` → treat demand as normal → **Normal** buffer
- If `p ≤ 0.05` → treat demand as not normal → **Monte Carlo** buffer

`A²* = 0.787` is the approximate 5% critical value for this corrected statistic. The code uses the p-value form of the same 5% test.

**Small samples**

If `n < 5` or `σ ≈ 0`, the test is skipped and the Normal method is used. That default is a software fallback, not evidence that the series is Gaussian.

---

## Forecast Accuracy (MASE)

MASE here is a **level-accuracy** check, not a rolling one-step Croston MASE.

```
Forecast MAE = (1/n) × Σ |d_i − ŷ_SBA|
Naive MAE    = (1/(n−1)) × Σ |d_i − d_{i−1}|
MASE         = Forecast MAE / Naive MAE
```

`ŷ_SBA` is a single constant (the Croston/SBA level) compared to every period. The naive benchmark is the random-walk difference. On intermittent series the naive denominator is often large because of zero-to-spike jumps, so MASE can look optimistic.

### Display bands

| MASE    | Label     | Meaning                                      |
| ------- | --------- | -------------------------------------------- |
| < 0.5   | Excellent | Level beats the naive difference by a lot    |
| 0.5–0.8 | Good      | Level beats the naive difference             |
| 0.8–1.0 | Fair      | Level only slightly better than naive        |
| ≥ 1.0   | Poor      | Naive difference is as good or better        |

If MASE ≥ 1.0 and fewer than 48 periods were entered, the app warns that more history is preferred over tuning α.

Do not describe these bands as a validated out-of-sample forecast score.

---

## Buffer Calculation

### Normal method

Used when the Anderson–Darling p-value is greater than 0.05.

Lead time in periods: `L = TRR_days / 30`.

```
Base stock    = μ × L
Safety stock  = z_α × σ × √L
Total buffer  = μ × L + z_α × σ × √L
```

- `z_α` = inverse standard normal CDF at the cycle service level
- 95% → `z ≈ 1.645`
- 99% → `z ≈ 2.326`

Assumptions: constant lead time, independent period demand, cycle service level, no review-period add-on, no lead-time variability. This is the classic teaching model, not a fill-rate or variable-lead-time model.

For this path the app uses the sample mean `μ`, not the SBA forecast.

### Intermittent method (Monte Carlo)

Used when the Anderson–Darling p-value is ≤ 0.05.

1. Take Croston's smoothed interval `p'` and the list of observed nonzero demand sizes.
2. Run `N = 50,000` simulations of demand during `L` periods:
   - Draw inter-arrival times from an exponential distribution with mean `p'`
   - Each event that falls inside the lead-time window draws a size at random from the observed nonzero list
   - Record total demand in that window
3. Sort the simulated totals.
4. Let `q` be the service-level quantile (index `floor(α × N)`).

```
Base stock    = mean of simulated lead-time demand
Safety stock  = max(0, q − mean)
Total buffer  = q
```

Total buffer is the quantile. That is what meets the cycle service level under the simulated process.

If every historical period is zero, buffer is 0.

---

## Reverse TRR Calculation

Reverse TRR answers: **given the stock currently on the shelf, how long can replenishment take before that stock no longer meets the service level?**

It is not “days of supply” (`buffer / μ`) and it is not a promise of zero stockouts.

### Normal demand

Start from the full buffer equation, not safety stock alone:

```
B = μ × L + z_α × σ × √L
```

Let `y = √L`:

```
μ y² + (z_α σ) y − B = 0
```

Take the positive root:

```
y = [ −z_α σ + √( (z_α σ)² + 4 μ B ) ] / (2μ)
L = y²
```

Then convert to days:

```
TRR_days = L × 30
```

Capped at 730 days. If `μ ≈ 0` and `σ > 0`, this reduces to `L = (B / (z_α σ))²`. If both mean and variability are effectively zero, the buffer supports the cap.

The formula `L = (B / (z_α σ))²` by itself is **incorrect** when expected demand during the wait is nonzero. That version ignores `μL` and overstates the lead time the shelf can cover.

### Intermittent demand

The same question is answered by binary search on `L`. For each candidate lead time the Monte Carlo buffer is computed. The largest `L` whose required buffer is still ≤ current stock is the reverse TRR. Search tolerance is about 0.01 periods (~0.3 days). Result is capped at 730 days.

---

## Monte Carlo Simulation

The intermittent generator is a renewal process:

- Inter-arrival ~ Exponential(mean = Croston `p'`)
- Event size ~ discrete uniform draw from historical nonzero demands (bootstrap)
- Horizon = lead time in periods
- `N = 50,000` independent runs

The buffer is the service-level quantile of those totals. Safety stock is that quantile minus the simulated mean, floored at zero.

This path does **not** generate demand from `ŷ_SBA`. SBA is the displayed rate; the sim uses interval + empirical sizes.

---

## Statistical Functions

### Normal CDF

Hastings / Abramowitz–Stegun approximation of `Φ(z)` (see `normCdf` in `inventory-math.ts`).

### Inverse normal CDF

Acklam’s rational approximation (`normInv`). Used for `z_α`. More accurate than the older four-digit Abramowitz inverse.

### Exponential random draws

```
X = −mean × ln(1 − U),   U ~ Uniform(0,1)
```

Used for Monte Carlo inter-arrival times.

---

## Validation and Edge Cases

| Parameter        | Valid range | Notes                                      |
| ---------------- | ----------- | ------------------------------------------ |
| Demand data      | 1–48 values | Non-negative                               |
| Service level    | 50–99.99%   | Cycle service level                        |
| Lead time        | ≥ 0 days    | Converted to periods with 30 days/period   |
| Buffer (reverse) | > 0         | Current stock on the shelf                 |
| α (Croston)      | typically 0.15 | Exposed if the UI allows it             |
| Simulations      | 50,000      | Intermittent path only                     |

**Edge cases**

1. All zeros → buffer 0; reverse TRR at the cap.
2. Single point → `μ` equals that point, `σ = 0`, AD skipped.
3. `n < 5` → AD skipped, Normal method used.
4. Service level > 99% → large `z`; MC quantile sits far in the tail.
5. Periods are assumed monthly. Weekly demand pasted as if it were monthly will mis-scale `L`.

---

## References

1. Croston, J.D. (1972). Forecasting and Stock Control for Intermittent Demands. *Operational Research Quarterly*, 23(3), 289–303.
2. Syntetos, A.A. & Boylan, J.E. (2001). On the bias of intermittent demand estimates. *International Journal of Production Economics*, 71(1–3), 457–466.
3. Anderson, T.W. & Darling, D.A. (1952). Asymptotic Theory of Certain 'Goodness of Fit' Criteria Based on Stochastic Processes. *The Annals of Mathematical Statistics*, 23(2), 193–212.
4. Stephens, M.A. (1974). EDF Statistics for Goodness of Fit and Some Comparisons. *Journal of the American Statistical Association*, 69(347), 730–737.
5. Silver, E.A., Pyke, D.F. & Peterson, R. (1998). *Inventory Management and Production Planning and Scheduling*. Wiley.
6. Hyndman, R.J. & Koehler, A.B. (2006). Another look at measures of forecast accuracy. *International Journal of Forecasting*, 22(4), 679–688.
