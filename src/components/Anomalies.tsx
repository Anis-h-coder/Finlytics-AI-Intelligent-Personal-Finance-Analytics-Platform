import React from "react";
import { motion } from "motion/react";
import { ShieldAlert, Info, HelpCircle, Check, CheckCircle2, Lock, FileWarning, ExternalLink } from "lucide-react";
import { Transaction } from "../types";

interface AnomaliesProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: number) => void;
}

export default function Anomalies({ transactions, onDeleteTransaction }: AnomaliesProps) {
  const anomalies = transactions.filter((tx) => tx.isAnomaly && tx.amount < 0);

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
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
              Isolation Forest ML Engine
            </h3>
            <p className="text-xs text-indigo-900 leading-relaxed font-semibold">
              Finlytics AI implements an <strong>Isolation Forest</strong> machine learning algorithm natively in TypeScript.
              Unlike standard regression models that fit healthy distributions, Isolation Forests isolate outliers recursively using random split decision trees.
            </p>
            <p className="text-xs text-indigo-800 leading-relaxed font-semibold">
              Transactions appearing with high spending scores are isolated close to the tree roots. Outliers typically represent excessive purchase magnitudes, unusual transaction timings, or atypical merchant descriptions.
            </p>
          </div>
        </div>

        {/* Dynamic Threat Summary Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-tight block">Outlier Status</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-slate-900">{anomalies.length}</span>
              <span className="text-xs font-semibold text-slate-400">Suspicious triggers</span>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
            {anomalies.length === 0 ? (
              <>
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span className="text-xs text-slate-700 font-bold">Your ledger is clean!</span>
              </>
            ) : (
              <>
                <FileWarning className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                <span className="text-xs text-slate-700 font-bold">Requires attention</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Outliers List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/55">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                Isolated Outlier Transactions
              </h4>
            </div>

            {anomalies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Description</th>
                      <th className="px-5 py-3 text-center">Isolation Score</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 font-semibold text-slate-600">
                    {anomalies.map((tx) => (
                      <tr key={tx.id} className="hover:bg-red-50/10 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap text-slate-400 font-bold font-mono text-xs">
                          {tx.date}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-slate-900 font-bold block text-xs">{tx.description}</span>
                          <span className="inline-block text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            Category: {tx.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-red-100 bg-red-50 text-red-600 font-bold text-[10px]">
                            <span>{Math.round(tx.anomalyScore * 100)}% Match</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-right font-bold text-xs text-red-600">
                          -{formatUSD(Math.abs(tx.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2 animate-pulse" />
                <p className="text-sm text-slate-800 font-bold">No Anomaly Triggers Found</p>
                <p className="text-xs text-slate-400 max-w-[280px] mt-1">
                  The Isolation Forest has evaluated your transactions, and all spending aligns perfectly with regular habits.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mitigation Playbook */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4 h-fit">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-3">
            Threat Protection Playbook
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            If our Isolation Forest flags transactions you don't recognize, consider taking these standard protective measures:
          </p>

          <ul className="space-y-3.5">
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                <HelpCircle className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">1. Recognize Merchant</span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Check if the transaction description correlates to online subscriptions or holding fees.
                </span>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="h-5 w-5 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                <Lock className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">2. Lock Card Temporarily</span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Open your mobile bank application and lock your credit/debit card to prevent recurring charges.
                </span>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="h-5 w-5 rounded bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
                <ShieldAlert className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">3. Raise Billing Dispute</span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Call the phone number printed on the back of your physical card to report fraudulent billing activity.
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
