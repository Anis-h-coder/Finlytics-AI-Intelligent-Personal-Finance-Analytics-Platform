import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, BrainCircuit, RefreshCw, Printer, AlertCircle, FileText, CheckCircle } from "lucide-react";

interface AIAdvisorProps {
  token: string;
}

export default function AIAdvisor({ token }: AIAdvisorProps) {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const fetchAdvice = async (isRegen = false) => {
    if (isRegen) setRegenerating(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/advice", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate AI advice");
      setAdvice(data.advice);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, [token]);

  // A pristine custom markdown-to-HTML parser to guarantee seamless, styling-controlled, high-contrast typography
  const renderFormattedMarkdown = (text: string) => {
    if (!text) return null;

    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentTableRows: string[][] = [];
    let inTable = false;

    const flushTable = (key: number) => {
      if (currentTableRows.length === 0) return null;
      
      // Filter out separator row
      const rows = currentTableRows.filter(
        row => !row.every(cell => cell.trim().match(/^[ :-]+$/))
      );

      if (rows.length === 0) return null;

      const hasHeaders = currentTableRows[1] && currentTableRows[1].every(cell => cell.trim().match(/^[ :-]+$/));
      const headerRow = hasHeaders ? rows[0] : null;
      const dataRows = hasHeaders ? rows.slice(1) : rows;

      return (
        <div key={`table-${key}`} className="my-4 overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            {headerRow && (
              <thead className="bg-slate-50 text-slate-700 font-bold">
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="px-4 py-2.5 font-bold border-r border-slate-150 last:border-0">
                      {parseInlineStyling(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-200 bg-white text-slate-600 font-semibold">
              {dataRows.map((r, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                  {r.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2.5 border-r border-slate-150 last:border-0">
                      {parseInlineStyling(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("|") && trimmedLine.endsWith("|")) {
        inTable = true;
        const cells = trimmedLine.split("|").slice(1, -1);
        currentTableRows.push(cells);
        continue;
      } else {
        if (inTable) {
          elements.push(flushTable(i));
          currentTableRows = [];
          inTable = false;
        }
      }

      if (trimmedLine === "") {
        elements.push(<div key={`empty-${i}`} className="h-3" />);
        continue;
      }

      // Headers level 3
      if (trimmedLine.startsWith("### ")) {
        elements.push(
          <h4 key={`h3-${i}`} className="text-sm font-bold text-indigo-950 uppercase tracking-wider mt-5 mb-2 border-b border-slate-200 pb-1 flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-indigo-600 shrink-0" />
            {parseInlineStyling(trimmedLine.replace("### ", ""))}
          </h4>
        );
        continue;
      }

      // Headers level 4
      if (trimmedLine.startsWith("#### ")) {
        elements.push(
          <h5 key={`h4-${i}`} className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-4 mb-1.5">
            {parseInlineStyling(trimmedLine.replace("#### ", ""))}
          </h5>
        );
        continue;
      }

      // Headers level 2
      if (trimmedLine.startsWith("## ")) {
        elements.push(
          <h3 key={`h2-${i}`} className="text-base font-bold text-indigo-950 mt-6 mb-3 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
            {parseInlineStyling(trimmedLine.replace("## ", ""))}
          </h3>
        );
        continue;
      }

      // Bullet items
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ") || trimmedLine.startsWith("• ")) {
        const cleanContent = trimmedLine.substring(2);
        elements.push(
          <li key={`bullet-${i}`} className="list-none pl-5 relative text-xs text-slate-600 font-semibold leading-relaxed my-1.5">
            <span className="absolute left-1 top-2.5 h-1 w-1 rounded-full bg-indigo-500" />
            {parseInlineStyling(cleanContent)}
          </li>
        );
        continue;
      }

      // Standard paragraphs
      elements.push(
        <p key={`p-${i}`} className="text-xs text-slate-600 font-semibold leading-relaxed my-1.5">
          {parseInlineStyling(trimmedLine)}
        </p>
      );
    }

    if (inTable) {
      elements.push(flushTable(lines.length));
    }

    return elements;
  };

  // Parses bold **text** and highlights them with <strong> tags in TSX
  const parseInlineStyling = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-slate-900 bg-slate-50/50 px-1 py-0.5 rounded border border-slate-200 mx-0.5">
            {part.substring(2, part.length - 2)}
          </strong>
        );
      }
      return part;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Advisor Headline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 rounded bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider block">
              Gemini AI Financial Advisor
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
              Real-time deep cognitive analysis of your uploaded statements & budgeting risks
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchAdvice(true)}
            disabled={loading || regenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 text-xs font-bold rounded-md transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
            <span>Regenerate</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 text-xs font-bold rounded-md transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Export Advice</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center shadow-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-600">Analyzing transaction metrics with Gemini AI...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-start gap-2 shadow-xs">
          <AlertCircle className="h-4.5 w-4.5 text-red-600 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <motion.div
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 relative"
        >
          {/* Subtle decoration */}
          <div className="absolute top-5 right-5 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-indigo-500 animate-pulse" /> Secure Sandbox Insight
          </div>

          <div className="prose max-w-none prose-slate pt-3">
            {renderFormattedMarkdown(advice)}
          </div>
        </motion.div>
      )}
    </div>
  );
}
