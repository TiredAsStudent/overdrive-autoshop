import React, { useState } from "react";
import {
  TrendingDown,
  Calendar,
  MapPin,
  Download,
  PieChart as PieChartIcon,
  Receipt,
  AlertTriangle,
  Building2,
  FileSearch,
  Scale,
  Target,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// --- DUMMY DATA ENGINE (OCR Sourced) ---
const BASE_EXPENSES = 450000.0;
const BASE_BUDGET = 420000.0; // Simulating being slightly over budget
const BASE_VAT = 32500.0; // Reclaimable Input VAT from receipts

const COLORS = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  slate: "#64748b",
  cyan: "#06b6d4",
};

// Itemized OCR Log (Simulates the Maker-Checker output)
const OCR_EXPENSE_LOG = [
  {
    id: "EXP-001",
    date: "2026-05-12",
    vendor: "Meralco",
    category: "Utilities",
    amount: 18500.0,
    budget: 15000.0,
    hasScan: true,
  },
  {
    id: "EXP-002",
    date: "2026-05-14",
    vendor: "Prime Auto Parts Inc.",
    category: "COGS/Parts",
    amount: 85000.0,
    budget: 85000.0,
    hasScan: true,
  },
  {
    id: "EXP-003",
    date: "2026-05-15",
    vendor: "Maynilad Water",
    category: "Utilities",
    amount: 4200.0,
    budget: 4000.0,
    hasScan: true,
  },
  {
    id: "EXP-004",
    date: "2026-05-18",
    vendor: "Industrial Lubes Co.",
    category: "Shop Supplies",
    amount: 22000.0,
    budget: 18000.0,
    hasScan: true,
  },
  {
    id: "EXP-005",
    date: "2026-05-20",
    vendor: "Calamba Commercial Realty",
    category: "Rent",
    amount: 45000.0,
    budget: 45000.0,
    hasScan: false,
  }, // Contract, not a scanned receipt
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount,
  );

const ExpenseReports = () => {
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState("May 2026");

  // --- DYNAMIC CALCULATIONS ---
  const mult =
    selectedBranch === "All"
      ? 1.0
      : selectedBranch === "Calamba"
        ? 0.5
        : selectedBranch === "Batino"
          ? 0.3
          : 0.2;

  const totalExpenses = BASE_EXPENSES * mult;
  const totalBudget = BASE_BUDGET * mult;
  const inputVAT = BASE_VAT * mult;

  const varianceAmount = totalExpenses - totalBudget;
  const isOverBudget = varianceAmount > 0;

  // Chart Data: Expense Categories
  const categoryData = [
    {
      name: "Salaries & Wages",
      value: totalExpenses * 0.4,
      color: COLORS.indigo,
    },
    { name: "Rent & Leases", value: totalExpenses * 0.25, color: COLORS.slate },
    { name: "Shop Supplies", value: totalExpenses * 0.15, color: COLORS.amber },
    {
      name: "Utilities (Power/Water)",
      value: totalExpenses * 0.12,
      color: COLORS.rose,
    },
    { name: "Marketing", value: totalExpenses * 0.08, color: COLORS.cyan },
  ];

  // Chart Data: Top Vendors (Where the money goes)
  const vendorData = [
    { name: "Prime Auto Parts", amount: 145000 * mult, color: COLORS.slate },
    { name: "Industrial Lubes", amount: 65000 * mult, color: COLORS.slate },
    { name: "Meralco", amount: 35000 * mult, color: COLORS.rose }, // Highlighted as high overhead
    { name: "Snap-On Tools", amount: 28000 * mult, color: COLORS.slate },
  ];

  // Chart Data: Branch Overhead Comparison
  const branchOverheadData = [
    { name: "Calamba", utilities: 25000, supplies: 15000 },
    { name: "Batino", utilities: 18000, supplies: 12000 },
    { name: "Biñan", utilities: 12000, supplies: 8000 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 relative">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <TrendingDown className="text-rose-500" size={28} />
            Expense Analytics
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Overhead Monitoring & OCR Audit Log
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
              <option value="Biñan">Biñan Branch</option>
            </select>
          </div>

          <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* KPI DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Expenses vs Budget */}
        <div className="bg-slate-900 dark:bg-black/40 p-6 rounded-3xl border border-slate-700 dark:border-white/10 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div
            className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full ${isOverBudget ? "bg-rose-500/10" : "bg-emerald-500/10"}`}
          ></div>
          <div>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Target
                  size={16}
                  className={
                    isOverBudget ? "text-rose-500" : "text-emerald-500"
                  }
                />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Operating Expenses
                </p>
              </div>
            </div>
            <h2 className="text-3xl font-mono font-black text-white">
              {formatCurrency(totalExpenses)}
            </h2>
          </div>
          <div
            className={`mt-4 flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-lg w-max ${
              isOverBudget
                ? "bg-rose-500/20 text-rose-400"
                : "bg-emerald-500/20 text-emerald-400"
            }`}
          >
            {isOverBudget ? (
              <TrendingDown size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {isOverBudget ? "OVER BUDGET BY " : "UNDER BUDGET BY "}
            {formatCurrency(Math.abs(varianceAmount))}
          </div>
        </div>

        {/* Reclaimable Input VAT (Tax Strategy) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scale size={16} className="text-indigo-500" />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Input VAT (Reclaimable)
              </p>
            </div>
            <h2 className="text-3xl font-mono font-black text-slate-900 dark:text-white">
              {formatCurrency(inputVAT)}
            </h2>
          </div>
          <p className="text-[10px] font-bold text-indigo-500 mt-4 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-2 rounded-lg">
            Deductible from Output VAT liability.
          </p>
        </div>

        {/* Highest Overhead Category */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={16} className="text-amber-500" />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Highest Overhead
              </p>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 truncate">
              {categoryData[0].name}
            </h2>
          </div>
          <div className="mt-4 flex justify-between items-end border-t border-slate-100 dark:border-white/10 pt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Amount
            </span>
            <span className="text-sm font-mono font-black text-slate-700 dark:text-slate-300">
              {formatCurrency(categoryData[0].value)}
            </span>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categorization (Donut) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2">
            <PieChartIcon size={14} /> Expense Breakdown
          </h3>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total OPEX
              </span>
              <span className="text-sm font-mono font-black text-slate-900 dark:text-white">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Vendors Leaderboard */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2">
            <Receipt size={14} /> Vendor Spending Leaderboard
          </h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vendorData}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  fontWeight="bold"
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={28}>
                  {vendorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CONDITIONAL: BRANCH OVERHEAD (Only if "All" is selected) */}
      {selectedBranch === "All" && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2">
            <MapPin size={14} /> Variable Overhead Comparison
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={branchOverheadData}
                margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  fontWeight="bold"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(val) => `₱${val / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#334155", opacity: 0.1 }}
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }}
                />
                <Bar
                  dataKey="utilities"
                  name="Utilities (Power/Water)"
                  fill={COLORS.rose}
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Bar
                  dataKey="supplies"
                  name="Shop Supplies"
                  fill={COLORS.amber}
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ITEMIZED OCR EXPENSE LOG (Maker-Checker Audit) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <FileSearch size={14} className="text-indigo-500" /> Itemized
              Expense Ledger (OCR Sourced)
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              Flags highlight variance against standard budget/prices.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10">
                <th className="p-4">Date / Ref</th>
                <th className="p-4">Vendor & Category</th>
                <th className="p-4 text-right">Actual Cost</th>
                <th className="p-4 text-center">Variance Alert</th>
                <th className="p-4 text-center">Physical Proof</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-white/5">
              {OCR_EXPENSE_LOG.map((expense) => {
                const isInflated = expense.amount > expense.budget;
                const variancePct =
                  ((expense.amount - expense.budget) / expense.budget) * 100;

                return (
                  <tr
                    key={expense.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-mono text-xs text-slate-500">
                        {expense.date}
                      </p>
                      <p className="text-[10px] font-black text-indigo-500 uppercase">
                        {expense.id}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {expense.vendor}
                      </p>
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(expense.amount * mult)}
                    </td>
                    <td className="p-4 text-center">
                      {isInflated ? (
                        <div className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-rose-200 dark:border-rose-500/20">
                          <AlertTriangle size={12} /> +{variancePct.toFixed(1)}%
                          OVER
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Within Budget
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {expense.hasScan ? (
                        <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors border border-indigo-200 dark:border-indigo-500/20">
                          <Receipt size={12} /> View Scan
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Manual Entry
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseReports;
