import React, { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  TrendingDown,
  ShieldAlert,
  PiggyBank,
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  User,
} from "lucide-react";

interface CopilotProps {
  token: string | null;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  numbers?: { label: string; value: string }[];
  recommendation?: string;
  timestamp: string;
}

function parseInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2);
      if (/^(Direct Answer|Key Financial Metrics|Data Evidence|Actionable Recommendation):?$/i.test(content)) {
        return (
          <span key={idx} className="block font-black text-[11px] text-indigo-700 uppercase tracking-wider mt-3 mb-1">
            {content.replace(":", "")}
          </span>
        );
      }
      if (/^\$?[\d,]+(\.\d+)?(\/mo|\/month)?$/i.test(content)) {
        return (
          <span key={idx} className="font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 font-mono text-[11px] mx-0.5">
            {content}
          </span>
        );
      }
      return <strong key={idx} className="font-extrabold text-slate-900">{content}</strong>;
    }
    return part;
  });
}

function FormattedMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || /^\d+\.\s/.test(trimmed)) {
      const listText = trimmed.replace(/^(\* |- |\d+\.\s)/, "");
      currentList.push(listText);
      return;
    }

    flushList();

    if (!trimmed) return;

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={index} className="text-xs font-black text-indigo-900 uppercase tracking-wider mt-3 mb-1 flex items-center gap-1.5">
          {trimmed.replace("### ", "")}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={index} className="text-sm font-black text-slate-900 mt-3 mb-1">
          {trimmed.replace("## ", "")}
        </h2>
      );
    } else {
      elements.push(
        <p key={index} className="text-xs text-slate-700 leading-relaxed my-1.5">
          {parseInline(trimmed)}
        </p>
      );
    }
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

const SUGGESTED_QUESTIONS = [
  { label: "Analyze my spending", icon: Sparkles, query: "Why did my spending increase this month?" },
  { label: "Find biggest expenses", icon: TrendingDown, query: "Where am I spending the most money?" },
  { label: "Check financial risks", icon: ShieldAlert, query: "What are my biggest financial risks?" },
  { label: "Create a savings plan", icon: PiggyBank, query: "How can I save $500 next month?" },
  { label: "Compare months", icon: ArrowRightLeft, query: "Compare this month with last month." },
  { label: "Find subscriptions", icon: CalendarDays, query: "What recurring subscriptions am I paying for?" },
];

export default function Copilot({ token }: CopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I am your **AI Financial Copilot**. I analyze your real transaction data to give you clear, personal insights about your spending trends, recurring bills, risk factors, and savings potential.\n\nHow can I help you manage your money today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || !token || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: data.answer || "I could not analyze your ledger for this query.",
          numbers: data.numbers,
          recommendation: data.recommendation,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || "Failed to generate copilot response.");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `⚠️ **Copilot Notice**: ${err.message || "Unable to reach Gemini Copilot service."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
              <Bot className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-black tracking-tight">AI Financial Copilot</h1>
          </div>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            Interactive AI assistant grounded in your financial transaction history. Ask natural questions about expenses, risk factors, or budget strategies.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold bg-indigo-950/80 px-3 py-1.5 rounded-full border border-indigo-500/30 text-indigo-300 shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          Strict Grounding Engine Active
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col h-[580px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "ai" && (
                <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <Bot className="h-4.5 w-4.5" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none font-medium"
                    : "bg-slate-50/80 border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs"
                }`}
              >
                {m.sender === "ai" ? (
                  <FormattedMarkdown content={m.text} />
                ) : (
                  <div className="whitespace-pre-line leading-relaxed">{m.text}</div>
                )}

                {m.numbers && m.numbers.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                    {m.numbers.map((n, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">{n.label}</span>
                        <span className="text-sm font-extrabold text-indigo-600">{n.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {m.recommendation && (
                  <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-lg text-indigo-900 text-[11px] font-semibold flex items-start gap-1.5 mt-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-950 block">Copilot Recommendation</span>
                      {m.recommendation}
                    </div>
                  </div>
                )}

                <span className="text-[9px] opacity-60 block text-right font-mono mt-1">
                  {m.timestamp}
                </span>
              </div>

              {m.sender === "user" && (
                <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs mt-1 text-xs font-bold">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs font-medium">
              <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 animate-bounce" />
              </div>
              <span className="italic">AI Copilot is analyzing your transaction history...</span>
            </div>
          )}
        </div>

        {/* Suggested Question Chips */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(q.query)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Icon className="h-3.5 w-3.5 text-indigo-500" />
                {q.label}
              </button>
            );
          })}
        </div>

        {/* Query Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl flex gap-3 items-center">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask your AI Copilot anything about your money..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            Ask Copilot
          </button>
        </div>
      </div>

      {/* Educational Disclaimer Footer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs text-slate-500 font-medium">
        <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0" />
        <p>
          <strong>Privacy & Guidance Notice:</strong> Finlytics AI is an educational financial intelligence platform. Copilot outputs are generated strictly from your database ledger and do not constitute official regulated financial advisory or tax services.
        </p>
      </div>
    </div>
  );
}
