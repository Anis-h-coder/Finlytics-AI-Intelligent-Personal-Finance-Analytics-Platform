export interface User {
  id: number;
  email: string;
  name: string;
}

export type AnomalyClassification = 
  | "NORMAL" 
  | "RECURRING_HIGH_VALUE" 
  | "POTENTIAL_ANOMALY" 
  | "HIGH_RISK_ANOMALY" 
  | "CRITICAL_ANOMALY";

export type RecurringType = 
  | "SUBSCRIPTION" 
  | "RECURRING_BILL" 
  | "RECURRING_RENT" 
  | "RECURRING_PAYMENT" 
  | "ONE_TIME_EXPENSE";

export interface Transaction {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: string; // Food, Transport, Shopping, Income, Utilities
  isAnomaly: boolean;
  anomalyScore: number;
  rawMlScore?: number;
  recurrenceScore?: number;
  merchantNoveltyScore?: number;
  amountDeviationScore?: string;
  temporalDeviationScore?: string;
  categoryDeviationScore?: string;
  finalRiskScore?: number;
  classification?: AnomalyClassification;
  recurringType?: RecurringType;
  anomalyReason?: string;
  isIncome?: boolean;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface RiskBreakdownFactor {
  score: number;
  max: number;
  label: string;
  explanation: string;
}

export interface RiskBreakdown {
  highValueTransactions: RiskBreakdownFactor;
  spendingBurnRate: RiskBreakdownFactor;
  unusualAnomalies: RiskBreakdownFactor;
  budgetDeviations: RiskBreakdownFactor;
  recurringExpenses: RiskBreakdownFactor;
  totalScore: number;
}

export interface MlAnomaliesBreakdown {
  totalDetected: number;
  highRiskCount: number;
  potentialCount: number;
  criticalCount?: number;
  recurringHighValueCount: number;
  normalCount: number;
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
  riskBreakdown?: RiskBreakdown;
  mlAnomaliesBreakdown?: MlAnomaliesBreakdown;
  monthlySpending: { month: string; amount: number }[];
  categoryBreakdown: CategoryBreakdown[];
  largestCategory: { category: string; amount: number; percentage: number } | null;
  topMerchant: { name: string; amount: number } | null;
  weekendSpending: number;
  weekdaySpending: number;
  expenseCount: number;
  incomeCount?: number;
  totalTransactionCount?: number;
  anomaliesCount: number;
}

export interface ForecastPoint {
  date: string;
  amount: number;
  isForecast: boolean;
  lowerBound?: number;
  upperBound?: number;
}

export interface FixedCommitmentItem {
  name: string;
  amount: number;
  category: string;
  frequency: string;
  type: "Rent & Housing" | "Utilities" | "Internet & Phone" | "Subscription" | "Recurring Bill";
}

export interface BudgetItem {
  category: string;
  allocated: number;
  recommended: number;
  current: number;
  remaining: number;
  percentage: number;
  projected: number;
  isExceeded: boolean;
  isRisk: boolean;
  isFixed?: boolean;
  notes?: string;
}

export interface BudgetPlannerIntelligence {
  observedMonthlyIncome: number;
  incomeConfidence?: string;
  incomeBreakdownText: string;
  totalDatasetIncome: number;
  fixedExpensesTotal: number;
  savingsTargetAmount: number;
  savingsTargetPercentage: number;
  flexibleBudgetPool: number;
  currentMonthName: string;
  currentMonthSpentLabel?: string;
  currentMonthTotalSpent: number;
  currentMonthProjectedTotal: number;
  projectionMethodology?: string;
  fixedCommitments: FixedCommitmentItem[];
  budgets: BudgetItem[];
}

export interface RecurringCommitmentItem {
  id?: number;
  merchant: string;
  amount: number;
  category: string;
  frequency: string;
  type: "HOUSING_LEASE" | "RECURRING_BILL" | "DIGITAL_SUBSCRIPTION";
  occurrencesCount: number;
  estimatedAnnualCost: number;
  lastPayment: string;
  nextExpectedPayment: string;
  paymentStatus: "PAID_THIS_CYCLE" | "DUE_TODAY" | "DUE_SOON" | "OVERDUE" | "UPCOMING";
  aiSuggestion: string;
}

export interface VariableRecurringItem {
  merchant: string;
  averageAmount: number;
  amountRange: string;
  category: string;
  frequency: string;
  type: "RECURRING_VARIABLE_EXPENSE";
  occurrencesCount: number;
  estimatedAnnualCost: number;
  lastPayment: string;
  nextExpectedPayment: string;
  paymentStatus: "PAID_THIS_CYCLE" | "DUE_TODAY" | "DUE_SOON" | "OVERDUE" | "UPCOMING";
  aiSuggestion: string;
}

export interface FrequentSpendingItem {
  merchant: string;
  category: string;
  spendingType: "GROCERIES_FOOD" | "COFFEE_FOOD" | "FUEL_TRANSPORT" | "RIDE_SHARE_TRANSPORT" | "RETAIL_SHOPPING" | "FREQUENT_DINING";
  occurrencesCount: number;
  averagePerTransaction: number;
  totalSpent: number;
  cadenceDescription: string;
  aiExplanation: string;
}

export interface PossibleRecurringItem {
  merchant: string;
  amount: number;
  category: string;
  occurrencesCount: number;
  lastPayment: string;
  classificationReason: string;
}

export interface OneTimeExpenseItem {
  merchant: string;
  amount: number;
  category: string;
  date: string;
  type: string;
  occurrences: number;
  reason: string;
}

export interface SubscriptionIntelligenceResponse {
  fixedCommitments: RecurringCommitmentItem[];
  variableRecurring: VariableRecurringItem[];
  frequentSpendingPatterns: FrequentSpendingItem[];
  possibleRecurring: PossibleRecurringItem[];
  oneTimePurchases: OneTimeExpenseItem[];
  fixedMonthlyRecurring: number;
  variableMonthlyRecurring: number;
  totalMonthlyRecurring: number;
  totalAnnualRecurring: number;
  counts: {
    fixedCommitmentsCount: number;
    variableRecurringCount: number;
    frequentPatternsCount: number;
    possibleRecurringCount: number;
    oneTimeCount: number;
  };
}

export interface GoalItem {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  monthlyContribution: number;
  progress: number;
  requiredMonthly: number;
  monthsLeft: number;
  isAtRisk: boolean;
  status: "On Track" | "At Risk" | "Completed";
  aiAdvice: string;
}

export interface SmartAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "danger" | "warning" | "info" | "success";
  category?: string;
}

export interface HealthDetails {
  overallScore: number;
  breakdown: {
    savings: number;
    budget: number;
    spendingStability: number;
    recurringExpenses: number;
    risk: number;
  };
  methodology: string[];
}

export interface MerchantItem {
  merchant: string;
  totalSpent: number;
  count: number;
  avgTransaction: number;
  lastTransaction: string;
  category: string;
  monthlyTrend: { month: string; amount: number }[];
}
