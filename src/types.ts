export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Transaction {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: string; // Food, Transport, Shopping, Income, Utilities
  isAnomaly: boolean;
  anomalyScore: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalSpending: number;
  totalSavings: number;
  savingsRate: number;
  financialHealth: number;
  highestTransaction: number;
  averageTransactionValue: number;
  averageDailySpending: number;
  riskScore: number;
  monthlySpending: { month: string; amount: number }[];
  categoryBreakdown: CategoryBreakdown[];
  largestCategory: { category: string; amount: number; percentage: number } | null;
  topMerchant: { name: string; amount: number } | null;
  weekendSpending: number;
  weekdaySpending: number;
  expenseCount: number;
  anomaliesCount: number;
}

export interface ForecastPoint {
  date: string;
  amount: number;
  isForecast: boolean;
  lowerBound?: number;
  upperBound?: number;
}
