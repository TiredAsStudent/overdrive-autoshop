import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  Receipt,
  Scale,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  Settings,
  Download,
  Printer,
  ShieldCheck,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  PieChart as PieIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ==========================================
// MOCK DATA ENGINE (Strictly Capstone Scope)
// ==========================================
const BASE_TRANSACTIONS = [
  {
    id: "INV-2041",
    date: "Apr 18, 2026",
    type: "OUTPUT",
    doc: "System Invoice",
    source: "Customer: R. Santos",
    isVatable: true,
    amount: 22400,
  },
  {
    id: "OCR-8921",
    date: "Apr 19, 2026",
    type: "INPUT",
    doc: "OCR Scanned Receipt",
    source: "Petron Corp",
    isVatable: true,
    amount: 16800,
  },
  {
    id: "OCR-8922",
    date: "Apr 19, 2026",
    type: "INPUT",
    doc: "OCR Scanned Receipt",
    source: "Local Sari-Sari",
    isVatable: false,
    amount: 1500,
  }, // Exempt Example
  {
    id: "INV-2042",
    date: "Apr 20, 2026",
    type: "OUTPUT",
    doc: "System Invoice",
    source: "Customer: M. Cruz",
    isVatable: true,
    amount: 33600,
  },
  {
    id: "OCR-8925",
    date: "Apr 21, 2026",
    type: "INPUT",
    doc: "OCR Scanned Receipt",
    source: "Meralco Enterprise",
    isVatable: true,
    amount: 28000,
  },
  {
    id: "INV-2045",
    date: "Apr 22, 2026",
    type: "OUTPUT",
    doc: "System Invoice",
    source: "Customer: J. Reyes",
    isVatable: true,
    amount: 11200,
  },
];

const MULTIPLIERS = { ALL: 1, BIN: 0.45, BAT: 0.35, CAB: 0.2 };

const formatMoney = (val) =>
  `₱${Number(val).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Philippine VAT Calculation Logic (12% Inclusive)
const calculateVat = (amount, isVatable) => {
  if (!isVatable) return { base: amount, vat: 0 };
  const base = amount / 1.12;
  const vat = amount - base;
  return { base, vat };
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const AdminTaxes = () => {
  const [taxRate] = useState(0.12);
  const [branch, setBranch] = useState("ALL");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Helper for UI
  const branchDisplayNames = {
    ALL: "All Branch",
    BIN: "Main Branch",
    BAT: "Second Branch",
    CAB: "Third Branch",
  };

  // --- DYNAMIC CALCULATIONS ---
  const { transactions, kpi, chartData } = useMemo(() => {
    const multiplier = MULTIPLIERS[branch];

    // Scale and calculate VAT based on branch
    let processedTx = BASE_TRANSACTIONS.map((tx) => {
      const scaledAmount = tx.amount * multiplier;
      const { base, vat } = calculateVat(scaledAmount, tx.isVatable);
      return { ...tx, scaledAmount, base, vat };
    });

    let outputVat = 0;
    let inputVat = 0;
    let exemptPurchases = 0;

    processedTx.forEach((tx) => {
      if (tx.type === "OUTPUT" && tx.isVatable) outputVat += tx.vat;
      if (tx.type === "INPUT" && tx.isVatable) inputVat += tx.vat;
      if (tx.type === "INPUT" && !tx.isVatable)
        exemptPurchases += tx.scaledAmount;
    });

    const netPayable = outputVat - inputVat;

    const pieData = [
      { name: "Output VAT (Owed)", value: outputVat, color: "#f59e0b" }, // Amber
      { name: "Input VAT (Credit)", value: inputVat, color: "#10b981" }, // Emerald
    ];

    return {
      transactions: processedTx,
      kpi: { outputVat, inputVat, netPayable, exemptPurchases },
      chartData: pieData,
    };
  }, [branch]);

  // --- HANDLERS ---
  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. TAX ENGINE STATUS HEADER (Your UI, Upgraded with Branch Selector) */}
      <div className="bg-slate-900 rounded-[32px] p-8 text-white flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 p-8 opacity-10 pointer-events-none">
          <Landmark size={120} />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 z-10">
          <div className="h-16 w-16 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20 shrink-0">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tight">
              Compliance Engine
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 z-10 w-full xl:w-auto">
          {/* Branch Selector */}
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 w-full sm:w-auto">
            <MapPin className="text-amber-500 shrink-0" size={16} />
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-transparent font-black text-white outline-none w-full cursor-pointer text-xs uppercase tracking-wider"
            >
              <option value="ALL" className="text-slate-900">
                All Branch
              </option>
              <option value="BIN" className="text-slate-900">
                Main Branch
              </option>
              <option value="BAT" className="text-slate-900">
                Second Branch
              </option>
              <option value="CAB" className="text-slate-900">
                Third Branch
              </option>
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting || exportSuccess}
            className={`w-full sm:w-auto px-6 py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 ${
              exportSuccess
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "bg-white/10 border-white/20 hover:bg-white/20 text-white"
            }`}
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : exportSuccess ? (
              <CheckCircle2 size={16} />
            ) : (
              <Download size={16} />
            )}
            {isExporting
              ? "Compiling..."
              : exportSuccess
                ? "Exported"
                : "Export BIR 2550Q"}
          </button>
        </div>
      </div>

      {/* 2. VAT KPI CARDS (Your exact UI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <ArrowUpRight size={80} className="text-amber-500" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              Output VAT{" "}
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded text-[8px]">
                Sales
              </span>
            </span>
            <ArrowUpRight className="text-amber-500" size={20} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white relative z-10 tracking-tighter">
            {formatMoney(kpi.outputVat)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter relative z-10">
            From Customer Invoices
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <ArrowDownLeft size={80} className="text-emerald-500" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              Input VAT{" "}
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 rounded text-[8px]">
                OCR
              </span>
            </span>
            <ArrowDownLeft className="text-emerald-500" size={20} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white relative z-10 tracking-tighter">
            {formatMoney(kpi.inputVat)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter relative z-10">
            From Approved Supplier OCR
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Scale size={80} className="text-amber-500" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest">
              Net VAT Payable
            </span>
            <Scale size={20} className="text-amber-500" />
          </div>
          <h3
            className={`text-4xl tracking-tighter relative z-10 font-black ${kpi.netPayable < 0 ? "text-emerald-500" : "text-slate-900 dark:text-white"}`}
          >
            {kpi.netPayable < 0
              ? `(${formatMoney(Math.abs(kpi.netPayable))})`
              : formatMoney(kpi.netPayable)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter relative z-10 flex justify-between">
            {kpi.netPayable < 0
              ? "Tax Credit Available"
              : "Current Liability to BIR"}
            <span>Scope: {branchDisplayNames[branch]}</span>
          </p>
        </div>
      </div>

      {/* 3. MAIN LEDGER & CHART (Side-by-side layout) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT PANE: VAT LEDGER TABLE (Your UI, upgraded with Audit logic) */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Receipt size={16} /> Detailed VAT Transaction Ledger
            </h3>
            <button className="text-slate-400 hover:text-amber-500 transition-colors">
              <Printer size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                  <th className="px-8 py-5">Date & ID</th>
                  <th className="px-8 py-5">Source Ref</th>
                  <th className="px-8 py-5 text-center">Tax Status</th>
                  <th className="px-8 py-5 text-right">Gross Total</th>
                  <th className="px-8 py-5 text-right">VAT (12%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                <AnimatePresence>
                  {transactions.map((tx) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">
                          {tx.date}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {tx.id}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${tx.type === "OUTPUT" ? "bg-amber-500/10 text-amber-600 dark:text-amber-500" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"}`}
                          >
                            {tx.type}
                          </span>
                          <p className="text-xs font-bold text-slate-600 dark:text-gray-300">
                            {tx.source}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        {tx.isVatable ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                            <CheckCircle2 size={12} /> Vatable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-400">
                            <AlertCircle size={12} /> Exempt
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-sm font-bold text-slate-500 dark:text-gray-400 font-mono">
                          {formatMoney(tx.scaledAmount)}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right font-black font-mono text-slate-900 dark:text-white flex items-center justify-end gap-3">
                        <span
                          className={
                            tx.type === "INPUT" && tx.isVatable
                              ? "text-emerald-500"
                              : tx.type === "OUTPUT"
                                ? "text-amber-500"
                                : "text-slate-400"
                          }
                        >
                          {tx.type === "INPUT" ? "-" : "+"}{" "}
                          {formatMoney(tx.vat)}
                        </span>
                        {/* Audit Trail Button */}
                        <button
                          className="text-slate-300 hover:text-blue-500 transition-colors"
                          title="View Source Receipt"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT PANE: Visual Analytics & Logic Footer */}
        <div className="space-y-6">
          {/* VAT Balance Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col h-[350px]">
            <div className="mb-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon size={16} className="text-blue-500" /> Offsetting Ratio
              </h3>
            </div>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatMoney(value)}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      backgroundColor: "#1e293b",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "10px", fontWeight: "black" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col mt-[-20px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Payable
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {formatMoney(kpi.netPayable)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTaxes;
