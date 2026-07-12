import { Categorizer } from "../src/ml/categorizer";
import { IsolationForest } from "../src/ml/isolationForest";
import { Forecaster, ForecastResult } from "../src/ml/forecaster";
import { dbAll, dbRun } from "./db";

const categorizer = new Categorizer();

const CATEGORIES_LIST = ["Food", "Transport", "Shopping", "Income", "Utilities"];

/**
 * Categorizes a transaction description.
 */
export function autoCategorize(description: string): string {
  return categorizer.categorize(description);
}

/**
 * Re-evaluates anomaly scores and flags for all of a user's transactions.
 * This should be run when new transactions are added to keep the anomaly engine in sync.
 */
export async function updateAnomalyScores(userId: number): Promise<void> {
  const transactions = await dbAll(
    "SELECT id, amount, category FROM transactions WHERE user_id = ? ORDER BY date ASC",
    [userId]
  );

  if (transactions.length === 0) return;

  const amounts = transactions.map((t) => Math.abs(t.amount));
  const categoryIndices = transactions.map((t) => {
    const idx = CATEGORIES_LIST.indexOf(t.category);
    return idx === -1 ? 2 : idx; // default to Shopping index if category is custom
  });

  const forest = new IsolationForest(50, 256);
  const results = forest.detect(amounts, categoryIndices);

  // Update transactions in the database with the new anomaly scores and flags
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const res = results[i];
    
    await dbRun(
      "UPDATE transactions SET is_anomaly = ?, anomaly_score = ? WHERE id = ?",
      [res.isAnomaly ? 1 : 0, res.score, tx.id]
    );
  }
}

/**
 * Computes analytics dashboard stats for a user's transactions.
 */
export async function computeDashboardStats(userId: number) {
  const transactions = await dbAll(
    "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC",
    [userId]
  );

  if (transactions.length === 0) {
  return {
    totalIncome: 0,
    totalSpending: 0,
    totalSavings: 0,
    savingsRate: 0,
    financialHealth: 100,

    highestTransaction: 0,
    averageTransactionValue: 0,
    averageDailySpending: 0,

    riskScore: 0,

    monthlySpending: [],

    categoryBreakdown: [],

    largestCategory: null,

    topMerchant: null,

    weekendSpending: 0,

    weekdaySpending: 0,

    expenseCount: 0,

    anomaliesCount: 0,
  };
}

  // Calculate stats
  let totalSpending = 0;
  let totalIncome = 0;
  let highestTransaction = 0;
  let spendingCount = 0;
  let anomaliesCount = 0;
  
  const merchantMap: Record<string, number> = {};
  
  let weekendSpending = 0;
  let weekdaySpending = 0;

  // Track monthly spending (group by month, e.g. YYYY-MM)
  const monthlyMap: { [month: string]: number } = {};
  // Track category amounts
  const categoryMap: { [cat: string]: number } = {
    Food: 0,
    Transport: 0,
    Shopping: 0,
    Income: 0,
    Utilities: 0,
  };

  transactions.forEach((tx) => {
    const amount = tx.amount; // debit is negative, credit is positive in bank statements usually,
    // let's follow standard where spending is negative and income is positive.
    // Let's verify user description: "Total spending", "Highest transaction", etc.
    // If spending is negative, let's treat absolute value of negative transactions as spending.
    if (amount < 0) {
      const absAmount = Math.abs(amount);
      merchantMap[tx.description] =
  (merchantMap[tx.description] || 0) + absAmount;

const day = new Date(tx.date).getDay();

if (day === 0 || day === 6) {
  weekendSpending += absAmount;
} else {
  weekdaySpending += absAmount;
}
      totalSpending += absAmount;
      spendingCount++;
      if (absAmount > highestTransaction) {
        highestTransaction = absAmount;
      }
      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + absAmount;

      // Group monthly
      const monthStr = tx.date.substring(0, 7); // "YYYY-MM"
      monthlyMap[monthStr] = (monthlyMap[monthStr] || 0) + absAmount;
    } else {
      totalIncome += amount;
      // We can track income separately or keep it in the categorization breakdowns if users want
    }

    if (tx.is_anomaly === 1 && tx.amount < 0) {
      anomaliesCount++;
    }
  });

  const averageTransactionValue = spendingCount > 0 ? totalSpending / spendingCount : 0;

  const totalSavings = totalIncome - totalSpending;

const savingsRate =
  totalIncome > 0
    ? (totalSavings / totalIncome) * 100
    : 0;

const uniqueDays = new Set(
  transactions
    .filter((t) => t.amount < 0)
    .map((t) => t.date)
);

const averageDailySpending =
  uniqueDays.size > 0
    ? totalSpending / uniqueDays.size
    : 0;

  // Convert monthlyMap to sorted list
  const monthlySpending = Object.keys(monthlyMap)
    .sort()
    .map((month) => ({
      month,
      amount: Math.round(monthlyMap[month] * 100) / 100,
    }));

  // Convert categoryMap to structured breakdown list
  const colors: { [cat: string]: string } = {
    Food: "#F59E0B", // amber
    Transport: "#3B82F6", // blue
    Shopping: "#EC4899", // pink
    Income: "#10B981", // emerald
    Utilities: "#8B5CF6", // purple
  };

  const categoryBreakdown = Object.keys(categoryMap)
    .filter((cat) => cat !== "Income" && categoryMap[cat] > 0) // don't show income in spending breakdown
    .map((cat) => {
      const amt = categoryMap[cat];
      const percentage = totalSpending > 0 ? (amt / totalSpending) * 100 : 0;
      return {
        category: cat,
        amount: Math.round(amt * 100) / 100,
        percentage: Math.round(percentage * 10) / 10,
        color: colors[cat] || "#6B7280",
      };
    });

    const largestCategory =
  [...categoryBreakdown].sort(
    (a, b) => b.amount - a.amount
  )[0] || null;

const topMerchantEntry =
  Object.entries(merchantMap)
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0];

const topMerchant = topMerchantEntry
  ? {
      name: topMerchantEntry[0],
      amount: topMerchantEntry[1],
    }
  : null;

  // Risk score calculation based on:
  // 1. Percentage of income spent (ideal spending < 70% of income)
  // 2. Presence of anomalies (excessive single purchases)

  let riskScore = 20; // default healthy baseline risk
  
  if (totalIncome > 0) {
    const burnRate = totalSpending / totalIncome;
    if (burnRate > 1.0) {
      riskScore += 40; // spent more than earned
    } else if (burnRate > 0.8) {
      riskScore += 25; // tight budget
    } else if (burnRate > 0.5) {
      riskScore += 10;
    }
  } else if (totalSpending > 0) {
    riskScore += 30; // spending with no recorded income
  }

  if (anomaliesCount > 0) {
    riskScore += Math.min(30, anomaliesCount * 10); // anomaly penalty
  }

  riskScore = Math.min(100, Math.max(0, Math.round(riskScore)));

  let financialHealth = 100;

financialHealth -= anomaliesCount * 5;

financialHealth -= riskScore * 0.3;

if (savingsRate > 30) {
  financialHealth += 5;
}

financialHealth = Math.max(
  0,
  Math.min(100, Math.round(financialHealth))
);

  return {
  totalIncome: Math.round(totalIncome * 100) / 100,

  totalSpending: Math.round(totalSpending * 100) / 100,

  totalSavings: Math.round(totalSavings * 100) / 100,

  savingsRate: Math.round(savingsRate * 10) / 10,

  financialHealth,

  highestTransaction: Math.round(highestTransaction * 100) / 100,

  averageTransactionValue:
    Math.round(averageTransactionValue * 100) / 100,

  averageDailySpending:
    Math.round(averageDailySpending * 100) / 100,

  riskScore,

  monthlySpending,

  categoryBreakdown,

  largestCategory,

  topMerchant,

  weekendSpending:
    Math.round(weekendSpending * 100) / 100,

  weekdaySpending:
    Math.round(weekdaySpending * 100) / 100,

  expenseCount: spendingCount,

  anomaliesCount,
};
}

/**
 * Predicts next 30 days of daily expenses.
 */
export async function getForecast(userId: number): Promise<ForecastResult[]> {
  const transactions = await dbAll(
    "SELECT date, amount FROM transactions WHERE user_id = ? ORDER BY date ASC",
    [userId]
  );

  // Convert to forecaster structure (expenses represented as positive magnitudes)
  const historical = transactions
    .filter((t) => t.amount < 0)
    .map((t) => ({
      date: t.date,
      amount: Math.abs(t.amount),
    }));

  return Forecaster.forecast30Days(historical);
}
