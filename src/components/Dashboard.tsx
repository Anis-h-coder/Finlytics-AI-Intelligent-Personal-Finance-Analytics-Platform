import React from "react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Activity,
  AlertTriangle,
  Calendar,
  Trash2,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  FileDown,
} from "lucide-react";
import { DashboardStats, Transaction } from "../types";

interface DashboardProps {
  stats: DashboardStats;
  transactions: Transaction[];
  onDeleteTransaction: (id: number) => void;
  onExportPDF: () => void;
}

export default function Dashboard({ stats, transactions, onDeleteTransaction, onExportPDF }: DashboardProps) {
  // Format numbers to USD
  const formatUSD = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  // Safe category cell color mapping
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Food: "#F59E0B", // Amber
      Transport: "#3B82F6", // Blue
      Shopping: "#EC4899", // Pink
      Income: "#10B981", // Emerald
      Utilities: "#8B5CF6", // Purple
    };
    return colors[category] || "#6B7280";
  };

  const getRiskColor = (score: number) => {
    if (score < 35) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score < 65) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  const getRiskProgressColor = (score: number) => {
    if (score < 35) return "bg-emerald-500";
    if (score < 65) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-5">
      {/* Title & Action Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Financial Analytics Dashboard</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Real-time ledger analytics, category allocation maps, and machine learning outlier analysis.</p>
        </div>
        <button
          onClick={onExportPDF}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
        >
          <FileDown className="h-4 w-4 shrink-0" />
          <span>Export PDF Report</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Spending */}
        <motion.div
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs flex items-start justify-between"
        >
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-tight block">Total Spending</span>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatUSD(stats.totalSpending)}
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <ArrowDownLeft className="h-3.5 w-3.5 text-red-500 shrink-0" />
              Expenses in last 90 days
            </span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shrink-0">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
        </motion.div>

        {/* Card 2: Highest Transaction */}
        <motion.div
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs flex items-start justify-between"
        >
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-tight block">Highest Expense</span>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatUSD(stats.highestTransaction)}
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              Single peak outlier size
            </span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <DollarSign className="h-4.5 w-4.5" />
          </div>
        </motion.div>

        {/* Card 3: Average Expense */}
        <motion.div
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs flex items-start justify-between"
        >
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-tight block">Average Spending</span>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatUSD(stats.averageTransactionValue)}
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              Calculated per debit item
            </span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
            <Activity className="h-4.5 w-4.5" />
          </div>
        </motion.div>

        {/* Card 4: Financial Risk Score */}
        <motion.div
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-0.5">
              <span className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-tight block">Risk Score Rating</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold text-slate-900">{stats.riskScore}</span>
                <span className="text-xs font-medium text-slate-400">/100</span>
              </div>
            </div>
            <div className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${getRiskColor(stats.riskScore)}`}>
              {stats.riskScore < 35 ? "Healthy" : stats.riskScore < 65 ? "Moderate" : "Elevated"}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${stats.riskScore}%` }}
                className={`h-full rounded-full transition-all duration-500 ${getRiskProgressColor(stats.riskScore)}`}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block">
              {stats.anomaliesCount > 0
                ? `Affected by ${stats.anomaliesCount} unusual transaction outliers`
                : "No abnormal expense triggers flagged"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Trend Bar Chart */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 text-indigo-500" />
              Monthly Spending Trend
            </h4>
          </div>
          <div className="h-[250px] w-full">
            {stats.monthlySpending.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlySpending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} fontWeight={600} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} fontWeight={600} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "#F8FAFC" }}
                    contentStyle={{ background: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}
                    formatter={(val: number) => [formatUSD(val), "Spent"]}
                  />
                  <Bar dataKey="amount" fill="#4F46E5" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className="text-sm text-slate-400 font-semibold">No trend data available.</p>
                <p className="text-xs text-slate-400">Import statements to view trend.</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs lg:col-span-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="h-4.5 w-4.5 text-indigo-500" />
            Category Allocation
          </h4>

          {stats.categoryBreakdown.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-[250px]">
              <div className="h-[170px] w-[170px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {stats.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0" }}
                      formatter={(val: number) => [formatUSD(val), "Allocated"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-2 w-full overflow-y-auto max-h-[220px]">
                {stats.categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-slate-600 text-[11px]">{cat.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-950 block text-[11px]">{formatUSD(cat.amount)}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block -mt-0.5">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-center">
              <p className="text-sm text-slate-400 font-semibold">No category breakdown available.</p>
              <p className="text-xs text-slate-400">Import debit transactions first.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/55">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Statement Log & Activity
          </h4>
          <span className="text-xs font-semibold text-slate-400">
            Showing latest {transactions.length} items
          </span>
        </div>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm text-slate-600">
              <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Merchant / Description</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 font-semibold text-slate-600">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F8F9FB]/50 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap text-slate-400 font-bold font-mono text-xs">
                      {tx.date}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold max-w-[250px] truncate text-xs">{tx.description}</span>
                        {tx.isAnomaly && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[9px] text-red-600 font-bold uppercase tracking-wider bg-red-50 border border-red-100 rounded px-1.5 py-0.5 w-fit">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            Suspicious Activity ({Math.round(tx.anomalyScore * 100)}%)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        style={{
                          backgroundColor: `${getCategoryColor(tx.category)}15`,
                          color: getCategoryColor(tx.category),
                          borderColor: `${getCategoryColor(tx.category)}25`,
                        }}
                        className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border"
                      >
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      <span className={`font-bold text-xs ${tx.amount < 0 ? "text-slate-900" : "text-emerald-600"}`}>
                        {tx.amount < 0 ? "-" : "+"}
                        {formatUSD(Math.abs(tx.amount))}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-all cursor-pointer inline-flex"
                        title="Delete record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Activity className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500 font-semibold">No transactions found</p>
            <p className="text-xs text-slate-400">Add manual transactions or upload statements above</p>
          </div>
        )}
      </div>
    </div>
  );
}
