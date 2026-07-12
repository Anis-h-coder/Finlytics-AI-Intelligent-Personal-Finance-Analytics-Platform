import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Wallet, 
  Shield, 
  TrendingUp, 
  Sparkles, 
  AlertCircle, 
  Brain, 
  Cpu, 
  Lock, 
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";

interface AuthProps {
  onAuthSuccess: (token: string, user: { id: number; email: string; name: string }) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
    const body = isLogin ? { email, password } : { email, password, name };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans overflow-x-hidden">
      
      {/* LEFT SIDE: Systems Marketing & Interactive Showcase (Light Theme, Split Layout) */}
      <div className="hidden lg:flex lg:w-7/12 bg-gradient-to-br from-indigo-50/50 via-slate-50 to-emerald-50/30 p-12 xl:p-16 flex-col justify-between relative overflow-hidden border-r border-slate-200">
        
        {/* Soft Ambient Light Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-200/20 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

        {/* Header Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Finlytics AI</span>
            <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Intelligent Finance</span>
          </div>
        </div>

        {/* Feature Narrative & Live Mockups */}
        <div className="relative z-10 my-auto py-10 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold rounded-full tracking-wide inline-block mb-4 shadow-sm">
              AI-Powered Financial Intelligence
            </span>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Your bank statements, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                decoded in seconds.
              </span>
            </h1>
            <p className="text-slate-600 text-base leading-relaxed mb-8 font-medium">
              Stop manually tagging transaction sheets. Finlytics AI embeds custom Machine Learning models and Generative AI advisors directly into your ledger.
            </p>
          </motion.div>

          {/* Interactive UI Mock Visualizers (Premium Light Theme Card designs) */}
          <div className="space-y-5">
            
            {/* Visualizer 1: ML Classification pipeline */}
            <motion.div 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-lg shadow-slate-100 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">ML Sandbox Classification</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 animate-pulse">
                  Live Classifier
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-mono font-medium text-slate-600">"TESCO STORES LONDON"</span>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">Food & Dining</span>
                    <span className="text-[10px] text-slate-400 font-semibold">94% Conf.</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-mono font-medium text-slate-600">"UBER RIDE 10:42 AM"</span>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">Transport</span>
                    <span className="text-[10px] text-slate-400 font-semibold">98% Conf.</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Visualizer 2: Smart Predictions & Advisor */}
            <motion.div 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-lg shadow-slate-100"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mt-0.5">
                  <Brain className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">AI Advisor Insight</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    "I noticed a <span className="text-red-600 font-bold">14% increase</span> in subscription services over the last month. You could save <span className="text-emerald-700 font-bold">$45.00/mo</span> by consolidating inactive accounts."
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Footer badges */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-200/60 pt-6">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold">Encrypted Ledger Environment</span>
          </div>
          <span className="font-bold text-slate-400">v1.2.0</span>
        </div>

      </div>

      {/* RIGHT SIDE: Fully Premium Interactive Auth Form (Light Slate / Soft Neutral Background) */}
      <div className="flex-1 flex flex-col justify-start pt-12 sm:pt-16 md:pt-20 lg:pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-y-auto">
        
        {/* Subtle grid pattern background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          
          {/* Logo element for mobile viewports */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8 text-center">
            <div className="h-11 w-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Wallet className="h-5.5 w-5.5" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Finlytics AI</h2>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Intelligent Finance</p>
            </div>
          </div>

          <div className="text-center lg:text-left mb-6">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isLogin ? "Welcome back" : "Create your sandbox"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {isLogin ? "Sign in to access your intelligent ledger analytics." : "Sign up to begin auto-classifying your finances."}
            </p>
          </div>

          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white border border-slate-200 shadow-xl shadow-slate-100 rounded-3xl py-8 px-6 sm:px-10"
          >
            {/* Form Segment Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                  setShowPassword(false);
                }}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isLogin
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200/20"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                  setShowPassword(false);
                }}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  !isLogin
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200/20"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Register
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Anish"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fanish050@gmail.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Password
                  </label>
                  {isLogin && (
                    <span className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer">
                      Forgot?
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5 shrink-0" />
                    ) : (
                      <Eye className="h-4.5 w-4.5 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2.5 text-xs font-medium"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-indigo-500/10 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  <>
                    <span>{isLogin ? "Sign In" : "Create Account"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Assist Banner */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-semibold">Secure Authentication Layer</span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <Shield className="h-3 w-3" />
                Active protection
              </span>
            </div>

          </motion.div>
        </div>

      </div>

    </div>
  );
}
