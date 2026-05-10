import React, { useState, useMemo } from "react";
import {
  RefreshCcw,
  Calendar,
  MapPin,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";

// --- DUMMY DATA ENGINE (Indirect Method) ---
// Mathematically linked to the previous Income Statement and Balance Sheet
const MOCK_CASH_FLOW = {
  beginningCash: 110000.0,

  // 1. Operating Activities
  operating: {
    netIncome: 115000.0, // From Income Statement
    adjustments: [
      { id: "adj1", name: "Depreciation Expense", value: 25000.0, type: "add" }, // Add back non-cash
    ],
    workingCapital: [
      {
        id: "wc1",
        name: "Increase in Accounts Receivable",
        value: -10000.0,
        type: "subtract",
      }, // Cash used
      {
        id: "wc2",
        name: "Increase in Inventory (OCR Scans)",
        value: -40000.0,
        type: "subtract",
      }, // Cash used
      {
        id: "wc3",
        name: "Increase in Accounts Payable",
        value: 20000.0,
        type: "add",
      }, // Cash saved/held
    ],
  },

  // 2. Investing Activities
  investing: [
    {
      id: "inv1",
      name: "Purchase of Shop Equipment (Lifts)",
      value: -50000.0,
      type: "subtract",
    },
  ],

  // 3. Financing Activities
  financing: [
    {
      id: "fin1",
      name: "Proceeds from Bank Loan",
      value: 100000.0,
      type: "add",
    },
    { id: "fin2", name: "Owner's Drawings", value: -20000.0, type: "subtract" },
  ],

  // Verification Anchor
  balanceSheetCashTarget: 250000.0, // The exact "Cash on Hand" from the Balance Sheet
};

const formatCurrency = (amount) => {
  const isNegative = amount < 0;
  const formatted = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Math.abs(amount));
  return isNegative ? `(${formatted})` : formatted;
};

const CashFlowStatement = () => {
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState("May 2026");

  // --- CALCULATIONS ---
  // Multiplier for simple interactive branch demonstration
  const mult =
    selectedBranch === "All" ? 1.0 : selectedBranch === "Calamba" ? 0.6 : 0.4;

  const begCash = MOCK_CASH_FLOW.beginningCash * mult;
  const targetCash = MOCK_CASH_FLOW.balanceSheetCashTarget * mult;

  // Operating Math
  const netIncome = MOCK_CASH_FLOW.operating.netIncome * mult;
  const totalAdjustments =
    MOCK_CASH_FLOW.operating.adjustments.reduce(
      (sum, item) => sum + item.value,
      0,
    ) * mult;
  const totalWorkingCapital =
    MOCK_CASH_FLOW.operating.workingCapital.reduce(
      (sum, item) => sum + item.value,
      0,
    ) * mult;
  const netOperatingCash = netIncome + totalAdjustments + totalWorkingCapital;

  // Investing Math
  const netInvestingCash =
    MOCK_CASH_FLOW.investing.reduce((sum, item) => sum + item.value, 0) * mult;

  // Financing Math
  const netFinancingCash =
    MOCK_CASH_FLOW.financing.reduce((sum, item) => sum + item.value, 0) * mult;

  // Totals
  const netIncreaseInCash =
    netOperatingCash + netInvestingCash + netFinancingCash;
  const endingCash = begCash + netIncreaseInCash;

  // Integrity Check
  const isReconciled = Math.abs(endingCash - targetCash) < 0.01;

  // Runway Calculation (Assuming avg daily burn of ₱5,000)
  const dailyBurnRate = 5000 * mult;
  const cashRunwayDays = Math.floor(endingCash / dailyBurnRate);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 relative">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <RefreshCcw className="text-indigo-500" size={28} />
            Cash Flow Statement
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Liquidity Tracking (Indirect Method)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-40">
            <Calendar
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="May 2026">May 2026</option>
              <option value="April 2026">April 2026</option>
              <option value="YTD 2026">YTD 2026</option>
            </select>
          </div>

          <div className="relative flex-1 md:w-48">
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="All">Consolidated (All)</option>
              <option value="Calamba">Calamba Branch</option>
              <option value="Batino">Batino Branch</option>
            </select>
          </div>

          <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* LIQUIDITY KPI DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Change in Cash */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Banknote size={16} className="text-emerald-500" />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Net Change in Cash
              </p>
            </div>
            <h2
              className={`text-3xl font-mono font-black ${netIncreaseInCash >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
            >
              {netIncreaseInCash > 0 ? "+" : ""}
              {formatCurrency(netIncreaseInCash)}
            </h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4 flex items-center gap-1">
            <Info size={12} /> Total actual cash generated/lost this period.
          </p>
        </div>

        {/* Operating Cash Flow */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-indigo-500" />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Operating Cash Flow
              </p>
            </div>
            <h2 className="text-3xl font-mono font-black text-slate-900 dark:text-white">
              {formatCurrency(netOperatingCash)}
            </h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-indigo-500" /> Core business
            activities are positive.
          </p>
        </div>

        {/* Cash Runway (Burn Rate) */}
        <div className="bg-slate-900 dark:bg-black/40 p-6 rounded-3xl border border-slate-700 dark:border-white/10 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full"></div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
              Cash Runway (Survival)
            </p>
            <h2 className="text-3xl font-mono font-black text-amber-400">
              {cashRunwayDays}{" "}
              <span className="text-lg font-sans text-slate-500">Days</span>
            </h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4">
            If zero revenue is generated starting today.
          </p>
        </div>
      </div>

      {/* THE CASH FLOW STATEMENT */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 text-center bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">
            Overdrive Auto Shop
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
            Statement of Cash Flows •{" "}
            {selectedBranch === "All" ? "Consolidated" : selectedBranch}
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            For the period ending {selectedPeriod}
          </p>
        </div>

        <div className="p-6 md:p-8">
          <table className="w-full text-left border-collapse">
            <tbody className="text-sm">
              {/* 1. OPERATING ACTIVITIES */}
              <tr>
                <td
                  colSpan="2"
                  className="pt-4 pb-2 font-black uppercase tracking-widest text-xs text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-white/10"
                >
                  Cash Flows from Operating Activities
                </td>
              </tr>
              <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="py-3 pl-4 text-slate-900 dark:text-white font-bold">
                  Net Income (From P&L)
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(netIncome)}
                </td>
              </tr>

              {/* Adjustments */}
              <tr>
                <td
                  colSpan="2"
                  className="pt-4 pb-1 pl-4 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                >
                  Adjustments to reconcile Net Income to Cash:
                </td>
              </tr>
              {MOCK_CASH_FLOW.operating.adjustments.map((item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-400"
                >
                  <td className="py-2 pl-8">{item.name}</td>
                  <td className="py-2 text-right font-mono">
                    {formatCurrency(item.value * mult)}
                  </td>
                </tr>
              ))}

              {/* Working Capital */}
              <tr>
                <td
                  colSpan="2"
                  className="pt-4 pb-1 pl-4 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                >
                  Changes in Operating Assets & Liabilities:
                </td>
              </tr>
              {MOCK_CASH_FLOW.operating.workingCapital.map((item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-400"
                >
                  <td className="py-2 pl-8">{item.name}</td>
                  <td className="py-2 text-right font-mono">
                    {formatCurrency(item.value * mult)}
                  </td>
                </tr>
              ))}
              <tr className="bg-indigo-50 dark:bg-indigo-900/20 font-black border-y border-indigo-100 dark:border-indigo-500/20">
                <td className="py-3 pl-4 text-indigo-900 dark:text-indigo-300">
                  Net Cash Provided by Operating Activities
                </td>
                <td className="py-3 text-right font-mono text-indigo-700 dark:text-indigo-400">
                  {formatCurrency(netOperatingCash)}
                </td>
              </tr>

              {/* 2. INVESTING ACTIVITIES */}
              <tr>
                <td
                  colSpan="2"
                  className="pt-8 pb-2 font-black uppercase tracking-widest text-xs text-amber-600 dark:text-amber-500 border-b border-slate-200 dark:border-white/10"
                >
                  Cash Flows from Investing Activities
                </td>
              </tr>
              {MOCK_CASH_FLOW.investing.map((item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-400"
                >
                  <td className="py-2 pl-4">{item.name}</td>
                  <td className="py-2 text-right font-mono">
                    {formatCurrency(item.value * mult)}
                  </td>
                </tr>
              ))}
              <tr className="bg-amber-50 dark:bg-amber-900/20 font-black border-y border-amber-100 dark:border-amber-500/20">
                <td className="py-3 pl-4 text-amber-900 dark:text-amber-300">
                  Net Cash Used in Investing Activities
                </td>
                <td className="py-3 text-right font-mono text-amber-700 dark:text-amber-400">
                  {formatCurrency(netInvestingCash)}
                </td>
              </tr>

              {/* 3. FINANCING ACTIVITIES */}
              <tr>
                <td
                  colSpan="2"
                  className="pt-8 pb-2 font-black uppercase tracking-widest text-xs text-rose-600 dark:text-rose-400 border-b border-slate-200 dark:border-white/10"
                >
                  Cash Flows from Financing Activities
                </td>
              </tr>
              {MOCK_CASH_FLOW.financing.map((item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-400"
                >
                  <td className="py-2 pl-4">{item.name}</td>
                  <td className="py-2 text-right font-mono">
                    {formatCurrency(item.value * mult)}
                  </td>
                </tr>
              ))}
              <tr className="bg-rose-50 dark:bg-rose-900/20 font-black border-y border-rose-100 dark:border-rose-500/20">
                <td className="py-3 pl-4 text-rose-900 dark:text-rose-300">
                  Net Cash Provided by Financing Activities
                </td>
                <td className="py-3 text-right font-mono text-rose-700 dark:text-rose-400">
                  {formatCurrency(netFinancingCash)}
                </td>
              </tr>

              {/* NET INCREASE AND ENDING CASH */}
              <tr>
                <td className="pt-8"></td>
                <td className="pt-8"></td>
              </tr>
              <tr className="font-bold border-t-2 border-slate-300 dark:border-slate-600">
                <td className="py-3 pl-4 text-slate-900 dark:text-white">
                  Net Increase (Decrease) in Cash
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(netIncreaseInCash)}
                </td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-3 pl-4">Cash at Beginning of Period</td>
                <td className="py-3 text-right font-mono">
                  {formatCurrency(begCash)}
                </td>
              </tr>
              <tr className="font-black text-lg border-b-[6px] border-double border-slate-300 dark:border-slate-600">
                <td className="py-4 pl-4 uppercase tracking-widest text-slate-900 dark:text-white">
                  Cash at End of Period
                </td>
                <td className="py-4 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(endingCash)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ENDING CASH RECONCILIATION ANCHOR */}
        <div
          className={`p-6 bg-slate-50 dark:bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors ${
            isReconciled
              ? "border-t-4 border-emerald-500"
              : "border-t-4 border-rose-500"
          }`}
        >
          <div className="flex items-center gap-3">
            {isReconciled ? (
              <CheckCircle2 size={24} className="text-emerald-500" />
            ) : (
              <AlertCircle size={24} className="text-rose-500" />
            )}
            <div>
              <h3
                className={`text-sm font-black uppercase tracking-widest ${
                  isReconciled
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-700 dark:text-rose-400"
                }`}
              >
                {isReconciled
                  ? "Balance Sheet Reconciled"
                  : "Reconciliation Error"}
              </h3>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                Ending cash matches exactly with the Balance Sheet asset ledger.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[10px] font-mono font-black border border-slate-300 dark:border-slate-700">
              BS Target: {formatCurrency(targetCash)}
            </span>
            <span
              className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-black border ${
                isReconciled
                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                  : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
              }`}
            >
              CF Actual: {formatCurrency(endingCash)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowStatement;
