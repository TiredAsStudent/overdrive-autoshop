import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Calculator,
  Zap,
  Building2,
  Wallet,
  Lock,
  BarChart3,
  Loader2,
  CheckCircle2,
  Package,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ==========================================
// MOCK DATA ENGINE (Strictly Capstone Scope)
// ==========================================
const MOCK_FINANCIALS = {
  GLOBAL: {
    cash: {
      income: { labor: 145000, parts: 95000 },
      cogs: { parts_cost: 55000 },
      expenses: {
        rent: 45000,
        utilities: 18500,
        supplies: 12000,
        ocr_pending: 0,
      },
    },
    accrual: {
      income: { labor: 160000, parts: 110000 }, // Includes WIP
      cogs: { parts_cost: 65000 }, // Includes unpaid POs
      expenses: {
        rent: 45000,
        utilities: 18500,
        supplies: 12000,
        ocr_pending: 8000,
      }, // Unpaid OCR
    },
  },
  MULTIPLIERS: { ALL: 1, BIN: 0.45, BAT: 0.35, CAB: 0.2 },
};

// Preserved your custom branch names
const BRANCH_MATRIX_DATA = [
  { name: "Main", Revenue: 108000, Expenses: 37575, Profit: 70425 },
  { name: "Second", Revenue: 84000, Expenses: 29225, Profit: 54775 },
  { name: "Third", Revenue: 48000, Expenses: 16700, Profit: 31300 },
];

const formatMoney = (val) =>
  `₱${Number(val).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ==========================================
// MAIN COMPONENT
// ==========================================
const AdminReports = () => {
  // --- STATE ---
  const [basis, setBasis] = useState("accrual");
  const [branch, setBranch] = useState("ALL");
  const [activeTab, setActiveTab] = useState("INCOME_STATEMENT");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Helper to display the correct branch name in the UI
  const branchDisplayNames = {
    ALL: "All Branches",
    BIN: "Main Branch",
    BAT: "Second Branch",
    CAB: "Third Branch",
  };

  // --- DYNAMIC CALCULATIONS (Standard P&L Math) ---
  const reportData = useMemo(() => {
    const multiplier = MOCK_FINANCIALS.MULTIPLIERS[branch];
    const raw = MOCK_FINANCIALS.GLOBAL[basis];

    // 1. REVENUE
    const incLabor = raw.income.labor * multiplier;
    const incParts = raw.income.parts * multiplier;
    const totalIncome = incLabor + incParts;

    // 2. COST OF GOODS SOLD (COGS)
    const cogsParts = raw.cogs.parts_cost * multiplier;

    // 3. GROSS PROFIT
    const grossProfit = totalIncome - cogsParts;

    // 4. OPERATING EXPENSES
    const expRent = raw.expenses.rent * multiplier;
    const expUtil = raw.expenses.utilities * multiplier;
    const expSupp = raw.expenses.supplies * multiplier;
    const expPending = raw.expenses.ocr_pending * multiplier;
    const totalOpEx = expRent + expUtil + expSupp + expPending;

    // 5. NET PROFIT
    const netProfit = grossProfit - totalOpEx;
    const margin =
      totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;

    return {
      income: [
        { category: "Service Labor Fees", value: incLabor },
        { category: "Auto Parts Sales", value: incParts },
      ],
      totalIncome,
      cogs: [
        {
          category: "Inventory Purchases (Parts/Oil)",
          value: cogsParts,
          isOcr: true,
        },
      ],
      totalCogs: cogsParts,
      grossProfit,
      expenses: [
        { category: "Shop Rent", value: expRent, isOcr: true },
        { category: "Utilities (Water & Elec)", value: expUtil, isOcr: true },
        { category: "Shop Supplies", value: expSupp, isOcr: true },
        ...(basis === "accrual"
          ? [
              {
                category: "Pending OCR Approvals (Unpaid)",
                value: expPending,
                isOcr: true,
                isWarning: true,
              },
            ]
          : []),
      ],
      totalOpEx,
      totalExpense: cogsParts + totalOpEx,
      netProfit,
      margin,
    };
  }, [branch, basis]);

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
      {/* 1. REPORT CONTROLS (Filters) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
            <BarChart3 className="text-amber-500" size={28} />
            Financial Center
          </h2>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Calendar size={12} /> FY 2026 • April 1st - April 30th
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2">
            <MapPin className="text-amber-500 shrink-0" size={16} />
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-transparent font-black text-slate-700 dark:text-white outline-none w-full cursor-pointer text-xs uppercase tracking-wider"
            >
              {/* Preserved your custom dropdown names */}
              <option value="ALL">All Branch</option>
              <option value="BIN">Main Branch</option>
              <option value="BAT">Second Branch</option>
              <option value="CAB">Third Branch</option>
            </select>
          </div>

          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setBasis("cash")}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                basis === "cash"
                  ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Cash Basis
            </button>
            <button
              onClick={() => setBasis("accrual")}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                basis === "accrual"
                  ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Accrual Basis
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting || exportSuccess}
            className={`px-6 py-2.5 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${
              exportSuccess
                ? "bg-emerald-500 text-white"
                : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105"
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
              ? "Generating PDF..."
              : exportSuccess
                ? "Downloaded"
                : "Generate PDF"}
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION */}
      <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl overflow-x-auto w-full lg:w-fit">
        <button
          onClick={() => setActiveTab("INCOME_STATEMENT")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
            activeTab === "INCOME_STATEMENT"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileText size={16} /> Income Statement
        </button>
        <button
          onClick={() => setActiveTab("BALANCE_SHEET")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
            activeTab === "BALANCE_SHEET"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Building2 size={16} /> Balance Sheet
        </button>
        <button
          onClick={() => setActiveTab("CASH_FLOW")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
            activeTab === "CASH_FLOW"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Wallet size={16} /> Cash Flow
        </button>
      </div>

      {/* 3. MAIN CONTENT */}
      <AnimatePresence mode="wait">
        {activeTab === "INCOME_STATEMENT" && (
          <motion.div
            key="pnl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-8"
          >
            {/* LEFT PANE: Standard P&L Layout */}
            <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden relative flex flex-col">
              {/* Accrual Warning */}
              <AnimatePresence>
                {basis === "accrual" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="bg-amber-500 text-slate-900 px-8 py-2 text-[10px] font-black uppercase text-center tracking-widest overflow-hidden"
                  >
                    Viewing Accrual Basis (Including Projected Revenue & Unpaid
                    Expenses)
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-8 sm:p-12 space-y-10 flex-1">
                {/* I. Revenue */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4 border-b-2 border-slate-900 dark:border-white pb-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex-1">
                      I. Revenue
                    </h3>
                    <TrendingUp className="text-emerald-500" size={20} />
                  </div>
                  <div className="space-y-4">
                    {reportData.income.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center group"
                      >
                        <span className="text-sm font-bold text-slate-500 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {item.category}
                        </span>
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                          {formatMoney(item.value)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                        Total Revenue
                      </span>
                      <span className="text-xl font-black text-emerald-500">
                        {formatMoney(reportData.totalIncome)}
                      </span>
                    </div>
                  </div>
                </section>

                {/* II. COGS */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4 border-b-2 border-slate-900 dark:border-white pb-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex-1">
                      II. Cost of Goods Sold
                    </h3>
                    <Package className="text-blue-500" size={20} />
                  </div>
                  <div className="space-y-4">
                    {reportData.cogs.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center group"
                      >
                        <span className="text-sm font-bold text-slate-500 dark:text-gray-400 flex items-center gap-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {item.category}{" "}
                        </span>
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                          ( {formatMoney(item.value)} )
                        </span>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                        Gross Profit
                      </span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {formatMoney(reportData.grossProfit)}
                      </span>
                    </div>
                  </div>
                </section>

                {/* III. Operating Expenses */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4 border-b-2 border-slate-900 dark:border-white pb-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex-1">
                      III. Operating Expenses
                    </h3>
                    <TrendingDown className="text-red-500" size={20} />
                  </div>
                  <div className="space-y-4">
                    {reportData.expenses.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center group"
                      >
                        <span
                          className={`text-sm font-bold flex items-center gap-2 transition-colors ${
                            item.isWarning
                              ? "text-amber-500"
                              : "text-slate-500 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white"
                          }`}
                        >
                          {item.category}{" "}
                        </span>
                        <span
                          className={`font-mono text-sm font-black ${
                            item.isWarning
                              ? "text-amber-500"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          ( {formatMoney(item.value)} )
                        </span>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                        Total Operating Expenses
                      </span>
                      <span className="text-xl font-black text-red-500">
                        ( {formatMoney(reportData.totalOpEx)} )
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Bottom Line */}
              <section className="bg-slate-900 dark:bg-black p-8 sm:p-10 relative overflow-hidden shrink-0 mt-auto">
                <div className="absolute right-0 bottom-0 p-8 opacity-5">
                  <Calculator size={150} color="white" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-2">
                      The Bottom Line
                    </p>
                    <h3 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter">
                      Net Profit
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 font-bold italic uppercase tracking-widest">
                      Calculated for {branchDisplayNames[branch]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
                      {formatMoney(reportData.netProfit)}
                    </p>
                    <div className="flex items-center justify-end gap-2 text-emerald-500 font-black text-[10px] uppercase mt-2">
                      <Zap size={14} /> Margin: {reportData.margin}%
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT PANE: Visual Analytics */}
            <div className="space-y-6">
              {/* Branch Matrix Chart */}
              <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm h-full min-h-[400px] flex flex-col">
                <div className="mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Branch Matrix
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                    Revenue vs Expenses Comparison
                  </p>
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={BRANCH_MATRIX_DATA}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                        opacity={0.1}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        fontSize={10}
                        stroke="#94a3b8"
                        dy={10}
                        fontWeight="bold"
                        uppercase="true"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        fontSize={10}
                        stroke="#94a3b8"
                        tickFormatter={(value) => `₱${value / 1000}k`}
                      />
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        contentStyle={{
                          borderRadius: "16px",
                          border: "none",
                          backgroundColor: "#1e293b",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                        itemStyle={{ color: "#fff" }}
                        formatter={(value) => formatMoney(value)}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{
                          fontSize: "10px",
                          fontWeight: "black",
                          paddingTop: "15px",
                        }}
                      />
                      <Bar
                        dataKey="Revenue"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        barSize={24}
                      />
                      <Bar
                        dataKey="Expenses"
                        fill="#f43f5e"
                        radius={[4, 4, 0, 0]}
                        barSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* LOCKED TABS */}
        {activeTab !== "INCOME_STATEMENT" && (
          <motion.div
            key="locked"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border border-dashed border-slate-300 dark:border-white/10 text-center px-4"
          >
            <Lock
              size={56}
              className="text-slate-300 dark:text-slate-600 mb-6"
            />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Enterprise Module Locked
            </h2>
            <p className="text-sm font-bold text-slate-500 mt-3 max-w-lg leading-relaxed">
              The{" "}
              <span className="text-amber-500">
                {activeTab === "BALANCE_SHEET"
                  ? "Balance Sheet"
                  : "Cash Flow Statement"}
              </span>{" "}
              module is built into the design, but will be activated in Phase 2
              of Overdrive.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminReports;
