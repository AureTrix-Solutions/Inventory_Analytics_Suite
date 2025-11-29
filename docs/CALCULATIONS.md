# Mathematical Calculations Documentation

This document describes the statistical methods and formulas used in the Inventory Analytics Suite.

## Table of Contents

1. [Demand Forecasting](#demand-forecasting)
2. [Normality Testing](#normality-testing)
3. [Buffer Calculation](#buffer-calculation)
4. [Reverse TRR Calculation](#reverse-trr-calculation)
5. [Monte Carlo Simulation](#monte-carlo-simulation)

---

## Demand Forecasting

### Simple Moving Average

For regular demand patterns, we use the arithmetic mean:

```
μ = (1/n) × Σ(d_i)
```

Where:
- `μ` = mean demand
- `n` = number of periods
- `d_i` = demand in period i

### Croston's Method

For intermittent demand (containing zero values), we use Croston's method, which separately forecasts:

1. **Demand size** (when demand occurs)
2. **Inter-arrival interval** (time between non-zero demands)

**Step 1: Separate non-zero demands**
```
z_t = demand values where d_t > 0
p_t = number of periods since last non-zero demand
```

**Step 2: Exponential smoothing for both series**
```
z'_t = α × z_t + (1 - α) × z'_{t-1}
p'_t = α × p_t + (1 - α) × p'_{t-1}
```

Where α = 0.15 (smoothing constant, industry standard)

**Step 3: Forecast**
```
ŷ = z' / p'
```

### Syntetos-Boylan Approximation (SBA)

Croston's method is known to be biased. We apply the SBA correction:

```
ŷ_SBA = (1 - α/2) × (z' / p')
```

This reduces the positive bias in Croston's original estimator.

---

## Normality Testing

### Anderson-Darling Test

We use the Anderson-Darling test to determine if demand follows a normal distribution. This test is more sensitive to deviations in the tails compared to other normality tests.

**Step 1: Sort the data**
```
x_(1) ≤ x_(2) ≤ ... ≤ x_(n)
```

**Step 2: Standardize**
```
y_i = Φ((x_(i) - x̄) / s)
```

Where:
- `Φ` = standard normal CDF
- `x̄` = sample mean
- `s` = sample standard deviation

**Step 3: Calculate the statistic**
```
A² = -n - (1/n) × Σ[(2i-1) × (ln(y_i) + ln(1 - y_{n+1-i}))]
```

**Step 4: Adjust for sample size**
```
A²* = A² × (1 + 0.75/n + 2.25/n²)
```

**Decision Rule:**
- If A²* < 0.787: Data is normally distributed (use Normal method)
- If A²* ≥ 0.787: Data is not normal (use Croston/Monte Carlo)

**Note:** For datasets with fewer than 5 data points, we skip the Anderson-Darling test and default to the Normal method, as small samples don't provide reliable normality testing.

---

## Buffer Calculation

### Normal Distribution Method

When demand is normally distributed:

**Step 1: Calculate demand statistics**
```
μ = mean demand per period
σ = standard deviation of demand
```

**Step 2: Calculate demand during lead time**
```
μ_L = μ × L
σ_L = σ × √L
```

Where `L` = lead time in periods

**Step 3: Calculate safety stock**
```
SS = z_α × σ_L
```

Where `z_α` = inverse normal CDF at service level α

**Example:**
- Service level = 95% → z_α = 1.645
- Service level = 99% → z_α = 2.326

### Intermittent Demand Method

When demand is intermittent (uses Croston's method):

**Step 1: Get Croston forecast**
```
ŷ = Croston SBA forecast (mean demand rate)
```

**Step 2: Calculate variance**

For intermittent demand, variance is estimated from non-zero demands:
```
σ² = variance of non-zero demand values
```

**Step 3: Calculate buffer**
```
Buffer = z_α × σ × √L + (ŷ × L × adjustment_factor)
```

The adjustment factor accounts for the probability of demand occurrence.

---

## Reverse TRR Calculation

The Reverse TRR (Time to Reliable Replenishment) calculator determines the maximum lead time that can be supported given a fixed buffer level.

### Formula Derivation

Starting from the buffer formula:
```
Buffer = z_α × σ × √L
```

Solving for L:
```
L = (Buffer / (z_α × σ))²
```

### Algorithm

**Step 1: Calculate demand statistics**
```
σ = standard deviation of demand
z_α = inverse normal CDF at service level
```

**Step 2: Solve for maximum lead time**
```
L_max = (Buffer / (z_α × σ))²
```

**Constraints:**
- Result is rounded down to whole periods
- Minimum value is 0
- Accounts for demand variability

---

## Monte Carlo Simulation

For demand patterns that don't fit normal or Croston models, we use Monte Carlo simulation.

### Process

**Step 1: Analyze historical demand**
```
- Calculate empirical distribution from historical data
- Identify demand frequency and magnitude patterns
```

**Step 2: Generate random scenarios**
```
For i = 1 to N (typically N = 50,000):
    - Simulate demand for lead time period
    - Sum total demand during lead time
    - Record result
```

**Step 3: Calculate buffer from simulation**
```
- Sort simulated demands
- Find value at (service level × 100)th percentile
- Buffer = Percentile value - Expected demand
```

### Implementation Details

The simulation uses:
- Bootstrap sampling from historical data
- Lead time demand aggregation
- Percentile-based safety stock calculation

---

## Statistical Functions

### Normal CDF (Cumulative Distribution Function)

Approximation using the error function:

```javascript
function normalCDF(x, mean = 0, stdDev = 1) {
    const z = (x - mean) / stdDev;
    return 0.5 * (1 + erf(z / Math.sqrt(2)));
}
```

### Inverse Normal CDF (Quantile Function)

Rational approximation (Abramowitz and Stegun):

```javascript
function normalInverseCDF(p) {
    // Uses rational approximation
    // Accurate to 4.5 × 10^-4
    const a = [
        -3.969683028665376e+01,
         2.209460984245205e+02,
        -2.759285104469687e+02,
         1.383577518672690e+02,
        -3.066479806614716e+01,
         2.506628277459239e+00
    ];
    // ... (full implementation in source code)
}
```

---

## Validation & Testing

### Input Validation

| Parameter | Valid Range | Notes |
|-----------|-------------|-------|
| Demand data | 1-48 values | Non-negative numbers |
| Service level | 50-99.99% | Expressed as decimal |
| Lead time | ≥ 0 | In same units as demand periods |
| Buffer (reverse) | > 0 | Must be positive |

### Edge Cases

1. **All zero demand**: Returns 0 buffer (no demand = no buffer needed)
2. **Single value**: Uses that value as mean, σ = 0
3. **High variability**: May recommend Monte Carlo
4. **Very high service level (>99%)**: z-scores can become very large

---

## References

1. Croston, J.D. (1972). "Forecasting and Stock Control for Intermittent Demands". Operational Research Quarterly, 23(3), 289-303.

2. Syntetos, A.A. & Boylan, J.E. (2001). "On the bias of intermittent demand estimates". International Journal of Production Economics, 71(1-3), 457-466.

3. Anderson, T.W. & Darling, D.A. (1952). "Asymptotic Theory of Certain 'Goodness of Fit' Criteria Based on Stochastic Processes". The Annals of Mathematical Statistics, 23(2), 193-212.

4. Silver, E.A., Pyke, D.F. & Peterson, R. (1998). Inventory Management and Production Planning and Scheduling. Wiley.
