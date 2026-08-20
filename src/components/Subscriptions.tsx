import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Calendar,
  Sparkles,
  CreditCard,
  Lock,
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Fuel,
  Car,
  ShoppingBag,
  HelpCircle,
  Layers,
  Coffee,
  Utensils,
} from "lucide-react";
import {
  RecurringCommitmentItem,
  VariableRecurringItem,
  FrequentSpendingItem,
  PossibleRecurringItem,
  OneTimeExpenseItem,
  SubscriptionIntelligenceResponse,
} from "../types";

interface SubscriptionsProps {
  token: string | null;
}

export default function Subscriptions({ token }: SubscriptionsProps) {
  const [data, setData] = useState<SubscriptionIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, [token]);

  const fetchSubscriptions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setData(resData);
      }
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === "HOUSING_LEASE") {
      return (
        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200 flex items-center gap-1">
          <Lock className="h-3 w-3" /> Housing Lease
        </span>
      );
    }
    if (type === "RECURRING_BILL") {
      return (
        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full border border-slate-200">
          Recurring Bill
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full border border-purple-200">
        Digital Subscription
      </span>
    );
  };

  const getFrequentBadge = (spendingType: string) => {
    if (spendingType === "GROCERIES_FOOD") {
      return (
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
          <ShoppingBag className="h-3 w-3 text-emerald-600" /> Frequent Grocery Spending
        </span>
      );
    }
    if (spendingType === "COFFEE_FOOD") {
      return (
        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full border border-amber-200 flex items-center gap-1">
          <Coffee className="h-3 w-3 text-amber-700" /> Frequent Coffee Spending
        </span>
      );
    }
    if (spendingType === "FUEL_TRANSPORT") {
      return (
        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold rounded-full border border-orange-200 flex items-center gap-1">
          <Fuel className="h-3 w-3 text-orange-600" /> Frequent Fuel Spending
        </span>
      );
    }
    if (spendingType === "RIDE_SHARE_TRANSPORT") {
      return (
        <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-[10px] font-bold rounded-full border border-cyan-200 flex items-center gap-1">
          <Car className="h-3 w-3 text-cyan-600" /> Frequent Ride-Share Spending
        </span>
      );
    }
    if (spendingType === "FREQUENT_DINING") {
      return (
        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full border border-rose-200 flex items-center gap-1">
          <Utensils className="h-3 w-3 text-rose-600" /> Frequent Dining Spending
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-pink-100 text-pink-800 text-[10px] font-bold rounded-full border border-pink-200 flex items-center gap-1">
        <ShoppingBag className="h-3 w-3 text-pink-600" /> Frequent Retail Spending
      </span>
    );
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "PAID_THIS_CYCLE":
        return (
          <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Paid this cycle
          </span>
        );
      case "DUE_TODAY":
        return (
          <span className="text-amber-700 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Expected today
          </span>
        );
      case "DUE_SOON":
        return (
          <span className="text-amber-700 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Due soon
          </span>
        );
      default:
        return (
          <span className="text-indigo-700 font-bold text-[10px] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            Upcoming
          </span>
        );
    }
  };

  const fixedCommitments = data?.fixedCommitments || [];
  const variableRecurring = data?.variableRecurring || [];
  const frequentSpending = data?.frequentSpendingPatterns || [];
  const possibleRecurring = data?.possibleRecurring || [];
  const oneTimePurchases = data?.oneTimePurchases || [];
  const counts = data?.counts || {
    fixedCommitmentsCount: 0,
    variableRecurringCount: 0,
    frequentPatternsCount: 0,
    possibleRecurringCount: 0,
    oneTimeCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-400" />
            <h1 className="text-xl font-black tracking-tight">Recurring Commitments & Spending Intelligence</h1>
          </div>
          <p className="text-xs text-purple-200 mt-1 max-w-2xl">
            Distinguishes fixed obligations & variable bills from repeated discretionary spending (gas, rides, shopping), emerging patterns, and isolated one-time expenses.
          </p>
        </div>

        <button
          onClick={fetchSubscriptions}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 border border-white/10"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Re-evaluate
        </button>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fixed Recurring Baseline</span>
            <Lock className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-700 mt-1">
            ${(data?.fixedMonthlyRecurring || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {counts.fixedCommitmentsCount} Confirmed fixed commitments (Rent + Bills + Subs)
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Variable Recurring Baseline</span>
            <Zap className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 mt-1">
            ~${(data?.variableMonthlyRecurring || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {counts.variableRecurringCount} Confirmed variable stream (Electricity utility)
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Recurring Outflow</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            ~${(data?.totalMonthlyRecurring || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-slate-400"> / mo</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            ~${(data?.totalAnnualRecurring || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / year projected commitment
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Intelligence Breakdown</span>
          <p className="text-sm font-black text-slate-800 mt-1.5 flex items-center gap-1.5">
            <span className="text-purple-700">{counts.fixedCommitmentsCount} Fixed</span> • 
            <span className="text-blue-600">{counts.variableRecurringCount} Variable</span> • 
            <span className="text-amber-600">{counts.frequentPatternsCount} Frequent</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            + {counts.possibleRecurringCount} Emerging • {counts.oneTimeCount} One-Time Isolated
          </p>
        </div>
      </div>

      {/* SECTION 1: Confirmed Fixed Commitments */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-600" /> Confirmed Fixed Recurring Commitments ({fixedCommitments.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified obligatory commitments with consistent monthly cadence (3+ consecutive cycles). Contributes directly to Fixed Baseline.
            </p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
            ${(data?.fixedMonthlyRecurring || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / month
          </span>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400 text-xs">Evaluating commitments...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fixedCommitments.map((sub, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-300 transition shadow-2xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900">{sub.merchant}</h4>
                      {getTypeBadge(sub.type)}
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                      {sub.category} • {sub.frequency} • <strong className="text-slate-700">{sub.occurrencesCount} verified cycles</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-purple-700">${sub.amount.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">/ month</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Last Paid</span>
                    <span className="text-slate-700 font-medium">{sub.lastPayment}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Next Expected</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-purple-700 font-bold">{sub.nextExpectedPayment}</span>
                      {getStatusBadge(sub.paymentStatus)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-[11px] text-purple-900 bg-purple-50 p-2 rounded-lg font-medium border border-purple-100">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                  <span>{sub.aiSuggestion}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Recurring Variable Expenses */}
      {variableRecurring.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" /> Recurring Variable Expenses ({variableRecurring.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Essential utilities that repeat every month but fluctuate based on seasonal consumption.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              ~${(data?.variableMonthlyRecurring || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / month baseline
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variableRecurring.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 hover:border-blue-300 transition shadow-2xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900">{item.merchant}</h4>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full border border-blue-200 flex items-center gap-1">
                        <Zap className="h-3 w-3 text-blue-600" /> Recurring Variable
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                      {item.category} • Monthly cycle • <strong className="text-slate-700">{item.occurrencesCount} cycles verified</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-blue-700">~${item.averageAmount.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block font-medium">Range: {item.amountRange}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-blue-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Last Payment</span>
                    <span className="text-slate-700 font-medium">{item.lastPayment}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Next Expected</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-blue-700 font-bold">{item.nextExpectedPayment}</span>
                      {getStatusBadge(item.paymentStatus)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-[11px] text-blue-950 bg-blue-50 p-2 rounded-lg font-medium border border-blue-200">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{item.aiSuggestion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Frequent Spending Patterns (Discretionary, NOT subscriptions) */}
      {frequentSpending.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" /> Frequent Spending Patterns ({frequentSpending.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Repeated discretionary habits (groceries, coffee, fuel, ride-shares, retail). <strong className="text-amber-700">Excluded from fixed recurring commitments.</strong>
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Discretionary Usage Patterns
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {frequentSpending.map((pattern, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-amber-300 transition shadow-2xs space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-extrabold text-slate-900">{pattern.merchant}</h4>
                    {getFrequentBadge(pattern.spendingType)}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Cadence:</span>
                    <span className="font-semibold text-slate-700">Repeated spending pattern</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">Avg / transaction:</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">${pattern.averagePerTransaction.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between text-xs text-slate-500">
                    <span>Total ({pattern.occurrencesCount} txns):</span>
                    <span className="font-semibold text-slate-700 font-mono">${pattern.totalSpent.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
                  {pattern.aiExplanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: Possible Recurring Payments */}
      {possibleRecurring.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-indigo-500" /> Possible Recurring Payments ({possibleRecurring.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Transactions with 1–2 historical occurrences. Insufficient cadence to confirm as recurring commitment (3+ cycle rule enforced).
              </p>
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              Needs More Cycles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {possibleRecurring.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-indigo-50/20 rounded-xl border border-indigo-100 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-800">{item.merchant}</span>
                  <span className="text-xs font-black text-indigo-700 font-mono">${item.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                  <span>Last: {item.lastPayment} • {item.category}</span>
                  <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {item.occurrencesCount} {item.occurrencesCount === 1 ? "Occurrence" : "Occurrences"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium pt-1 border-t border-indigo-100/60">
                  {item.classificationReason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: One-Time Isolated Purchases Ruled Out */}
      {oneTimePurchases.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  One-Time Isolated Purchases — Ruled Out From Recurring Baselines
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Single-occurrence transactions identified from transaction history and excluded from recurring commitments.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {oneTimePurchases.length} Isolated Purchases Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {oneTimePurchases.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-800">{item.merchant}</span>
                  <span className="text-xs font-black text-slate-900 font-mono">${item.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                  <span>Date: {item.date} • {item.category}</span>
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    1 Occurrence (One-Time Expense)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium pt-1 border-t border-slate-200/60">
                  {item.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
