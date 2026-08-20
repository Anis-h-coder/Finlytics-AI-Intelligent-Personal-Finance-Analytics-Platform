import React, { useState, useEffect } from "react";
import { ArrowRightLeft, TrendingUp, TrendingDown, Sparkles, CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface ComparisonEngineProps {
  token: string | null;
}

export default function ComparisonEngine({ token }: ComparisonEngineProps) {
  const [data, setData] = useState<{
    currentMonth: string;
    previousMonth: string;
    currentMonthTotal: number;
    previousMonthTotal: number;
    difference: number;
    percentageChange: number;
    categoryComparison: Array<{
      category: string;
      currentMonth: number;
      previousMonth: number;
      difference: number;
      percentageChange: number;
      trend: string;
    }>;
    explanation: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComparison();
  }, [token]);

  const fetchComparison = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/comparison", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result);
      }
    } catch (err) {
      console.error("Comparison fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <ArrowRightLeft className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-black tracking-tight">Financial Comparison Engine</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Side-by-side comparative analytics evaluating category velocity shifts, period deltas, and monthly spending variances.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Comparing financial periods...</div>
      ) : data ? (
        <>
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Month ({data.currentMonth})</span>
              <p className="text-2xl font-black text-slate-900 mt-1">${data.currentMonthTotal.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Total active spending</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Previous Month ({data.previousMonth || "N/A"})</span>
              <p className="text-2xl font-black text-slate-900 mt-1">${data.previousMonthTotal.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Benchmark period total</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Period Net Delta</span>
              <div className="flex items-center gap-2 mt-1">
                <p className={`text-2xl font-black ${data.difference > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {data.difference > 0 ? "+" : ""}${data.difference.toLocaleString()}
                </p>
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full flex items-center ${
                  data.difference > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {data.difference > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {data.percentageChange}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Month over month change</p>
            </div>
          </div>

          {/* AI Comparative Explanation */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-950 text-xs font-semibold flex items-start gap-2.5">
            <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-indigo-900 block uppercase text-[10px] tracking-wider">AI Comparative Summary</span>
              {data.explanation}
            </div>
          </div>

          {/* Category Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Category Spending Velocity Shift</h3>
            </div>

            <div className="divide-y divide-slate-100">
              {data.categoryComparison.map((cat) => (
                <div key={cat.category} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs font-medium hover:bg-slate-50/60 transition-all">
                  <div className="font-extrabold text-slate-900 w-32">{cat.category}</div>

                  <div className="grid grid-cols-3 gap-6 flex-1 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{data.previousMonth || "Prev"}</span>
                      <span className="text-slate-700">${cat.previousMonth.toLocaleString()}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{data.currentMonth}</span>
                      <span className="text-slate-900 font-bold">${cat.currentMonth.toLocaleString()}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Difference</span>
                      <span className={`font-extrabold ${cat.difference > 0 ? "text-amber-600" : cat.difference < 0 ? "text-emerald-600" : "text-slate-500"}`}>
                        {cat.difference > 0 ? "+" : ""}${cat.difference.toLocaleString()} ({cat.percentageChange}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
