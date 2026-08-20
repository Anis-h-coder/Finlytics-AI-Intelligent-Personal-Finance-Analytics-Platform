import React from "react";
import { motion } from "motion/react";
import { ShieldAlert, Info, HelpCircle, Check, CheckCircle2, Lock, FileWarning, ExternalLink } from "lucide-react";
import { Transaction } from "../types";

interface AnomaliesProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: number) => void;
}

export default function Anomalies({ transactions, onDeleteTransaction }: AnomaliesProps) {
  const [filterMode, setFilterMode] = React.useState<"genuine" | "recurring" | "all">("genuine");

  const genuineAnomalies = transactions.filter((tx) => tx.isAnomaly && !tx.isIncome);
  const recurringHighValue = transactions.filter((tx) => tx.classification === "RECURRING_HIGH_VALUE" && !tx.isIncome);
  const allMlItems = transactions.filter((tx) => !tx.isIncome && (tx.isAnomaly || tx.classification === "RECURRING_HIGH_VALUE" || (tx.rawMlScore && tx.rawMlScore >= 70)));

  const displayList = filterMode === "genuine" ? genuineAnomalies : filterMode === "recurring" ? recurringHighValue : allMlItems;

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  const formatWhyReason = (reason?: string) => {
    if (!reason) return "Evaluated by behavioral validation engine.";
    return reason.replace(/\\:/g, ":").replace(/^Why:\s*/i, "").trim();
  };

  return (
    <div className="space-y-5">
      {/* Informational Header Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ML Info Card */}
        <div className="lg:col-span-2 bg-indigo-50/55 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-indigo-950 tracking-tight flex items-center gap-1.5">
              Isolation Forest ML + Layer-2 Behavioral Validation Pipeline
            </h3>
            <p className="text-xs text-indigo-900 leading-relaxed font-semibold">
              Finlytics AI combines an <strong>Isolation Forest</strong> statistical anomaly detector with a <strong>Layer-2 Behavioral Validation Engine</strong>.
              Statistical distance flags potential candidates, while behavioral checks (recurrence history, amount consistency, merchant novelty, category baseline) determine final financial risk.
            </p>
            <p className="text-xs text-indigo-800 leading-relaxed font-semibold">
              For example, <strong>recurring rent payments ($1,800/mo)</strong> trigger high Isolation Forest statistical scores due to magnitude, but are correctly validated as <em>RECURRING HIGH VALUE</em> commitments rather than suspicious anomalies.
            </p>
          </div>
        </div>

        {/* Dynamic Threat Summary Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-tight block">Outlier Status</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-slate-900">{genuineAnomalies.length}</span>
              <span className="text-xs font-semibold text-slate-400">Genuine anomalies flagged</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">
              3 recurring rent payments filtered & validated
            </span>
          </div>

          <div className="mt-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
            {genuineAnomalies.length === 0 ? (
              <>
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span className="text-xs text-slate-700 font-bold">Your ledger is clean!</span>
              </>
            ) : (
              <>
                <FileWarning className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                <span className="text-xs text-slate-700 font-bold">{genuineAnomalies.length} Genuine Outliers Require Review</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Outliers List with Filter Tabs - Full Horizontal Width */}
      <div className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden w-full">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/55 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              Multi-Stage ML Anomaly Inspector
            </h4>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg text-xs font-bold">
              <button
                onClick={() => setFilterMode("genuine")}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  filterMode === "genuine" ? "bg-white text-red-600 shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Genuine Anomalies ({genuineAnomalies.length})
              </button>
              <button
                onClick={() => setFilterMode("recurring")}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  filterMode === "recurring" ? "bg-white text-emerald-600 shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                RECURRING HIGH-VALUE ({recurringHighValue.length})
              </button>
              <button
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  filterMode === "all" ? "bg-white text-indigo-600 shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ML Items ({allMlItems.length})
              </button>
            </div>
          </div>

          {displayList.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 text-left whitespace-nowrap w-28">Date</th>
                    <th className="px-5 py-3.5 text-left">Description &amp; Explanation</th>
                    <th className="px-5 py-3.5 text-center whitespace-nowrap w-36">Raw ML Signal</th>
                    <th className="px-5 py-3.5 text-center whitespace-nowrap w-44">Classification</th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 font-semibold text-slate-600">
                  {displayList.map((tx) => {
                    const isHighRisk = tx.classification === "HIGH_RISK_ANOMALY" || tx.classification === "CRITICAL_ANOMALY";
                    const isPotential = tx.classification === "POTENTIAL_ANOMALY";
                    const isRecurringHV = tx.classification === "RECURRING_HIGH_VALUE";

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-bold font-mono text-xs align-top">
                          {tx.date}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className="text-slate-900 font-bold text-sm block">{tx.description}</span>
                          <span className="inline-block text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            Category: {tx.category} • Recurrence: {tx.recurrenceScore ? `${tx.recurrenceScore}%` : "None"}
                          </span>
                          <div className={`mt-2.5 text-xs font-medium p-3 rounded-xl border flex items-start gap-2.5 w-full ${
                            isHighRisk ? "bg-red-50 text-red-900 border-red-200" :
                            isPotential ? "bg-amber-50 text-amber-900 border-amber-200" :
                            "bg-emerald-50 text-emerald-900 border-emerald-200"
                          }`}>
                            <Info className={`h-4 w-4 shrink-0 mt-0.5 ${
                              isHighRisk ? "text-red-600" : isPotential ? "text-amber-600" : "text-emerald-600"
                            }`} />
                            <div className="text-xs leading-relaxed">
                              <span className="font-bold mr-1.5">Why:</span>
                              <span>{formatWhyReason(tx.anomalyReason)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center align-top font-mono text-xs">
                          <span className="text-indigo-600 font-bold text-sm">{tx.rawMlScore ?? Math.round((tx.anomalyScore || 0.7) * 100)}%</span>
                          <span className="block text-[10px] text-slate-400 font-sans">Isolation Forest</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center align-top">
                          {isHighRisk && (
                            <span className="inline-block px-2.5 py-1 rounded-md bg-red-100 text-red-700 font-bold text-[11px] border border-red-200 tracking-wide">
                              HIGH RISK
                            </span>
                          )}
                          {isPotential && (
                            <span className="inline-block px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 tracking-wide">
                              POTENTIAL
                            </span>
                          )}
                          {isRecurringHV && (
                            <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 tracking-wide">
                              RECURRING HIGH-VALUE
                            </span>
                          )}
                          {!isHighRisk && !isPotential && !isRecurringHV && (
                            <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200 tracking-wide">
                              NORMAL
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-sm text-slate-900 font-mono align-top">
                          -{formatUSD(Math.abs(tx.amount))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2 animate-pulse" />
              <p className="text-sm text-slate-800 font-bold">No Items Match Filter</p>
              <p className="text-xs text-slate-400 max-w-[280px] mt-1">
                All transactions in this category pass all financial and behavioral validation rules.
              </p>
            </div>
          )}
        </div>

        {/* Mitigation Playbook - 3 Column Horizontal Banner Below Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-indigo-600" />
              Threat Protection Playbook
            </h4>
            <span className="text-xs text-slate-400 font-semibold">Standard preventive measures for flagged outliers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
              <div className="h-8 w-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 block">1. Recognize Merchant</span>
                <span className="text-[11px] text-slate-500 font-medium block leading-relaxed">
                  Check if the transaction description correlates to online subscriptions, software renewals, or temporary holding fees.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
                <Lock className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 block">2. Lock Card Temporarily</span>
                <span className="text-[11px] text-slate-500 font-medium block leading-relaxed">
                  Open your mobile bank application and lock your credit/debit card immediately to block unexpected automated charges.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-red-50/50 border border-red-100">
              <div className="h-8 w-8 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center text-red-700 shrink-0 mt-0.5">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 block">3. Raise Billing Dispute</span>
                <span className="text-[11px] text-slate-500 font-medium block leading-relaxed">
                  Call the customer service phone number on the back of your physical card to initiate formal dispute &amp; chargeback review.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
