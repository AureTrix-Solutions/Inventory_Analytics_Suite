
// Statistical Functions

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
// Returns { smoothedSize, smoothedInterval, nonZero }
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
              // First non-zero demand: initialize with observed gap from start
              firstDemandIndex = i;
              smoothedSize = demands[i];
              // Use actual gap from start (i+1 periods until first demand)
              // This fixes the bias when first demand appears late
              smoothedInterval = i + 1;
              lastDemandIndex = i;
          } else {
              // Subsequent demands: apply exponential smoothing
              const interval = i - lastDemandIndex;
              smoothedInterval = alpha * interval + (1 - alpha) * smoothedInterval;
              smoothedSize = alpha * demands[i] + (1 - alpha) * smoothedSize;
              lastDemandIndex = i;
          }
      }
  }

  const nonZeroCount = nonZero.length;
  
  // Handle edge cases
  if (nonZeroCount === 0) {
      // No demand at all
      smoothedSize = 0;
      smoothedInterval = n; // Use full period as interval
  } else if (nonZeroCount === 1) {
      // Single demand point: use average interval (total periods / count)
      // This provides a more robust estimate than just the gap to first demand
      smoothedInterval = n / nonZeroCount;
  }

  // Croston forecast with SBA (Syntetos-Boylan Approximation) correction
  const crostonForecast = smoothedInterval > 0 ? smoothedSize / smoothedInterval : 0;
  const forecast = crostonForecast * (1 - alpha / 2);

  return { smoothedSize, smoothedInterval, nonZero, forecast };
}

// Buffer Calculation Logic
export function calculateBuffer(
  demands: number[],
  serviceLevel: number,
  trr: number,
  alpha: number,
  iterations: number = 50000
): CalculationResult {
  const n = demands.length;
  
  // Basic stats
  const sum = demands.reduce((a, b) => a + b, 0);
  const avg = sum / n;
  const sumSq = demands.reduce((a, x) => a + Math.pow(x - avg, 2), 0);
  const std = n > 1 ? Math.sqrt(sumSq / (n - 1)) : 0;

  // Croston with SBA (using corrected initialization)
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
  const xAsc = [...demands].sort((a, b) => a - b);
  const xDesc = [...demands].sort((a, b) => b - a);
  const sList = [];
  for (let i = 1; i <= n; i++) {
      const zAsc = (xAsc[i-1] - avg) / (std || 1);
      const fAsc = normCdf(zAsc);
      const lnF = Math.log(Math.max(fAsc, 1e-10)); 
      
      const zDesc = (xDesc[i-1] - avg) / (std || 1);
      const fDesc = normCdf(zDesc);
      const ln1F = Math.log(Math.max(1 - fDesc, 1e-10));
      
      const s = (2 * i - 1) * (lnF + ln1F);
      sList.push(s);
  }
  const sumS = sList.reduce((a, b) => a + b, 0);
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

  const predictable = pValue > 0.05 || isNaN(pValue);
  const p = serviceLevel / 100;
  const z = normInv(p);

  const baseStock = forecast * trr;
  let safetyStock = 0;
  let method: 'Normal' | 'Monte Carlo' = 'Normal';

  if (predictable) {
      safetyStock = z * std * Math.sqrt(trr);
  } else {
      method = 'Monte Carlo';
      if (nonZeroCount === 0) {
          safetyStock = 0;
      } else {
          const numSims = iterations;
          const totals = [];
          let simMeanAcc = 0;
          
          for (let sim = 0; sim < numSims; sim++) {
              let time = 0;
              let totalDemand = 0;
              while (time < trr) {
                  time += expRandom(smoothedInterval);
                  if (time < trr) {
                      const sizeIndex = Math.floor(Math.random() * nonZeroCount);
                      totalDemand += nonZero[sizeIndex];
                  }
              }
              totals.push(totalDemand);
              simMeanAcc += totalDemand;
          }
          
          totals.sort((a, b) => a - b);
          const quantileIndex = Math.floor(p * numSims);
          const quantile = totals[Math.min(quantileIndex, numSims - 1)];
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
    const n = demands.length;
    const avg = demands.reduce((a, b) => a + b, 0) / n;
    const sumSq = demands.reduce((a, x) => a + Math.pow(x - avg, 2), 0);
    const std = n > 1 ? Math.sqrt(sumSq / (n - 1)) : 0;

    // Croston with SBA (using corrected initialization)
    const { smoothedInterval, nonZero, forecast } = computeCroston(demands, alpha);

    // Anderson-Darling normality test
    const xAsc = [...demands].sort((a, b) => a - b);
    const xDesc = [...demands].sort((a, b) => b - a);
    let sumS = 0;
    for (let i = 1; i <= n; i++) {
        const zA = (xAsc[i - 1] - avg) / (std || 1);
        const zD = (xDesc[i - 1] - avg) / (std || 1);
        sumS += (2 * i - 1) * (Math.log(Math.max(normCdf(zA), 1e-10)) + Math.log(Math.max(1 - normCdf(zD), 1e-10)));
    }
    const a2 = -n - sumS / n;
    const aStar = a2 * (1 + 0.75 / n + 2.25 / (n * n));
    
    let pValue = 0;
    if (aStar < 0.2) pValue = 1 - Math.exp(-13.436 + 101.14 * aStar - 223.73 * aStar * aStar);
    else if (aStar < 0.34) pValue = 1 - Math.exp(-8.318 + 42.796 * aStar - 59.938 * aStar * aStar);
    else if (aStar < 0.6) pValue = Math.exp(0.9177 - 4.279 * aStar - 1.38 * aStar * aStar);
    else pValue = Math.exp(1.2937 - 5.709 * aStar + 0.0186 * aStar * aStar);
    
    const predictable = pValue > 0.05 || isNaN(pValue);
    const z = normInv(serviceLevel / 100);

    let maxTRR = 0;
    let explanation = '';

    if (predictable) {
        // CORRECTED QUADRATIC FORMULA
        // Buffer = forecast * TRR + z * std * sqrt(TRR)
        // Let y = sqrt(TRR), then: forecast * y^2 + z * std * y - Buffer = 0
        // Quadratic: a*y^2 + b*y + c = 0 where a=forecast, b=z*std, c=-Buffer
        // Solve for y >= 0, then TRR = y^2
        
        const a = forecast;
        const b = z * std;
        const c = -targetBuffer;
        
        // Handle edge case where forecast is 0 or very small
        if (a < 1e-10) {
            // If no demand forecast, buffer covers infinite TRR (or limited by safety stock only)
            if (b > 0 && targetBuffer > 0) {
                // Buffer = z * std * sqrt(TRR) => sqrt(TRR) = Buffer / (z * std)
                const y = targetBuffer / b;
                maxTRR = y * y;
            } else {
                maxTRR = 365; // Effectively unlimited
            }
            explanation = `Low/zero demand forecast - buffer supports extended TRR.`;
        } else {
            const discriminant = b * b - 4 * a * c;
            
            if (discriminant < 0) {
                explanation = 'Demand too high/variable for this buffer.';
                maxTRR = 0;
            } else {
                // We need the positive root for y = sqrt(TRR)
                // y = (-b + sqrt(discriminant)) / (2a) or y = (-b - sqrt(discriminant)) / (2a)
                // Since a > 0 and c < 0, discriminant > b^2, so sqrt(discriminant) > |b|
                // The positive root is: y = (-b + sqrt(discriminant)) / (2a)
                const y = (-b + Math.sqrt(discriminant)) / (2 * a);
                
                if (y > 0) {
                    maxTRR = y * y;
                } else {
                    // Try the other root
                    const y2 = (-b - Math.sqrt(discriminant)) / (2 * a);
                    maxTRR = y2 > 0 ? y2 * y2 : 0;
                }
                
                explanation = `Normal distribution model used (p=${pValue.toFixed(3)}).`;
            }
        }
    } else {
        // Intermittent demand: use binary search with Monte Carlo
        let low = 0.1, high = 365, bestTRR = 0;
        const tolerance = 0.1;
        
        const simulateServiceLevel = (TRR: number) => {
            if (nonZero.length === 0) return true;
            const sims = iterations;
            const totals: number[] = [];
            
            for (let i = 0; i < sims; i++) {
                let time = 0, demand = 0;
                while (time < TRR) {
                    time += expRandom(smoothedInterval);
                    if (time < TRR) demand += nonZero[Math.floor(Math.random() * nonZero.length)];
                }
                totals.push(demand);
            }
            totals.sort((a, b) => a - b);
            const quantile = totals[Math.floor((serviceLevel / 100) * sims)];
            return quantile <= targetBuffer; 
        };

        for (let iter = 0; iter < 30; iter++) {
            const mid = (low + high) / 2;
            if (simulateServiceLevel(mid)) {
                bestTRR = mid;
                low = mid;
            } else {
                high = mid;
            }
            if (high - low < tolerance) break;
        }
        maxTRR = bestTRR;
        explanation = 'Intermittent demand model (Monte Carlo simulation).';
    }

    return {
        maxTRR,
        forecast,
        std,
        predictable,
        explanation,
        pValue
    };
}
