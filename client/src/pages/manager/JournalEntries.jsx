import React, { useState, useMemo } from "react";
import {
  FileSignature,
  Plus,
  Trash2,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Save,
  MapPin,
  Calendar,
  Hash,
  AlignLeft,
  FileText,
} from "lucide-react";

// --- DUMMY CHART OF ACCOUNTS (COA) ---
const MOCK_COA = [
  { code: "1000", name: "Cash-on-Hand", type: "Asset" },
  { code: "1100", name: "Cash in Bank", type: "Asset" },
  { code: "1200", name: "Inventory Assets", type: "Asset" },
  { code: "1501", name: "Accumulated Depreciation", type: "Asset" },
  { code: "2000", name: "Accounts Payable", type: "Liability" },
  { code: "3000", name: "Owner's Drawing", type: "Equity" },
  { code: "4000", name: "Labor Revenue", type: "Revenue" },
  { code: "5100", name: "Cost of Goods Sold", type: "Expense" },
  { code: "5400", name: "Bank Service Charges", type: "Expense" },
  { code: "5500", name: "Depreciation Expense", type: "Expense" },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount || 0,
  );

const JournalEntries = () => {
  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    branch: "",
    reference: "",
    memo: "",
    documentAttached: false,
  });

  // --- DYNAMIC GRID STATE ---
  // A journal entry must have at least 2 lines (Debit & Credit)
  const [lines, setLines] = useState([
    { id: 1, accountCode: "", description: "", debit: "", credit: "" },
    { id: 2, accountCode: "", description: "", debit: "", credit: "" },
  ]);

  // --- CALCULATIONS & HARD-LOCK VALIDATION ---
  const totals = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        acc.debit += Number(line.debit) || 0;
        acc.credit += Number(line.credit) || 0;
        return acc;
      },
      { debit: 0, credit: 0 },
    );
  }, [lines]);

  const difference = Math.abs(totals.debit - totals.credit);
  const isBalanced = totals.debit > 0 && difference === 0;

  // The ultimate form validator: Must be balanced, have a branch, a ref, and evidence.
  const isFormValid =
    isBalanced &&
    formData.branch &&
    formData.reference &&
    formData.documentAttached;

  // --- HANDLERS ---
  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        id: Date.now(),
        accountCode: "",
        description: "",
        debit: "",
        credit: "",
      },
    ]);
  };

  const handleRemoveLine = (id) => {
    if (lines.length <= 2) return; // Enforce minimum 2 lines
    setLines(lines.filter((line) => line.id !== id));
  };

  const handleLineChange = (id, field, value) => {
    setLines(
      lines.map((line) => {
        if (line.id === id) {
          const newLine = { ...line, [field]: value };
          // UX Helper: If they type in Debit, clear Credit, and vice versa
          if (field === "debit" && value !== "") newLine.credit = "";
          if (field === "credit" && value !== "") newLine.debit = "";
          return newLine;
        }
        return line;
      }),
    );
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSimulateUpload = () => {
    setFormData({ ...formData, documentAttached: true });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <FileSignature className="text-indigo-500" size={28} />
            General Journal
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Manual Adjustments & Forensic Entry
          </p>
        </div>

        {/* PERMANENCE WARNING */}
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
          <AlertCircle
            size={16}
            className="text-amber-600 dark:text-amber-400"
          />
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
            Warning: Posted entries are permanent
          </p>
        </div>
      </div>

      {/* TOP SECTION: TRANSACTION METADATA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest border-b border-slate-100 dark:border-white/10 pb-4 mb-4">
            Transaction Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <MapPin size={12} /> Branch Assignment{" "}
                <span className="text-rose-500">*</span>
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="" disabled>
                  Select target branch...
                </option>
                <option value="Global">Global / Head Office</option>
                <option value="Calamba">Calamba</option>
                <option value="Batino">Batino</option>
                <option value="Biñan">Biñan</option>
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Calendar size={12} /> Posting Date{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Reference Number */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Hash size={12} /> Reference ID / Check No.{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="reference"
                placeholder="e.g., CHK-88921 or BANK-FEE-01"
                value={formData.reference}
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>

            {/* Memo / Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <AlignLeft size={12} /> Internal Memo
              </label>
              <input
                type="text"
                name="memo"
                placeholder="Reason for manual adjustment..."
                value={formData.memo}
                onChange={handleFormChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* EVIDENCE UPLOAD (Mandatory for compliance) */}
        <div className="bg-slate-900 dark:bg-black/40 p-6 rounded-3xl border border-slate-800 dark:border-white/10 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
          <FileText size={40} className="text-indigo-500 mb-4 opacity-80" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">
            Supporting Evidence
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Auditors require physical proof for manual adjustments (e.g., Bank
            Statement, Memo).
          </p>

          {formData.documentAttached ? (
            <div className="flex items-center gap-2 px-6 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 text-xs font-black uppercase tracking-widest w-full justify-center">
              <CheckCircle2 size={16} /> Document Attached
            </div>
          ) : (
            <button
              onClick={handleSimulateUpload}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all w-full justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]"
            >
              <UploadCloud size={16} /> Upload Proof{" "}
              <span className="text-rose-300">*</span>
            </button>
          )}
        </div>
      </div>

      {/* DYNAMIC GRID: DOUBLE-ENTRY FORM */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">
            Double-Entry Ledger Lines
          </h3>
          <button
            onClick={handleAddLine}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <Plus size={12} /> Add Line
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10">
                <th className="p-4 w-1/3">
                  Account (COA) <span className="text-rose-500">*</span>
                </th>
                <th className="p-4 w-1/3">Description</th>
                <th className="p-4 w-32 text-right">Debit (₱)</th>
                <th className="p-4 w-32 text-right">Credit (₱)</th>
                <th className="p-4 w-16 text-center">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {lines.map((line, index) => (
                <tr key={line.id} className="bg-white dark:bg-slate-800">
                  <td className="p-2">
                    <select
                      value={line.accountCode}
                      onChange={(e) =>
                        handleLineChange(line.id, "accountCode", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                    >
                      <option value="" disabled>
                        Search or select account...
                      </option>
                      {MOCK_COA.map((acc) => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.name} ({acc.type})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Line memo..."
                      value={line.description}
                      onChange={(e) =>
                        handleLineChange(line.id, "description", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={line.debit}
                      onChange={(e) =>
                        handleLineChange(line.id, "debit", e.target.value)
                      }
                      disabled={line.credit !== ""}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-mono font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-right disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={line.credit}
                      onChange={(e) =>
                        handleLineChange(line.id, "credit", e.target.value)
                      }
                      disabled={line.debit !== ""}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-mono font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-right disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleRemoveLine(line.id)}
                      disabled={lines.length <= 2}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MATH LOCK FOOTER */}
        <div className="p-6 bg-slate-50 dark:bg-black/20 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-end gap-6">
          {/* Live Balance Checker */}
          <div className="w-full md:w-auto">
            <div className="flex gap-8 mb-2">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Total Debits
                </p>
                <p className="text-xl font-mono font-black text-slate-900 dark:text-white">
                  {formatCurrency(totals.debit)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Total Credits
                </p>
                <p className="text-xl font-mono font-black text-slate-900 dark:text-white">
                  {formatCurrency(totals.credit)}
                </p>
              </div>
            </div>

            {totals.debit > 0 || totals.credit > 0 ? (
              isBalanced ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle2 size={12} /> Journal is Balanced
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-md text-[10px] font-black uppercase tracking-widest">
                  <AlertCircle size={12} /> Out of balance by{" "}
                  {formatCurrency(difference)}
                </div>
              )
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md text-[10px] font-black uppercase tracking-widest">
                Awaiting Data
              </div>
            )}
          </div>

          {/* Submit Button (The Hard Validation Gate) */}
          <button
            disabled={!isFormValid}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              isFormValid
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] cursor-pointer"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700"
            }`}
          >
            <Save size={16} />
            {isFormValid ? "Post Journal Entry" : "Fix Errors to Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalEntries;
