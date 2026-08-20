/**
 * Time series forecasting in pure TypeScript (additive model inspired by Facebook Prophet).
 * Decomposes daily historical expenses into:
 *   1. Linear trend growth/decay
 *   2. Weekly seasonality (day-of-week cyclical offsets)
 *   3. Monthly seasonality (day-of-month cyclical offsets, e.g. rent/bills)
 *   4. Residual uncertainty (robust standard error and 95% confidence intervals)
 */

export interface ForecastResult {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  isForecast: boolean;
}

export interface ForecastSummary {
  totalForecast: number;
  averageDailyForecast: number;
  recommendedBuffer: number;
  maxSpendingCap: number;
  cumulativeSe: number;
}

export interface MultiHorizonForecastOutput {
  forecast: ForecastResult[];
  summary: ForecastSummary;
}

/**
 * Safely parses any date string into a valid Date object or null if invalid.
 */
function safeParseDate(input: any): Date | null {
  if (!input) return null;
  const str = String(input).trim();
  if (!str) return null;

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d;
  }

  const parts = str.split(/[\/\-\.\s]+/);
  if (parts.length >= 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
      let year = p0 > 1000 ? p0 : (p2 > 1000 ? p2 : (p2 < 100 ? 2000 + p2 : p2));
      let month = p0 > 1000 ? p1 : p0;
      let day = p0 > 1000 ? p2 : p1;
      if (month > 12 && day <= 12) {
        const tmp = month;
        month = day;
        day = tmp;
      }
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const parsed = new Date(year, month - 1, day);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
  }

  return null;
}

/**
 * Formats a Date object as YYYY-MM-DD safely without throwing RangeError.
 */
function formatDateToYYYYMMDD(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export class Forecaster {
  /**
   * Generates a multi-horizon time-series forecast and uncertainty metrics.
   */
  public static forecast(
    historicalTransactions: { date: string; amount: number }[],
    horizonDays = 30
  ): MultiHorizonForecastOutput {
    try {
      // 1. Group transaction amounts by calendar date (expenses as positive amounts)
      const dailyExpenses: { [dateStr: string]: { date: Date; amount: number } } = {};

      if (Array.isArray(historicalTransactions)) {
        historicalTransactions.forEach((t) => {
          if (!t || typeof t.amount !== "number" || isNaN(t.amount) || t.amount <= 0) return;
          const parsed = safeParseDate(t.date);
          if (!parsed) return;

          const dateStr = formatDateToYYYYMMDD(parsed);
          if (!dailyExpenses[dateStr]) {
            dailyExpenses[dateStr] = { date: parsed, amount: 0 };
          }
          dailyExpenses[dateStr].amount += t.amount;
        });
      }

      const sortedKeys = Object.keys(dailyExpenses).sort();

      if (sortedKeys.length < 3) {
        const sum = Object.values(dailyExpenses).reduce((a, b) => a + b.amount, 0);
        const avg = (sortedKeys.length > 0 ? sum / sortedKeys.length : 120) || 120;
        return this.generateFallbackForecast(avg, horizonDays);
      }

      const n = sortedKeys.length;
      const startDate = dailyExpenses[sortedKeys[0]].date;
      const startTimestamp = startDate.getTime();
      const msInDay = 24 * 60 * 60 * 1000;

      const X: number[] = [];
      const Y: number[] = [];

      sortedKeys.forEach((key) => {
        const item = dailyExpenses[key];
        const days = Math.round((item.date.getTime() - startTimestamp) / msInDay);
        X.push(isNaN(days) ? 0 : days);
        Y.push(item.amount);
      });

      // 2. Linear Trend Fit: Y = alpha * X + beta
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < n; i++) {
        sumX += X[i];
        sumY += Y[i];
        sumXY += X[i] * Y[i];
        sumXX += X[i] * X[i];
      }

      const denominator = n * sumXX - sumX * sumX;
      let alpha = 0;
      let beta = sumY / n;

      if (denominator !== 0) {
        alpha = (n * sumXY - sumX * sumY) / denominator;
        beta = (sumY * sumXX - sumX * sumXY) / denominator;
      }

      const avgY = sumY / n || 100;
      // Dampen extreme trend slopes to prevent divergence on long horizons
      if (Math.abs(alpha) > avgY * 0.02) {
        alpha = Math.sign(alpha) * avgY * 0.005;
      }

      const meanX = sumX / n;
      const ssX = sumXX - (sumX * sumX) / n;

      // 3. Weekly Seasonality: Offset per day of week (0 = Sunday ... 6 = Saturday)
      const weeklyOffsets = new Array(7).fill(0);
      const weeklyCounts = new Array(7).fill(0);

      sortedKeys.forEach((key) => {
        const item = dailyExpenses[key];
        const dayOfWeek = item.date.getDay();
        const days = Math.round((item.date.getTime() - startTimestamp) / msInDay);
        const trend = alpha * days + beta;

        weeklyOffsets[dayOfWeek] += item.amount - trend;
        weeklyCounts[dayOfWeek]++;
      });

      for (let i = 0; i < 7; i++) {
        if (weeklyCounts[i] > 0) {
          weeklyOffsets[i] = weeklyOffsets[i] / weeklyCounts[i];
        }
      }

      // 4. Monthly Seasonality: Offset per day of month (1 ... 31) for recurring bills/rent
      const dayOfMonthOffsets = new Array(32).fill(0);
      const dayOfMonthCounts = new Array(32).fill(0);

      sortedKeys.forEach((key) => {
        const item = dailyExpenses[key];
        const dom = item.date.getDate();
        const dow = item.date.getDay();
        const days = Math.round((item.date.getTime() - startTimestamp) / msInDay);
        const trend = alpha * days + beta;
        const base = trend + weeklyOffsets[dow];

        dayOfMonthOffsets[dom] += item.amount - base;
        dayOfMonthCounts[dom]++;
      });

      for (let i = 1; i <= 31; i++) {
        if (dayOfMonthCounts[i] > 0) {
          dayOfMonthOffsets[i] = dayOfMonthOffsets[i] / dayOfMonthCounts[i];
        }
      }

      // 5. Residual Variance: Compute robust standard error of daily residuals
      const residuals: number[] = [];
      sortedKeys.forEach((key) => {
        const item = dailyExpenses[key];
        const dom = item.date.getDate();
        const dow = item.date.getDay();
        const days = Math.round((item.date.getTime() - startTimestamp) / msInDay);
        const trend = alpha * days + beta;
        const domEffect = dayOfMonthCounts[dom] >= 2 ? dayOfMonthOffsets[dom] : 0;
        const predicted = Math.max(0, trend + weeklyOffsets[dow] + domEffect);
        residuals.push(item.amount - predicted);
      });

      // Robust estimate of daily residual standard deviation (MAD * 1.4826)
      const sortedAbsResiduals = residuals.map((r) => Math.abs(r)).sort((a, b) => a - b);
      const medianAbs = sortedAbsResiduals[Math.floor(sortedAbsResiduals.length / 2)] || (avgY * 0.25);
      const robustStdDev = Math.max(15, medianAbs * 1.4826);

      // 6. Generate Forecast Points for requested horizon
      const forecast: ForecastResult[] = [];
      const lastItem = dailyExpenses[sortedKeys[sortedKeys.length - 1]];
      const baseDate = lastItem && lastItem.date && !isNaN(lastItem.date.getTime())
        ? new Date(lastItem.date)
        : new Date();

      let totalForecast = 0;
      let cumulativeVariance = 0;

      for (let day = 1; day <= horizonDays; day++) {
        const forecastDate = new Date(baseDate.getTime());
        forecastDate.setDate(baseDate.getDate() + day);

        if (isNaN(forecastDate.getTime())) {
          const fallback = new Date();
          fallback.setDate(fallback.getDate() + day);
          forecastDate.setTime(fallback.getTime());
        }

        const days = Math.round((forecastDate.getTime() - startTimestamp) / msInDay);
        const dow = forecastDate.getDay();
        const dom = forecastDate.getDate();

        const trend = alpha * days + beta;
        const dowEffect = weeklyOffsets[dow] || 0;
        const domEffect = dayOfMonthCounts[dom] >= 2 ? dayOfMonthOffsets[dom] : 0;

        let predicted = Math.max(10, trend + dowEffect + domEffect);

        // Daily prediction standard error with distance penalty
        const seFactor = Math.sqrt(1 + (1 / n) + Math.pow(days - meanX, 2) / (ssX || 1));
        const dailySe = robustStdDev * seFactor;
        const dailyWidth = 1.96 * dailySe;

        const lowerBound = Math.max(0, predicted - dailyWidth);
        const upperBound = predicted + dailyWidth;

        totalForecast += predicted;
        cumulativeVariance += dailySe * dailySe;

        forecast.push({
          date: formatDateToYYYYMMDD(forecastDate),
          predicted: Math.round(predicted * 100) / 100,
          lowerBound: Math.round(lowerBound * 100) / 100,
          upperBound: Math.round(upperBound * 100) / 100,
          isForecast: true,
        });
      }

      // 7. Cumulative Multi-Day Uncertainty (Sum of Independent Variances: SE_cum = sqrt(sum(SE_t^2)))
      const cumulativeSe = Math.sqrt(cumulativeVariance);
      const recommendedBuffer = Math.round(1.96 * cumulativeSe * 100) / 100;
      const roundedTotal = Math.round(totalForecast * 100) / 100;
      const averageDailyForecast = Math.round((totalForecast / horizonDays) * 100) / 100;
      const maxSpendingCap = Math.round((roundedTotal + recommendedBuffer) * 100) / 100;

      return {
        forecast,
        summary: {
          totalForecast: roundedTotal,
          averageDailyForecast,
          recommendedBuffer,
          maxSpendingCap,
          cumulativeSe: Math.round(cumulativeSe * 100) / 100,
        },
      };
    } catch (err) {
      console.error("Forecaster error, using fallback forecast:", err);
      return this.generateFallbackForecast(120, horizonDays);
    }
  }

  /**
   * Compatibility wrapper for 30-day forecast array.
   */
  public static forecast30Days(
    historicalTransactions: { date: string; amount: number }[]
  ): ForecastResult[] {
    return this.forecast(historicalTransactions, 30).forecast;
  }

  private static generateFallbackForecast(avg: number, horizonDays = 30): MultiHorizonForecastOutput {
    const forecast: ForecastResult[] = [];
    const today = new Date();
    let total = 0;
    let cumVar = 0;

    const baseDailySe = Math.max(15, avg * 0.25);

    for (let i = 1; i <= horizonDays; i++) {
      const forecastDate = new Date(today.getTime());
      forecastDate.setDate(today.getDate() + i);

      const dayOfWeek = forecastDate.getDay();
      const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? avg * 0.25 : -avg * 0.08;
      const monthWave = Math.sin((forecastDate.getDate() / 30) * Math.PI * 2) * (avg * 0.15);

      const predicted = Math.max(10, avg + weekendBoost + monthWave);
      const dailySe = baseDailySe * Math.sqrt(1 + (i / horizonDays) * 0.1);
      const width = 1.96 * dailySe;
      const lowerBound = Math.max(0, predicted - width);
      const upperBound = predicted + width;

      total += predicted;
      cumVar += dailySe * dailySe;

      forecast.push({
        date: formatDateToYYYYMMDD(forecastDate),
        predicted: Math.round(predicted * 100) / 100,
        lowerBound: Math.round(lowerBound * 100) / 100,
        upperBound: Math.round(upperBound * 100) / 100,
        isForecast: true,
      });
    }

    const cumulativeSe = Math.sqrt(cumVar);
    const recommendedBuffer = Math.round(1.96 * cumulativeSe * 100) / 100;
    const roundedTotal = Math.round(total * 100) / 100;
    const averageDailyForecast = Math.round((total / horizonDays) * 100) / 100;

    return {
      forecast,
      summary: {
        totalForecast: roundedTotal,
        averageDailyForecast,
        recommendedBuffer,
        maxSpendingCap: Math.round((roundedTotal + recommendedBuffer) * 100) / 100,
        cumulativeSe: Math.round(cumulativeSe * 100) / 100,
      },
    };
  }
}

