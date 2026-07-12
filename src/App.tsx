import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  ShieldAlert,
  TrendingUp,
  BrainCircuit,
  Plus,
  ArrowRight,
  Menu,
  X,
  RefreshCw,
  AlertTriangle,
  Trash2,
  FileDown,
} from "lucide-react";

import Auth from "./components/Auth";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Anomalies from "./components/Anomalies";
import Forecast from "./components/Forecast";
import AIAdvisor from "./components/AIAdvisor";
import AddTransaction from "./components/AddTransaction";
import { exportDashboardToPDF } from "./utils/pdfGenerator";

import { DashboardStats, Transaction } from "./types";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("finlytics_token"));
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "anomalies" | "forecast" | "advice">("dashboard");

  // Dashboard Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Mobile sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Confirmation Dialog States
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<number | null>(null);

  // Authenticate on startup if token is stored in localStorage
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setAuthChecked(true);
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setUser(data.user);
          // Fetch main workspace details
          await fetchWorkspaceData(token);
        } else {
          // Token expired or invalid
          handleSignOut();
        }
      } catch {
        // network issue, keep token offline for safety or prompt
        handleSignOut();
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [token]);

  const handleAuthSuccess = async (newToken: string, newUser: { id: number; email: string; name: string }) => {
    localStorage.setItem("finlytics_token", newToken);
    setToken(newToken);
    setUser(newUser);
    await fetchWorkspaceData(newToken);
  };

  const handleSignOut = () => {
    localStorage.removeItem("finlytics_token");
    setToken(null);
    setUser(null);
    setTransactions([]);
    setStats(null);
    setActiveTab("dashboard");
  };

  const fetchWorkspaceData = async (authToken = token, showSpinner = true) => {
    if (!authToken) return;
    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      // 1. Fetch Transactions list
      const txRes = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const txData = await txRes.json();

      // 2. Fetch Dashboard Analytics
      const statsRes = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const statsData = await statsRes.json();

      if (txRes.ok && txData.success) {
        // Map backend keys (snake_case) to frontend keys (camelCase)
        const mappedTx = txData.transactions.map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          date: t.date,
          description: t.description,
          amount: t.amount,
          category: t.category,
          isAnomaly: t.is_anomaly === 1,
          anomalyScore: t.anomaly_score,
        }));
        setTransactions(mappedTx);
      }

      if (statsRes.ok && statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error("Failed to load workspace metrics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteTransaction = (id: number) => {
    if (!token) return;
    setTxToDelete(id);
  };

  const confirmDeleteTransaction = async () => {
    if (!token || txToDelete === null) return;
    try {
      setLoading(true);
      const id = txToDelete;
      setTxToDelete(null);
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        // Refresh metrics to keep everything aligned
        await fetchWorkspaceData(token, false);
      }
    } catch (err) {
      console.error("Failed to delete transaction:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!stats || !user) return;
    exportDashboardToPDF(stats, transactions, user);
  };

  const handleClearAllTransactions = () => {
    if (!token) return;
    setConfirmClearOpen(true);
  };

  const confirmClearAllTransactions = async () => {
    if (!token) return;
    setConfirmClearOpen(false);
    try {
      setLoading(true);
      const response = await fetch("/api/transactions/clear", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchWorkspaceData(token, true);
      } else {
        const data = await response.json();
        console.error("Clear error:", data.error || "Failed to clear transactions");
      }
    } catch (err: any) {
      console.error("Failed to clear transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-2" />
        <span className="text-xs font-semibold text-slate-500">Securing environment...</span>
      </div>
    );
  }

  // If user is not logged in, render authentication layout
  if (!token || !user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const tabs = [
    { id: "dashboard", label: "Smart Dashboard", icon: Wallet },
    { id: "anomalies", label: "ML Anomalies", icon: ShieldAlert },
    { id: "forecast", label: "Future Forecast", icon: TrendingUp },
    { id: "advice", label: "AI Advisor", icon: BrainCircuit },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col font-sans antialiased text-slate-800">
      {/* Navigation Header */}
      <Header user={user} onSignOut={handleSignOut} />

      {/* Main Workspace Frame */}
      <div className="mx-auto px-6 sm:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-6 w-full">
        
        {/* Mobile menu triggers */}
        <div className="lg:hidden flex justify-between items-center bg-white px-4 py-3 border border-slate-200 rounded-xl shadow-xs">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-2 text-slate-700 font-semibold text-sm cursor-pointer"
          >
            <Menu className="h-5 w-5" />
            <span>Navigation Menu</span>
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => fetchWorkspaceData(token, false)}
              disabled={refreshing}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <AddTransaction token={token} onSuccess={() => fetchWorkspaceData(token, false)} />
          </div>
        </div>

        {/* Sidebar Frame */}
        <div
          className={`${
            isSidebarOpen ? "block" : "hidden"
          } lg:block lg:w-60 shrink-0 space-y-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs h-fit sticky top-22`}
        >
          <div className="flex items-center justify-between lg:hidden border-b border-slate-100 pb-3 mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-md transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold uppercase transition-all duration-150 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 pt-4 space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</span>
              
              <button
                onClick={() => fetchWorkspaceData(token, false)}
                disabled={refreshing}
                className="w-full flex items-center justify-between px-3.5 py-2 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 text-slate-600 text-xs font-semibold rounded-md bg-slate-50/50 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="flex items-center gap-1.5">
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh Ledger
                </span>
              </button>

              <button
                onClick={handleExportPDF}
                disabled={!stats || loading}
                className="w-full flex items-center justify-between px-3.5 py-2 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 text-slate-600 text-xs font-semibold rounded-md bg-slate-50/50 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="flex items-center gap-1.5">
                  <FileDown className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  Export PDF Report
                </span>
              </button>

              <button
                onClick={handleClearAllTransactions}
                disabled={loading}
                className="w-full flex items-center justify-between px-3.5 py-2 border border-red-200 hover:border-red-400 hover:text-red-700 text-red-600 text-xs font-semibold rounded-md bg-red-50/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="flex items-center gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  Clear All Data
                </span>
              </button>
            </div>

            <AddTransaction token={token} onSuccess={() => fetchWorkspaceData(token, false)} />
          </div>

          {/* AI ADVISOR STATUS Widget */}
          <div className="border-t border-slate-200 pt-4">
            <div className="bg-slate-900 rounded-xl p-4">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">AI Advisor Status</p>
              <p className="text-white text-xs flex items-center gap-2 font-medium">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Gemini Live Engine Ready
              </p>
            </div>
          </div>
        </div>

        {/* Content Workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center flex-1 flex flex-col items-center justify-center shadow-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-3" />
              <p className="text-sm font-semibold text-slate-600">Recalibrating machine learning workspace...</p>
              <p className="text-xs text-slate-400 mt-1">Calculating TF-IDF, Isolation Forest, and Prophet lines...</p>
            </div>
          ) : !stats ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center flex-1 flex flex-col items-center justify-center shadow-xs">
              <Wallet className="h-10 w-10 text-slate-300 mb-2 animate-bounce" />
              <p className="text-sm font-semibold text-slate-600">Dashboard is currently empty</p>
              <p className="text-xs text-slate-400 mt-1">Please insert some bank transaction records to begin.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                {activeTab === "dashboard" && (
                  <Dashboard
                    stats={stats}
                    transactions={transactions}
                    onDeleteTransaction={handleDeleteTransaction}
                    onExportPDF={handleExportPDF}
                  />
                )}

                {activeTab === "anomalies" && (
                  <Anomalies
                    transactions={transactions}
                    onDeleteTransaction={handleDeleteTransaction}
                  />
                )}

                {activeTab === "forecast" && <Forecast token={token} />}

                {activeTab === "advice" && <AIAdvisor token={token} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

      </div>

      {/* Custom Confirmation Modals */}
      <AnimatePresence>
        {confirmClearOpen && (
          <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3 text-red-600">
                <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide">Clear All Transaction Data?</h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                    Are you absolutely sure you want to clear your entire ledger? This will permanently delete all your transactions and reset your machine learning models to a completely clean slate.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                >
                  Cancel, Keep Data
                </button>
                <button
                  type="button"
                  onClick={confirmClearAllTransactions}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Yes, Clear Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {txToDelete !== null && (
          <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3 text-amber-600">
                <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide">Delete Transaction?</h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                    Are you sure you want to delete this transaction record? This will trigger a recalibration of your financial models and anomaly baselines.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTxToDelete(null)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTransaction}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-md shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
