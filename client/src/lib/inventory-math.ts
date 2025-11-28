
// Statistical Functions

// Conversion constant: assumes monthly demand data with 30 days per period
export const DAYS_PER_PERIOD = 30;

// Maximum TRR in days for search bounds (2 years - a practical upper limit)
const MAX_TRR_DAYS = 730;

// Minimum sample size for reliable Anderson-Darling test
const MIN_SAMPLE_SIZE = 5;

// Normal CDF approximation
export function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) prob = 1 - prob;
  return prob;
}

// Normal inverse (Acklam's algorithm)
export function normInv(p: number): number {
  if (p < 0 || p > 1) return NaN;
  if (p === 0) return -Infinity;
  if (p === 1) return Infinity;

  const a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969;
  const a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
  const b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887;
  const b4 = 66.8013118877197, b5 = -13.2806815528857;
  const c1 = -7.78489400243029E-03, c2 = -0.322396458041136, c3 = -2.40075827716184;
  const c4 = -2.54973253934373, c5 = 4.37466414146497, c6 = 2.93816398269878;
  const d1 = 7.78469570904146E-03, d2 = 0.32246712907004, d3 = 2.445134137143, d4 = 3.75440866190742;

  const p_low = 0.02425, p_high = 1 - p_low;
  let q, r, retVal;

  if (p < p_low) {
      q = Math.sqrt(-2 * Math.log(p));
      retVal = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p <= p_high) {
      q = p - 0.5;
      r = q * q;
      retVal = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q / (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      retVal = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }

  return retVal;
}

export function expRandom(mean: number): number {
  return -mean * Math.log(1 - Math.random());
}

// Types
export interface CalculationResult {
  predictable: boolean;
  baseStock: number;
  safetyStock: number;
  totalBuffer: number;
  mase: number;
  forecast: number;
  std: number;
  pValue: number;
  method: 'Normal' | 'Monte Carlo';
  explanation?: string;
  demandStats?: {
    avg: number;
    sum: number;
    count: number;
  };
}

export interface ReverseCalculationResult {
  maxTRR: number;
  forecast: number;
  std: number;
  predictable: boolean;
  explanation: string;
  pValue: number;
}

// Helper: Croston's Method with SBA correction
// Returns { smoothedSize, smoothedInterval, nonZero, forecast }
function computeCroston(demands: number[], alpha: number) {
  const n = demands.length;
  const nonZero: number[] = [];
  let lastDemandIndex = -1;
  let smoothedSize = 0;
  let smoothedInterval = 1;
  let firstDemandIndex = -1;

  for (let i = 0; i < n; i++) {
      if (demands[i] > 0) {
          nonZero.push(demands[i]);
          
          if (firstDemandIndex === -1) {
              firstDemandIndex = i;
              smoothedSize = demands[i];
              smoothedInterval = i + 1;
              lastDemandIndex = i;
          } else {
              const interval = i - lastDemandIndex;
              smoothedInterval = alpha * interval + (1 - alpha) * smoothedInterval;
              smoothedSize = alpha * demands[i] + (1 - alpha) * smoothedSize;
              lastDemandIndex = i;
          }
      }
  }

  const nonZeroCount = nonZero.length;
  
  if (nonZeroCount === 0) {
      smoothedSize = 0;
      smoothedInterval = n > 0 ? n : 1;
  } else if (nonZeroCount === 1) {
      smoothedInterval = n / nonZeroCount;
  }

  const crostonForecast = smoothedInterval > 0 ? smoothedSize / smoothedInterval : 0;
  const forecast = crostonForecast * (1 - alpha / 2);

  return { smoothedSize, smoothedInterval, nonZero, forecast };
}

// Helper: Anderson-Darling normality test
// Returns { predictable, pValue }
function andersonDarlingTest(demands: number[], avg: number, std: number): { predictable: boolean; pValue: number } {
  const n = demands.length;
  
  // For small samples or zero variance, default to predictable (normal method)
  if (n < MIN_SAMPLE_SIZE || std < 1e-10) {
      return { predictable: true, pValue: 1 };
  }

  const xAsc = [...demands].sort((a, b) => a - b);
  const xDesc = [...demands].sort((a, b) => b - a);
  let sumS = 0;
  
  for (let i = 1; i <= n; i++) {
      const zAsc = (xAsc[i-1] - avg) / std;
      const fAsc = normCdf(zAsc);
      const lnF = Math.log(Math.max(fAsc, 1e-10)); 
      
      const zDesc = (xDesc[i-1] - avg) / std;
      const fDesc = normCdf(zDesc);
      const ln1F = Math.log(Math.max(1 - fDesc, 1e-10));
      
      sumS += (2 * i - 1) * (lnF + ln1F);
  }
  
  const a2 = -n - (1 / n) * sumS;
  const aStar = a2 * (1 + 0.75 / n + 2.25 / Math.pow(n, 2));

  let pValue;
  if (aStar < 0.2) {
      pValue = 1 - Math.exp(-13.436 + 101.14 * aStar - 223.73 * Math.pow(aStar, 2));
  } else if (aStar < 0.34) {
      pValue = 1 - Math.exp(-8.318 + 42.796 * aStar - 59.938 * Math.pow(aStar, 2));
  } else if (aStar < 0.6) {
      pValue = Math.exp(0.9177 - 4.279 * aStar - 1.38 * Math.pow(aStar, 2));
  } else {
      pValue = Math.exp(1.2937 - 5.709 * aStar + 0.0186 * Math.pow(aStar, 2));
  }

  // Clamp pValue to valid range
  pValue = Math.max(0, Math.min(1, pValue));
  
  const predictable = pValue > 0.05 || isNaN(pValue);
  return { predictable, pValue };
}

// Buffer Calculation Logic
export function calculateBuffer(
  demands: number[],
  serviceLevel: number,
  trrDays: number,
  alpha: number,
  iterations: number = 50000
): CalculationResult {
  // Input validation
  if (!demands || demands.length === 0) {
      return {
          predictable: true,
          baseStock: 0,
          safetyStock: 0,
          totalBuffer: 0,
          mase: 0,
          forecast: 0,
          std: 0,
          pValue: 1,
          method: 'Normal',
          explanation: 'No demand data provided.',
          demandStats: { avg: 0, sum: 0, count: 0 }
      };
  }

  const n = demands.length;
  
  // Convert TRR from days to periods (months)
  const trrPeriods = trrDays / DAYS_PER_PERIOD;
  
  // Basic stats
  const sum = demands.reduce((a, b) => a + b, 0);
  const avg = sum / n;
  const sumSq = demands.reduce((a, x) => a + Math.pow(x - avg, 2), 0);
  const std = n > 1 ? Math.sqrt(sumSq / (n - 1)) : 0;

  // Croston with SBA
  const { smoothedInterval, nonZero, forecast } = computeCroston(demands, alpha);
  const nonZeroCount = nonZero.length;

  // MASE (Mean Absolute Scaled Error)
  const forecastMae = demands.reduce((a, x) => a + Math.abs(x - forecast), 0) / n;
  const diffs = [];
  for (let i = 1; i < n; i++) {
      diffs.push(Math.abs(demands[i] - demands[i - 1]));
  }
  const naiveMae = diffs.length > 0 ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0;
  const mase = naiveMae > 0 ? forecastMae / naiveMae : 0;

  // Anderson-Darling normality test
  const { predictable, pValue } = andersonDarlingTest(demands, avg, std);

  // Handle service level - keep original value but guard edge cases
  const p = Math.min(0.9999, Math.max(0.5, serviceLevel / 100));
  const z = normInv(p);

  // Base stock = forecast per period × number of periods in TRR
  const baseStock = forecast * trrPeriods;
  let safetyStock = 0;
  let method: 'Normal' | 'Monte Carlo' = 'Normal';

  if (predictable) {
      // Safety stock = z × std × √(periods in TRR)
      safetyStock = z * std * Math.sqrt(trrPeriods);
  } else {
      method = 'Monte Carlo';
      if (nonZeroCount === 0) {
          safetyStock = 0;
      } else {
          const numSims = iterations;
          const totals: number[] = [];
          let simMeanAcc = 0;
          
          for (let sim = 0; sim < numSims; sim++) {
              let time = 0;
              let totalDemand = 0;
              // Simulation runs in periods (months), comparing to trrPeriods
              while (time < trrPeriods) {
                  time += expRandom(smoothedInterval);
                  if (time < trrPeriods) {
                      const sizeIndex = Math.floor(Math.random() * nonZeroCount);
                      totalDemand += nonZero[sizeIndex];
                  }
              }
              totals.push(totalDemand);
              simMeanAcc += totalDemand;
          }
          
          totals.sort((a, b) => a - b);
          // Clamp quantile index to valid range
          const quantileIndex = Math.min(Math.floor(p * numSims), numSims - 1);
          const quantile = totals[quantileIndex];
          const simMean = simMeanAcc / numSims;
          safetyStock = Math.max(0, quantile - simMean);
      }
  }

  return {
    predictable,
    baseStock,
    safetyStock,
    totalBuffer: baseStock + safetyStock,
    mase,
    forecast,
    std,
    pValue,
    method,
    demandStats: {
        avg, sum, count: n
    }
  };
}

// Reverse Calculation Logic
export function calculateReverseTRR(
    demands: number[],
    targetBuffer: number,
    serviceLevel: number,
    alpha: number,
    iterations: number = 50000
): ReverseCalculationResult {
    // Input validation
    if (!demands || demands.length === 0) {
        return {
            maxTRR: MAX_TRR_DAYS,
            forecast: 0,
            std: 0,
            predictable: true,
            explanation: 'No demand data - buffer supports maximum TRR.',
            pValue: 1
        };
    }

    const n = demands.length;
    const sum = demands.reduce((a, b) => a + b, 0);
    const avg = sum / n;
    const sumSq = demands.reduce((a, x) => a + Math.pow(x - avg, 2), 0);
    const std = n > 1 ? Math.sqrt(sumSq / (n - 1)) : 0;

    // Croston with SBA
    const { smoothedInterval, nonZero, forecast } = computeCroston(demands, alpha);

    // Anderson-Darling normality test
    const { predictable, pValue } = andersonDarlingTest(demands, avg, std);
    
    // Handle service level - keep original value but guard edge cases
    const p = Math.min(0.9999, Math.max(0.5, serviceLevel / 100));
    const z = normInv(p);

    // Maximum TRR in periods
    const maxTrrPeriods = MAX_TRR_DAYS / DAYS_PER_PERIOD;

    let maxTRRPeriods = 0;
    let explanation = '';

    if (predictable) {
        // Solve: Buffer = forecast × TRR_periods + z × std × √TRR_periods
        // Let y = √TRR_periods, then: forecast × y² + z × std × y - Buffer = 0
        
        const a = forecast;
        const b = z * std;
        const c = -targetBuffer;
        
        // Handle edge case where forecast is 0 or very small
        if (a < 1e-10) {
            if (b > 0 && targetBuffer > 0) {
                // Buffer = z × std × √TRR => √TRR = Buffer / (z × std)
                const y = targetBuffer / b;
                maxTRRPeriods = y * y;
            } else {
                // Effectively unlimited - use max
                maxTRRPeriods = maxTrrPeriods;
            }
            explanation = `Low/zero demand forecast - buffer supports extended TRR.`;
        } else {
            const discriminant = b * b - 4 * a * c;
            
            if (discriminant < 0) {
                explanation = 'Demand too high/variable for this buffer.';
                maxTRRPeriods = 0;
            } else {
                // Positive root: y = (-b + √discriminant) / (2a)
                const y = (-b + Math.sqrt(discriminant)) / (2 * a);
                
                if (y > 0) {
                    maxTRRPeriods = y * y;
                } else {
                    const y2 = (-b - Math.sqrt(discriminant)) / (2 * a);
                    maxTRRPeriods = y2 > 0 ? y2 * y2 : 0;
                }
                
                explanation = `Normal distribution model used (p=${pValue.toFixed(3)}).`;
            }
        }
        
        // Cap at maximum
        maxTRRPeriods = Math.min(maxTRRPeriods, maxTrrPeriods);
        
    } else {
        // Intermittent demand: use binary search with Monte Carlo
        // Search in periods, then convert result to days
        let low = 0.01, high = maxTrrPeriods, bestTRR = 0;
        const tolerance = 0.01; // ~0.3 days precision
        
        const simulateServiceLevel = (trrPeriods: number) => {
            if (nonZero.length === 0) return true;
            const sims = iterations;
            const totals: number[] = [];
            
            for (let i = 0; i < sims; i++) {
                let time = 0, demand = 0;
                while (time < trrPeriods) {
                    time += expRandom(smoothedInterval);
                    if (time < trrPeriods) demand += nonZero[Math.floor(Math.random() * nonZero.length)];
                }
                totals.push(demand);
            }
            totals.sort((a, b) => a - b);
            // Clamp quantile index
            const quantileIndex = Math.min(Math.floor(p * sims), sims - 1);
            const quantile = totals[quantileIndex];
            return quantile <= targetBuffer; 
        };

        for (let iter = 0; iter < 40; iter++) {
            const mid = (low + high) / 2;
            if (simulateServiceLevel(mid)) {
                bestTRR = mid;
                low = mid;
            } else {
                high = mid;
            }
            if (high - low < tolerance) break;
        }
        maxTRRPeriods = bestTRR;
        explanation = 'Intermittent demand model (Monte Carlo simulation).';
    }

    // Convert result from periods to days
    const maxTRRDays = maxTRRPeriods * DAYS_PER_PERIOD;

    return {
        maxTRR: maxTRRDays,
        forecast,
        std,
        predictable,
        explanation,
        pValue
    };
}
