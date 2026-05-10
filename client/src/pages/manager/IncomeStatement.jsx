import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Download,
  Receipt,
  FileText,
  PieChart,
  ArrowRight,
} from "lucide-react";

// --- DUMMY DATA ENGINE ---
// Base numbers representing "Consolidated (All Branches)"
const BASE_FINANCIALS = {
  revenue: {
    labor: 580000.0,
    parts: 325000.0,
  },
  cogs: {
    partsUsed: 195000.0, // Derived from Moving Average in real app
    sublet: 15000.0,
  },
  expenses: {
    salaries: 185000.0,
    rent: 90000.0,
    utilities: 35000.0, // OCR Driven
    supplies: 12500.0, // OCR Driven
    depreciation: 25000.0, // From Manual Journal
    marketing: 8000.0,
  },
  prevMonthNet: 385000.0, // For MoM comparison
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount,
  );

const formatPercent = (decimal) => `${(decimal * 100).toFixed(1)}%`;

const IncomeStatement = () => {
  // --- STATE ---
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState("May 2026");

  // --- MOCK DATA MODIFIER (Simulates branch filtering) ---
  const getMultiplier = (branch) => {
    switch (branch) {
      case "Calamba":
        return 0.5; // Calamba is 50% of business
      case "Biñan":
        return 0.3; // Biñan is 30%
      case "Batino":
        return 0.2; // Batino is 20%
      default:
        return 1.0;
    }
  };

  const mult = getMultiplier(selectedBranch);

  // --- FINANCIAL CALCULATIONS ---
  const totalRevenue =
    (BASE_FINANCIALS.revenue.labor + BASE_FINANCIALS.revenue.parts) * mult;
  const totalCOGS =
    (BASE_FINANCIALS.cogs.partsUsed + BASE_FINANCIALS.cogs.sublet) * mult;
  const grossProfit = totalRevenue - totalCOGS;

  const totalExpenses =
    Object.values(BASE_FINANCIALS.expenses).reduce((a, b) => a + b, 0) * mult;
  const netIncome = grossProfit - totalExpenses;

  // Ratios
  const grossMargin = grossProfit / totalRevenue;
  const netMargin = netIncome / totalRevenue;
  const expenseRatio = totalExpenses / totalRevenue;

  // Comparison logic
  const prevNet = BASE_FINANCIALS.prevMonthNet * mult;
  const momGrowth = ((netIncome - prevNet) / prevNet) * 100;
  const isPositiveGrowth = momGrowth >= 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 relative">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <TrendingUp className="text-indigo-500" size={28} />
            Income Statement
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Profit & Loss (Net of 12% VAT)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Period Filter */}
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

          {/* Branch Filter */}
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
              <option value="Biñan">Biñan Branch</option>
              <option value="Batino">Batino Branch</option>
            </select>
          </div>

          <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI PERFORMANCE DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gross Margin */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              Gross Margin
            </p>
            <PieChart size={16} className="text-indigo-500" />
          </div>
          <h2 className="text-3xl font-mono font-black text-slate-900 dark:text-white">
            {formatPercent(grossMargin)}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2">
            Revenue remaining after parts & direct costs.
          </p>
        </div>

        {/* Operating Expense Ratio */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              Expense Ratio
            </p>
            <TrendingDown size={16} className="text-rose-500" />
          </div>
          <h2 className="text-3xl font-mono font-black text-slate-900 dark:text-white">
            {formatPercent(expenseRatio)}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2">
            Percentage of revenue consumed by overhead.
          </p>
        </div>

        {/* Net Profit Margin */}
        <div className="bg-slate-900 dark:bg-black/40 p-6 rounded-3xl border border-slate-700 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full"></div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
            Net Profit Margin
          </p>
          <h2 className="text-3xl font-mono font-black text-emerald-400">
            {formatPercent(netMargin)}
          </h2>
          <div className="flex items-center gap-1 mt-2">
            {isPositiveGrowth ? (
              <TrendingUp size={12} className="text-emerald-500" />
            ) : (
              <TrendingDown size={12} className="text-rose-500" />
            )}
            <span
              className={`text-[10px] font-bold ${isPositiveGrowth ? "text-emerald-500" : "text-rose-500"}`}
            >
              {isPositiveGrowth ? "+" : ""}
              {momGrowth.toFixed(1)}% vs Last Month
            </span>
          </div>
        </div>
      </div>

      {/* THE WATERFALL P&L STATEMENT */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        {/* Report Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 text-center bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">
            Overdrive Auto Shop
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
            Income Statement •{" "}
            {selectedBranch === "All" ? "Consolidated" : selectedBranch}
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            For the period ending {selectedPeriod}
          </p>
        </div>

        <div className="p-6 md:p-8">
          <table className="w-full text-left border-collapse">
            <tbody className="text-sm">
              {/* REVENUE SECTION */}
              <tr>
                <td
                  colSpan="2"
                  className="pt-4 pb-2 font-black uppercase tracking-widest text-xs text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-white/10"
                >
                  Operating Revenue
                </td>
              </tr>
              <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="py-3 pl-4 text-slate-700 dark:text-slate-300 font-medium">
                  Labor Revenue
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(BASE_FINANCIALS.revenue.labor * mult)}
                </td>
              </tr>
              <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="py-3 pl-4 text-slate-700 dark:text-slate-300 font-medium">
                  Parts Revenue
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10">
                  {formatCurrency(BASE_FINANCIALS.revenue.parts * mult)}
                </td>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-900/50 font-black">
                <td className="py-3 pl-4 text-slate-900 dark:text-white">
                  Total Gross Revenue
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(totalRevenue)}
                </td>
              </tr>

              {/* COGS SECTION */}
              <tr>
                <td
                  colSpan="2"
                  className="pt-8 pb-2 font-black uppercase tracking-widest text-xs text-rose-600 dark:text-rose-400 border-b border-slate-200 dark:border-white/10"
                >
                  Cost of Goods Sold (COGS)
                </td>
              </tr>
              <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="py-3 pl-4 text-slate-700 dark:text-slate-300 font-medium">
                  Auto Parts Used (Moving Avg)
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(BASE_FINANCIALS.cogs.partsUsed * mult)}
                </td>
              </tr>
              <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="py-3 pl-4 text-slate-700 dark:text-slate-300 font-medium">
                  Sublet Repairs
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10">
                  {formatCurrency(BASE_FINANCIALS.cogs.sublet * mult)}
                </td>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-900/50 font-black">
                <td className="py-3 pl-4 text-slate-900 dark:text-white">
                  Total Cost of Goods Sold
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(totalCOGS)}
                </td>
              </tr>

              {/* GROSS PROFIT (Subtotal) */}
              <tr className="bg-indigo-50 dark:bg-indigo-900/20 font-black text-base border-t-2 border-b-2 border-indigo-200 dark:border-indigo-500/30">
                <td className="py-4 pl-4 text-indigo-900 dark:text-indigo-300 uppercase tracking-widest text-xs">
                  Gross Profit
                </td>
                <td className="py-4 text-right font-mono text-indigo-700 dark:text-indigo-400">
                  {formatCurrency(grossProfit)}
                </td>
              </tr>

              {/* OPERATING EXPENSES */}
              <tr>
                <td
                  colSpan="2"
                  className="pt-8 pb-2 font-black uppercase tracking-widest text-xs text-amber-600 dark:text-amber-500 border-b border-slate-200 dark:border-white/10"
                >
                  Operating Expenses
                </td>
              </tr>
              <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="py-3 pl-4 text-slate-700 dark:text-slate-300 font-medium">
                  Salaries & Wages
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(BASE_FINANCIALS.expenses.salaries * mult)}
                </td>
              </tr>
              <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="py-3 pl-4 text-slate-700 dark:text-slate-300 font-medium">
                  Rent Expense
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(BASE_FINANCIALS.expenses.rent * mult)}
                </td>
              </tr>

              {/* OCR Evidence Simulators */}
              <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="py-3 pl-4 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  Utilities Expense
                  <button className="opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-[9px] font-bold uppercase tracking-widest rounded flex items-center gap-1 hover:bg-indigo-500 hover:text-white transition-all text-slate-500">
                    <Receipt size={10} /> View Scans
                  </button>
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(BASE_FINANCIALS.expenses.utilities * mult)}
                </td>
              </tr>
              <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="py-3 pl-4 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  Shop Supplies
                  <button className="opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-[9px] font-bold uppercase tracking-widest rounded flex items-center gap-1 hover:bg-indigo-500 hover:text-white transition-all text-slate-500">
                    <Receipt size={10} /> View Scans
                  </button>
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(BASE_FINANCIALS.expenses.supplies * mult)}
                </td>
              </tr>

              {/* Depreciation from Journal */}
              <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="py-3 pl-4 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  Depreciation Expense
                  <button className="opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-[9px] font-bold uppercase tracking-widest rounded flex items-center gap-1 hover:bg-indigo-500 hover:text-white transition-all text-slate-500">
                    <FileText size={10} /> View Journal
                  </button>
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(BASE_FINANCIALS.expenses.depreciation * mult)}
                </td>
              </tr>
              <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="py-3 pl-4 text-slate-700 dark:text-slate-300 font-medium">
                  Marketing & Advertising
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10">
                  {formatCurrency(BASE_FINANCIALS.expenses.marketing * mult)}
                </td>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-900/50 font-black">
                <td className="py-3 pl-4 text-slate-900 dark:text-white">
                  Total Operating Expenses
                </td>
                <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                  {formatCurrency(totalExpenses)}
                </td>
              </tr>

              {/* NET INCOME (The Bottom Line) */}
              <tr>
                <td className="pt-8"></td>
                <td className="pt-8"></td>
              </tr>
              <tr
                className={`font-black text-xl border-t-4 border-b-[6px] border-double ${
                  netIncome >= 0
                    ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20"
                    : "bg-rose-50 border-rose-500 dark:bg-rose-900/20"
                }`}
              >
                <td
                  className={`py-6 pl-4 uppercase tracking-widest ${netIncome >= 0 ? "text-emerald-800 dark:text-emerald-400" : "text-rose-800 dark:text-rose-400"}`}
                >
                  Net Income
                </td>
                <td
                  className={`py-6 text-right font-mono ${netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                >
                  {formatCurrency(netIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IncomeStatement;
