import React, { useState, useEffect } from "react";
import {
  PieChart,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Lock,
  Layers,
  Calendar,
} from "lucide-react";
import { BudgetItem, FixedCommitmentItem, BudgetPlannerIntelligence } from "../types";

interface BudgetPlannerProps {
  token: string | null;
}

export default function BudgetPlanner({ token }: BudgetPlannerProps) {
  const [intel, setIntel] = useState<BudgetPlannerIntelligence | null>(null);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgets();
  }, [token]);

  const fetchBudgets = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/budgets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIntel(data);
        setBudgets(data.budgets || []);
      }
    } catch (err) {
      console.error("Error fetching budget intelligence:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocationChange = (category: string, newAllocated: number) => {
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.category === category) {
          const val = Math.max(0, newAllocated);
          const remaining = Math.round((val - b.current) * 100) / 100;
          const percentage = val > 0 ? Math.round((b.current / val) * 100) : 0;
          return {
            ...b,
            allocated: val,
            remaining,
            percentage,
            isExceeded: b.current > val,
            isRisk: percentage >= 80,
          };
        }
        return b;
      })
    );
  };

  const handleSaveBudgets = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          budgets: budgets.map((b) => ({
            category: b.category,
            allocated_amount: b.allocated,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage("Category budgets saved successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error("Save budgets error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToRecommended = () => {
    setBudgets((prev) =>
      prev.map((b) => {
        const val = b.recommended;
        const remaining = Math.round((val - b.current) * 100) / 100;
        const percentage = val > 0 ? Math.round((b.current / val) * 100) : 0;
        return {
          ...b,
          allocated: val,
          remaining,
          percentage,
          isExceeded: b.current > val,
          isRisk: percentage >= 80,
        };
      })
    );
  };

  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.current, 0);
  const totalRemaining = totalAllocated - totalSpent;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <PieChart className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-black tracking-tight">AI Intelligent Budget Planner</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Behavioral budget optimizer that separates fixed commitments from flexible baselines and filters out ML anomalies (MacBook, Ritz Carlton) to compute true monthly targets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToRecommended}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-indigo-400" />
            Reset to AI Recommendation
          </button>
          <button
            onClick={handleSaveBudgets}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Custom Budgets"}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* 1. Monthly Income & Budget Architecture Breakdown */}
      {intel && (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                  Observed Recurring Income vs Total History
                </span>
                <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold rounded-md">
                  Observed recurring income — High confidence
                </span>
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <h2 className="text-2xl font-black text-slate-100">
                  ${intel.observedMonthlyIncome.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ month</span>
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  (Historical Ledger Total: <strong className="text-slate-200">${intel.totalDatasetIncome.toLocaleString()}</strong> over May–August)
                </span>
              </div>
            </div>
            <span className="px-3 py-1 bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              {intel.incomeBreakdownText}
            </span>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">1. Observed Monthly Income</span>
              <p className="text-lg font-black text-emerald-400 mt-1">${intel.observedMonthlyIncome.toLocaleString()}</p>
              <span className="text-[10.5px] text-slate-400 block mt-1">Recurring Payroll & Freelance</span>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">2. Fixed Commitments</span>
                <Lock className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <p className="text-lg font-black text-amber-400 mt-1">-${intel.fixedExpensesTotal.toLocaleString()}</p>
              <span className="text-[10.5px] text-slate-400 block mt-1">Rent ($1,800) + Utilities & Subscriptions</span>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">3. Target Savings ({intel.savingsTargetPercentage}%)</span>
              <p className="text-lg font-black text-indigo-400 mt-1">-${intel.savingsTargetAmount.toLocaleString()}</p>
              <span className="text-[10.5px] text-slate-400 block mt-1">Automated Wealth Building</span>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-indigo-900/60 bg-indigo-950/20">
              <span className="text-[10px] text-indigo-300 font-bold uppercase block">4. Flexible Category Pool</span>
              <p className="text-lg font-black text-indigo-300 mt-1">${intel.flexibleBudgetPool.toLocaleString()}</p>
              <span className="text-[10.5px] text-indigo-400 block mt-1">Allocated by historical behavior</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Fixed Commitments Detail Card */}
      {intel && intel.fixedCommitments && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-amber-600" /> Auto-Detected Fixed Commitments & Subscriptions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fixed obligations are subtracted prior to allocating discretionary spending.
              </p>
            </div>
            <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              ${intel.fixedExpensesTotal.toLocaleString()} / month
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {intel.fixedCommitments.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center">
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block truncate max-w-[180px]">{item.name}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{item.type} • {item.frequency}</span>
                </div>
                <span className="text-xs font-black text-slate-900 font-mono">${item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Allocated Target Spending</span>
          <p className="text-2xl font-black text-slate-900 mt-1">${totalAllocated.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {intel ? `${Math.round((totalAllocated / intel.observedMonthlyIncome) * 100)}% of monthly income` : "Target set"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {intel?.currentMonthSpentLabel || "August Spending (Through Aug 16)"}
            </span>
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-1">${totalSpent.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {totalAllocated > 0 ? `${Math.round((totalSpent / totalAllocated) * 100)}% consumed across 16 transaction days` : "Active period"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Projected Month-End Total
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            ${intel?.currentMonthProjectedTotal.toLocaleString() || totalSpent.toLocaleString()}
          </p>
          <p className="text-[10.5px] text-indigo-600 font-semibold mt-1">
            {intel?.projectionMethodology || "Based on current daily pacing & fixed obligations"}
          </p>
        </div>
      </div>

      {/* 4. Category Budget Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-600" /> Category Allocations & Live August Progress
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              AI allocations filter out 1-time ML anomalies (e.g. MacBook $2,499) to reflect true monthly baselines.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading intelligent budget breakdown...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {budgets.map((b) => (
              <div key={b.category} className="p-5 hover:bg-slate-50/60 transition-all space-y-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full shrink-0 ${b.isFixed ? "bg-amber-500" : "bg-indigo-500"}`}></span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">{b.category}</span>
                        {b.isFixed && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200 flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Fixed Commitment
                          </span>
                        )}
                        {b.isExceeded && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full border border-red-200 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Exceeded
                          </span>
                        )}
                        {b.isRisk && !b.isExceeded && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                            Near Limit (80%+)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                        AI Recommended: <strong>${b.recommended.toLocaleString()}</strong> — <span className="text-slate-400">{b.notes}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Spent (Through Aug 16)</span>
                      <span className="text-slate-900 font-bold">${b.current.toLocaleString()}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Allocated Target</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">$</span>
                        <input
                          type="number"
                          value={b.allocated}
                          onChange={(e) => handleAllocationChange(b.category, Number(e.target.value))}
                          className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Remaining</span>
                      <span className={`font-extrabold ${b.remaining < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        ${b.remaining.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                    <span>August Utilization: {b.percentage}%</span>
                    <span>Projected August End: ${b.projected.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        b.percentage >= 100
                          ? "bg-red-500"
                          : b.percentage >= 80
                          ? "bg-amber-500"
                          : "bg-indigo-600"
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
