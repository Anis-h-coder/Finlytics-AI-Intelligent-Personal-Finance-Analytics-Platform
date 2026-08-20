import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Upload, X, FileText, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";

interface AddTransactionProps {
  token: string;
  onSuccess: () => void;
}

export default function AddTransaction({ token, onSuccess }: AddTransactionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<"manual" | "upload" | "ocr">("manual");

  // OCR state
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [extractedReceipt, setExtractedReceipt] = useState<any>(null);

  const handleReceiptOcrProcess = async () => {
    if (!ocrImage && !ocrText) return;
    setOcrLoading(true);
    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageBase64: ocrImage || undefined,
          textContent: ocrText || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setExtractedReceipt(data.receipt);
      } else {
        throw new Error(data.error || "Failed to parse receipt");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSaveReceiptTx = async () => {
    if (!extractedReceipt) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: extractedReceipt.date || new Date().toISOString().split("T")[0],
          description: extractedReceipt.merchant || "Receipt Expense",
          amount: Number(extractedReceipt.totalAmount),
          category: extractedReceipt.category || "Food",
        }),
      });
      if (res.ok) {
        setIsOpen(false);
        setExtractedReceipt(null);
        setOcrImage(null);
        setOcrText("");
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Manual transaction states
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(""); // empty means server auto-categorizes!
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Bulk upload states
  const [dragActive, setDragActive] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [mappedColumns, setMappedColumns] = useState<{ date: string; description: string; amount: string; category?: string }>({
    date: "",
    description: "",
    amount: "",
    category: "",
  });
  const [availableHeaders, setAvailableHeaders] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clearFirst, setClearFirst] = useState(false);

  const resetManualForm = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setAmount("");
    setCategory("");
    setError(null);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) {
      setError("Please fill out Description and Amount");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          description,
          amount: Number(amount),
          category: category || undefined, // send undefined so server auto-detects
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add transaction");

      resetManualForm();
      setIsOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Parsing CSV Statement helper
  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) return [];

    const parseLine = (line: string) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length <= headers.length && values.length > 0) {
        const row: any = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || "";
        });
        rows.push(row);
      }
    }
    return { headers, rows };
  };

  const handleFileChange = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Only standard .csv file uploads are supported");
      return;
    }
    setError(null);
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSVText(text);
      if ("headers" in parsed) {
        setAvailableHeaders(parsed.headers);
        setPreviewRows(parsed.rows);

        // Auto-detect columns intelligently
        const lowerHeaders = parsed.headers.map((h) => h.toLowerCase());
        const matched: { date: string; description: string; amount: string; category?: string } = {
          date: "",
          description: "",
          amount: "",
          category: "",
        };

        lowerHeaders.forEach((h, idx) => {
          const originalHeader = parsed.headers[idx];
          if (h.includes("date") || h === "day" || h === "time") {
            matched.date = originalHeader;
          } else if (h.includes("desc") || h.includes("merchant") || h.includes("name") || h.includes("payee") || h.includes("detail")) {
            matched.description = originalHeader;
          } else if (h.includes("amount") || h.includes("value") || h.includes("cost") || h.includes("total") || h.includes("sum")) {
            matched.amount = originalHeader;
          } else if (h.includes("cat") || h.includes("type") || h.includes("group") || h.includes("tag")) {
            matched.category = originalHeader;
          }
        });

        // Set matching fallback
        setMappedColumns({
          date: matched.date || parsed.headers[0] || "",
          description: matched.description || parsed.headers[1] || "",
          amount: matched.amount || parsed.headers[2] || "",
          category: matched.category || "",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleBulkUpload = async () => {
    if (!csvFile || previewRows.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      if (clearFirst) {
        const clearRes = await fetch("/api/transactions/clear", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!clearRes.ok) {
          const clearData = await clearRes.json();
          throw new Error(clearData.error || "Failed to clear existing transactions before upload");
        }
      }

      // Map columns correctly to what server expects: date, description, amount
      const mappedTransactions = previewRows
        .map((row) => {
          const rawDate = row[mappedColumns.date];
          const rawDesc = row[mappedColumns.description];
          const rawAmt = row[mappedColumns.amount];

          if (!rawDate || !rawDesc || !rawAmt) return null;

          // Clean date to standard YYYY-MM-DD
          let cleanDate = new Date().toISOString().split("T")[0];
          if (rawDate) {
            const parsedDate = new Date(rawDate);
            if (!isNaN(parsedDate.getTime())) {
              cleanDate = parsedDate.toISOString().split("T")[0];
            } else {
              // Try delimited date parsing (e.g. DD/MM/YYYY or MM/DD/YYYY)
              const parts = String(rawDate).trim().split(/[\/\-\.\s]+/);
              if (parts.length >= 3) {
                const p0 = parseInt(parts[0], 10);
                const p1 = parseInt(parts[1], 10);
                const p2 = parseInt(parts[2], 10);
                if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
                  let year = p0 > 1000 ? p0 : (p2 > 1000 ? p2 : (p2 < 100 ? 2000 + p2 : p2));
                  let month = p0 > 1000 ? p1 : p0;
                  let day = p0 > 1000 ? p2 : p1;
                  if (month > 12 && day <= 12) {
                    const tmp = month;
                    month = day;
                    day = tmp;
                  }
                  if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                    const d = new Date(year, month - 1, day);
                    if (!isNaN(d.getTime())) {
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, "0");
                      const dd = String(d.getDate()).padStart(2, "0");
                      cleanDate = `${yyyy}-${mm}-${dd}`;
                    }
                  }
                }
              }
            }
          }

          // Clean amount: strip dollar signs, commas, and convert to number
          let cleanAmt = Number(String(rawAmt).replace(/[\$,]/g, ""));
          if (isNaN(cleanAmt)) return null;

          const rawCategory = mappedColumns.category ? row[mappedColumns.category] : undefined;

          return {
            date: cleanDate,
            description: rawDesc,
            amount: cleanAmt,
            category: rawCategory || undefined,
          };
        })
        .filter(Boolean);

      if (mappedTransactions.length === 0) {
        throw new Error("Could not map any valid transaction rows. Please review column mappings.");
      }

      const response = await fetch("/api/transactions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transactions: mappedTransactions }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload bulk statement");

      // Reset
      setCsvFile(null);
      setPreviewRows([]);
      setIsOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        id="btn-add-tx"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-xs transition-all cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Add Transactions</span>
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/55">
                <h3 className="text-sm font-bold text-slate-900">Add Bank Transactions</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-all"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50/20">
                <button
                  onClick={() => setActiveTab("manual")}
                  className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition-all ${
                    activeTab === "manual"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Single Transaction
                </button>
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition-all ${
                    activeTab === "upload"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  CSV Statement Upload
                </button>
                <button
                  onClick={() => setActiveTab("ocr")}
                  className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition-all ${
                    activeTab === "ocr"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Receipt OCR Scan
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg flex items-start gap-2 shadow-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {activeTab === "manual" ? (
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Transaction Date
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-indigo-500 transition-all text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Description / Payee
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Starbucks Coffee"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all text-xs font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Amount ($ USD)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="-25.00 or 1500"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all text-xs font-semibold"
                        />
                        <span className="text-[9px] text-slate-400 font-bold mt-1 block">
                          Negative: cost | Positive: income
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Category (Optional)
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-indigo-500 transition-all text-xs font-semibold"
                        >
                          <option value="">🤖 Auto-Detect (TF-IDF)</option>
                          <option value="Food">Food 🍔</option>
                          <option value="Transport">Transport 🚗</option>
                          <option value="Shopping">Shopping 🛍️</option>
                          <option value="Income">Income 💰</option>
                          <option value="Utilities">Utilities ⚡</option>
                        </select>
                        <span className="text-[9px] text-indigo-500 font-bold mt-1 block">
                          Let Finlytics ML classify
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-200 mt-4">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-3.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-xs transition-all cursor-pointer"
                      >
                        {submitting ? "Adding..." : "Add Transaction"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {!csvFile ? (
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                          dragActive
                            ? "border-indigo-500 bg-indigo-50/30"
                            : "border-slate-200 hover:border-indigo-400 bg-slate-50/20"
                        }`}
                      >
                        <Upload className="h-8 w-8 text-slate-400 mb-2.5" />
                        <p className="text-xs font-bold text-slate-700 mb-1">
                          Drag and drop your statement CSV here
                        </p>
                        <p className="text-[10px] text-slate-400 max-w-[220px]">
                          Supports any formatted banking statement spreadsheet
                        </p>
                        <button
                          type="button"
                          className="mt-3.5 px-3 py-1 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 text-[10px] font-bold rounded-md shadow-xs transition-all"
                        >
                          Select File
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* File details */}
                        <div className="flex items-center justify-between p-3 bg-indigo-50/55 border border-indigo-100 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5.5 w-5.5 text-indigo-600" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">{csvFile.name}</p>
                              <p className="text-[10px] text-indigo-600 font-bold mt-0.5">
                                Detected {previewRows.length} transactions
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setCsvFile(null);
                              setPreviewRows([]);
                            }}
                            className="p-1 hover:bg-indigo-100 text-indigo-600 rounded transition-all"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Column matching options */}
                        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <HelpCircle className="h-4 w-4 text-indigo-500" />
                            Verify Column Mappings
                          </p>

                          <div className="grid grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Date Field
                              </label>
                              <select
                                value={mappedColumns.date}
                                onChange={(e) => setMappedColumns({ ...mappedColumns, date: e.target.value })}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold focus:outline-none"
                              >
                                {availableHeaders.map((h) => (
                                  <option key={h} value={h}>
                                    {h}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Description
                              </label>
                              <select
                                value={mappedColumns.description}
                                onChange={(e) => setMappedColumns({ ...mappedColumns, description: e.target.value })}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold focus:outline-none"
                              >
                                {availableHeaders.map((h) => (
                                  <option key={h} value={h}>
                                    {h}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Amount Field
                              </label>
                              <select
                                value={mappedColumns.amount}
                                onChange={(e) => setMappedColumns({ ...mappedColumns, amount: e.target.value })}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold focus:outline-none"
                              >
                                {availableHeaders.map((h) => (
                                  <option key={h} value={h}>
                                    {h}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Category (Optional)
                              </label>
                              <select
                                value={mappedColumns.category || ""}
                                onChange={(e) => setMappedColumns({ ...mappedColumns, category: e.target.value })}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold focus:outline-none"
                              >
                                <option value="">Auto-Detect Category</option>
                                {availableHeaders.map((h) => (
                                  <option key={h} value={h}>
                                    {h}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Statement Table Preview */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-36 overflow-y-auto shadow-xs">
                          <table className="min-w-full divide-y divide-slate-100 text-[10px] text-slate-500">
                            <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 uppercase tracking-wider">
                              <tr>
                                <th className="px-3 py-1.5 text-left">Date Preview</th>
                                <th className="px-3 py-1.5 text-left">Description Preview</th>
                                <th className="px-3 py-1.5 text-left">Category</th>
                                <th className="px-3 py-1.5 text-right">Amount Preview</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100 font-semibold">
                              {previewRows.slice(0, 5).map((row, idx) => (
                                <tr key={idx}>
                                  <td className="px-3 py-1.5 font-bold text-slate-400 font-mono">
                                    {row[mappedColumns.date] || <span className="text-red-400">Missing</span>}
                                  </td>
                                  <td className="px-3 py-1.5 truncate max-w-[150px] text-slate-700">
                                    {row[mappedColumns.description] || <span className="text-red-400">Missing</span>}
                                  </td>
                                  <td className="px-3 py-1.5 text-slate-500">
                                    {mappedColumns.category ? row[mappedColumns.category] || "Auto" : "Auto"}
                                  </td>
                                  <td className="px-3 py-1.5 text-right font-bold text-slate-800">
                                    {row[mappedColumns.amount] || <span className="text-red-400">Missing</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {previewRows.length > 5 && (
                            <p className="text-[9px] text-slate-400 text-center py-1 bg-slate-50/50 border-t border-slate-100 font-bold">
                              Showing top 5 of {previewRows.length} rows
                            </p>
                          )}
                        </div>

                        {/* Optional Clear existing database transactions toggle */}
                        <div className="flex items-center gap-2.5 p-2.5 bg-indigo-50/40 border border-indigo-100/70 rounded-xl text-slate-600 mt-3 shadow-2xs">
                          <input
                            type="checkbox"
                            id="clear-existing-chk"
                            checked={clearFirst}
                            onChange={(e) => setClearFirst(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer shrink-0"
                          />
                          <label htmlFor="clear-existing-chk" className="text-[10px] font-bold text-slate-500 cursor-pointer select-none leading-tight">
                            Wipe existing ledger transactions before importing (Recommended to start on a clean slate)
                          </label>
                        </div>

                        <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-200 mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setCsvFile(null);
                              setPreviewRows([]);
                            }}
                            className="px-3.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold hover:bg-slate-100 rounded-md transition-all"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={handleBulkUpload}
                            disabled={submitting}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            {submitting ? "Uploading..." : "Confirm & Import Statement"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "ocr" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">
                      Upload receipt image or paste raw text receipt to automatically extract merchant, date, total, tax, and category.
                    </p>

                    {!extractedReceipt ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">
                            Upload Receipt File (JPEG, PNG, PDF)
                          </label>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => setOcrImage(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                          />
                        </div>

                        <div className="relative flex py-1 items-center">
                          <div className="flex-grow border-t border-slate-200"></div>
                          <span className="shrink-0 mx-2 text-[10px] text-slate-400 font-bold uppercase">Or paste raw text</span>
                          <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        <div>
                          <textarea
                            rows={4}
                            value={ocrText}
                            onChange={(e) => setOcrText(e.target.value)}
                            placeholder="Paste text from electronic invoice or receipt..."
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500 bg-slate-50"
                          ></textarea>
                        </div>

                        <button
                          type="button"
                          onClick={handleReceiptOcrProcess}
                          disabled={ocrLoading || (!ocrImage && !ocrText)}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {ocrLoading ? "Extracting Details via Gemini OCR..." : "Extract Receipt Details"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 text-xs">
                        <h4 className="font-bold text-slate-900 border-b border-indigo-100 pb-2">Verified Receipt Extraction</h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold uppercase block">Merchant</label>
                            <input
                              type="text"
                              value={extractedReceipt.merchant || ""}
                              onChange={(e) => setExtractedReceipt({ ...extractedReceipt, merchant: e.target.value })}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold uppercase block">Total Amount ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={extractedReceipt.totalAmount || ""}
                              onChange={(e) => setExtractedReceipt({ ...extractedReceipt, totalAmount: Number(e.target.value) })}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-indigo-600"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold uppercase block">Date</label>
                            <input
                              type="date"
                              value={extractedReceipt.date || ""}
                              onChange={(e) => setExtractedReceipt({ ...extractedReceipt, date: e.target.value })}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold uppercase block">Category</label>
                            <select
                              value={extractedReceipt.category || "Food"}
                              onChange={(e) => setExtractedReceipt({ ...extractedReceipt, category: e.target.value })}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-900"
                            >
                              <option value="Food">Food</option>
                              <option value="Transport">Transport</option>
                              <option value="Shopping">Shopping</option>
                              <option value="Utilities">Utilities</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setExtractedReceipt(null)}
                            className="px-3 py-1.5 text-slate-500 font-bold hover:bg-slate-100 rounded text-xs"
                          >
                            Re-scan
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveReceiptTx}
                            disabled={submitting}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs shadow-xs"
                          >
                            {submitting ? "Saving..." : "Save Receipt Transaction"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
