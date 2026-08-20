import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Sparkles, TrendingUp, HelpCircle, Calendar, ShieldAlert, ArrowUpRight, DollarSign } from "lucide-react";
import { ForecastPoint } from "../types";

interface ForecastProps {
  token: string;
}

export default function Forecast({ token }: ForecastProps) {
  const [horizon, setHorizon] = useState<number>(30);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [summary, setSummary] = useState<{
    totalForecast: number;
    averageDailyForecast: number;
    recommendedBuffer: number;
    maxSpendingCap: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/forecast?horizon=${horizon}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch forecast");
        
        // Map backend predictions to Recharts expected format
        const points = data.forecast.map((pt: any) => ({
          date: pt.date,
          predicted: pt.predicted,
          lowerBound: pt.lowerBound,
          upperBound: pt.upperBound,
          range: [pt.lowerBound, pt.upperBound],
          isForecast: true,
        }));
        
        setForecast(points);

        if (data.summary) {
          setSummary(data.summary);
        } else {
          const total = points.reduce((s: number, pt: any) => s + pt.predicted, 0);
          const avg = points.length > 0 ? total / points.length : 0;
          const cumVar = points.reduce((s: number, pt: any) => {
            const se = Math.max(0, (pt.upperBound - pt.predicted) / 1.96);
            return s + se * se;
          }, 0);
          const buffer = Math.round(1.96 * Math.sqrt(cumVar) * 100) / 100;
          setSummary({
            totalForecast: Math.round(total * 100) / 100,
            averageDailyForecast: Math.round(avg * 100) / 100,
            recommendedBuffer: buffer,
            maxSpendingCap: Math.round((total + buffer) * 100) / 100,
          });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [token, horizon]);

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  // Derive metrics strictly from verified statistical model
  const totalForecastedExpenses = summary?.totalForecast ?? forecast.reduce((sum, pt) => sum + pt.predicted, 0);
  const averageDailyForecast = summary?.averageDailyForecast ?? (forecast.length > 0 ? totalForecastedExpenses / forecast.length : 0);
  const recommendedBuffer = summary?.recommendedBuffer ?? 0;
  const upperBoundaryCap = summary?.maxSpendingCap ?? (totalForecastedExpenses + recommendedBuffer);

  return (
    <div className="space-y-5">
      {/* Informational Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-indigo-50/55 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-indigo-950 tracking-tight">
              Additive Time-Series Forecasting
            </h3>
            <p className="text-xs text-indigo-900 leading-relaxed font-semibold">
              We leverage an additive forecasting model structured similarly to Facebook Prophet. It decomposes daily historical expenses into three main components: <strong>Linear trend growth/decay</strong>, <strong>weekly seasonality</strong> (e.g. higher weekend spending), and <strong>monthly residual variance</strong>.
            </p>
            <p className="text-xs text-indigo-800 leading-relaxed font-semibold">
              The translucent indigo band indicates the <strong>95% Confidence Interval (uncertainty range)</strong>. This range widens over time to reflect the growing mathematical uncertainty of forecasting future customer actions.
            </p>
          </div>
        </div>

        {/* Dynamic Forecaster Stats */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-tight block">
              {horizon === 7 ? "7-Day" : horizon === 30 ? "30-Day" : horizon === 90 ? "3-Month" : horizon === 180 ? "6-Month" : "1-Year"} Outlook
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900">
                {loading ? "Calculating..." : formatUSD(totalForecastedExpenses)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
              Cumulative forecasted expense requirement
            </span>
          </div>

          <div className="mt-4 p-2.5 rounded-lg border border-indigo-100 bg-indigo-50/55 flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
            <span className="text-[10px] text-indigo-950 font-bold">Confidence metrics aligned</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center shadow-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-600">Simulating Facebook Prophet projection...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl shadow-xs">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Forecast Chart Card */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                {horizon}-Day Multi-Horizon Expense Forecast
              </h4>

              {/* Horizon Selector Buttons */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                {[
                  { label: "7D", value: 7 },
                  { label: "30D", value: 30 },
                  { label: "3M", value: 90 },
                  { label: "6M", value: 180 },
                  { label: "1Y", value: 365 },
                ].map((h) => (
                  <button
                    key={h.value}
                    onClick={() => setHorizon(h.value)}
                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      horizon === h.value
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    fontSize={10}
                    fontWeight={600}
                    tickLine={false}
                    tickFormatter={(date) => {
                      try {
                        if (!date) return "";
                        const d = new Date(date);
                        if (isNaN(d.getTime())) return String(date);
                        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      } catch {
                        return String(date);
                      }
                    }}
                  />
                  <YAxis stroke="#94A3B8" fontSize={10} fontWeight={600} tickLine={false} />
                  
                  {/* Tooltip */}
                  <Tooltip
                    contentStyle={{ background: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "11px" }}
                    formatter={(val: any, name: string) => {
                      if (name === "range") return [ `${formatUSD(val[0])} - ${formatUSD(val[1])}`, "95% Interval" ];
                      return [formatUSD(Number(val)), "Forecasted"];
                    }}
                  />

                  {/* Confidence Interval Translucent Ribbon */}
                  <Area
                    type="monotone"
                    dataKey="range"
                    stroke="none"
                    fill="#4F46E5"
                    fillOpacity={0.1}
                    name="range"
                  />

                  {/* Predicted Expense Line */}
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    fill="none"
                    name="predicted"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-center items-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span className="h-0.5 w-5 bg-indigo-600 inline-block" />
                <span>Forecasted Expense Trend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-5 bg-indigo-500/20 inline-block rounded-xs" />
                <span>95% Confidence Interval</span>
              </div>
            </div>
          </div>

          {/* Forecast Metric Breakdown */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col justify-between space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
              Predictive Allocation
            </h4>

            <div className="space-y-4 flex-1">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                  Projected Average Daily Cost
                </span>
                <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                  {formatUSD(averageDailyForecast)}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Calculated using seasonal trend average
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                  Recommended Contingency Buffer
                </span>
                <span className="text-lg font-bold text-emerald-650 mt-0.5 block">
                  {formatUSD(recommendedBuffer)}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Recommended emergency buffer for unexpected outliers
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                  Max Spending Boundary cap
                </span>
                <span className="text-lg font-bold text-red-600 mt-0.5 block">
                  {formatUSD(upperBoundaryCap)}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Potential total liability in worst-case variance
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Methodology & Mathematical Formula Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          ML Pipeline Architecture & Mathematical Formulas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-800 block">95% Daily Confidence Interval</span>
            <code className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md block border border-indigo-100 font-semibold">
              Forecast ± 1.96 × SE_daily
            </code>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              Derived from model residuals with linear regression prediction error expansion over the horizon.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-800 block">Contingency Buffer</span>
            <code className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md block border border-emerald-100 font-semibold">
              1.96 × √(Σ SE_daily²)
            </code>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              Calculated via sum of independent daily forecast variances across the full {horizon}-day horizon.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-800 block">Max Spending Boundary</span>
            <code className="text-[11px] font-mono text-red-700 bg-red-50 px-2 py-1 rounded-md block border border-red-100 font-semibold">
              Forecast + Contingency Buffer
            </code>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              Defines the 95% upper probability threshold for total cumulative expense liabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
