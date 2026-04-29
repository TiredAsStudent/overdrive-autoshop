import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Wallet,
  Wrench,
  ClipboardCheck,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  ShieldCheck,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ==========================================
// MOCK DATA ENGINE
// ==========================================
const MOCK_DATA = {
  GLOBAL: {
    ACCRUAL: { revenue: 142500, expenses: 54300, profit: 88200 },
    CASH: { revenue: 110000, expenses: 45000, profit: 65000 },
    jobs: 24,
    pending: 12,
    criticalStock: 5,
  },
  MULTIPLIERS: {
    ALL: 1,
    BIN: 0.45,
    BAT: 0.35,
    CAB: 0.2,
  },
};

const CHART_DATA_ACCRUAL = [
  { name: "Week 1", Income: 32000, Expense: 12000 },
  { name: "Week 2", Income: 45000, Expense: 18000 },
  { name: "Week 3", Income: 38000, Expense: 14000 },
  { name: "Week 4", Income: 27500, Expense: 10300 },
];

const CHART_DATA_CASH = [
  { name: "Week 1", Income: 28000, Expense: 10000 },
  { name: "Week 2", Income: 35000, Expense: 15000 },
  { name: "Week 3", Income: 30000, Expense: 12000 },
  { name: "Week 4", Income: 17000, Expense: 8000 },
];

const AUDIT_LOGS = [
  {
    id: 1,
    time: "10:42 AM",
    action: "Approved OCR Receipt #882",
    user: "Manager",
    branch: "Second",
    type: "success",
  },
  {
    id: 2,
    time: "09:15 AM",
    action: "Finalized Invoice INV-BIN-004",
    user: "Staff - Ana",
    branch: "Main",
    type: "info",
  },
  {
    id: 3,
    time: "08:30 AM",
    action: "Flagged Stock Variance (10W-40)",
    user: "System",
    branch: "Third",
    type: "warning",
  },
  {
    id: 4,
    time: "08:05 AM",
    action: "Customer Profile Activated",
    user: "Customer",
    branch: "Online",
    type: "info",
  },
  {
    id: 5,
    time: "Yesterday",
    action: "Rejected Stock Transfer Request",
    user: "Manager",
    branch: "Main",
    type: "error",
  },
];

const AdminOverview = () => {
  // --- STATE ---
  const [branch, setBranch] = useState("ALL");
  const [basis, setBasis] = useState("ACCRUAL");

  // --- DYNAMIC CALCULATIONS ---
  const currentData = useMemo(() => {
    const multiplier = MOCK_DATA.MULTIPLIERS[branch];
    const rawData = MOCK_DATA.GLOBAL[basis];
    return {
      revenue: rawData.revenue * multiplier,
      profit: rawData.profit * multiplier,
      jobs: Math.ceil(MOCK_DATA.GLOBAL.jobs * multiplier),
      pending:
        branch === "ALL"
          ? MOCK_DATA.GLOBAL.pending
          : Math.ceil(MOCK_DATA.GLOBAL.pending * multiplier),
      criticalStock:
        branch === "ALL"
          ? MOCK_DATA.GLOBAL.criticalStock
          : Math.floor(MOCK_DATA.GLOBAL.criticalStock * multiplier),
    };
  }, [branch, basis]);

  const activeChartData =
    basis === "ACCRUAL" ? CHART_DATA_ACCRUAL : CHART_DATA_CASH;

  const formatMoney = (amount) =>
    `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // --- KPI CONFIGURATION ---
  const stats = [
    {
      label: "Total Revenue",
      value: formatMoney(currentData.revenue),
      trend: "+12.5%",
      isPositive: true,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Net Profit",
      value: formatMoney(currentData.profit),
      trend: "+8.2%",
      isPositive: true,
      icon: Wallet,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Job Cards",
      value: currentData.jobs.toString(),
      trend: branch === "ALL" ? "Across all branches" : "In current bay",
      isPositive: true,
      icon: Wrench,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Pending Approvals",
      value: currentData.pending.toString(),
      trend: "Needs Action",
      isPositive: false,
      icon: ClipboardCheck,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Critical Stock",
      value: `${currentData.criticalStock} Items`,
      trend: "Low Inventory",
      isPositive: false,
      icon: AlertOctagon,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 1. WELCOME HEADER & CONTROLS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Enterprise Overview
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">
            Real-time financial and operational pulse.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Branch Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2">
            <MapPin className="text-amber-500 shrink-0" size={18} />
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-transparent font-black text-slate-700 dark:text-white outline-none w-full cursor-pointer text-sm"
            >
              <option value="ALL">All Branches</option>
              <option value="BIN">Main Branch</option>
              <option value="BAT">Second Branch</option>
              <option value="CAB">Third Branch</option>
            </select>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

          {/* Dual-Basis Security Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setBasis("ACCRUAL")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                basis === "ACCRUAL"
                  ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Accrual Basis
            </button>
            <button
              onClick={() => setBasis("CASH")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                basis === "CASH"
                  ? "bg-white dark:bg-slate-700 text-emerald-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Cash Basis
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI GRID (Your existing design updated with dynamic state) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                <item.icon size={24} />
              </div>
              <div
                className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${
                  item.isPositive
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                    : "bg-red-50 text-red-600 dark:bg-red-500/10"
                }`}
              >
                {item.isPositive ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {item.trend}
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {item.label}
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 group-hover:text-amber-500 transition-colors">
              {item.value}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* 3. MAIN CONTENT: CHART & AUDIT LOG */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-2">
        {/* Left: Income vs Expense Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="xl:col-span-2 bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col min-h-[400px]"
        >
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Income vs Expense Trend
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Currently viewing{" "}
                <span className="text-amber-500">{basis.toLowerCase()}</span>{" "}
                basis data
              </p>
            </div>
          </div>

          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activeChartData}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  opacity={0.2}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₱${value / 1000}k`}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "16px",
                    border: "none",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => formatMoney(value)}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    paddingTop: "20px",
                  }}
                />
                <Line
                  type="monotone"
                  name="Total Revenue"
                  dataKey="Income"
                  stroke="#10b981"
                  strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  name="Approved Expenses"
                  dataKey="Expense"
                  stroke="#f43f5e"
                  strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right: Immutable Audit Trail Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col h-full min-h-[400px]"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" size={20} />
              Live Audit Feed
            </h3>
            <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 rounded-lg">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Syncing
              </span>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {AUDIT_LOGS.map((log) => (
              <div
                key={log.id}
                className="relative pl-6 pb-4 border-l-2 border-slate-100 dark:border-slate-700 last:border-transparent last:pb-0"
              >
                <div
                  className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-800 ${
                    log.type === "success"
                      ? "bg-emerald-500"
                      : log.type === "warning"
                        ? "bg-amber-500"
                        : log.type === "error"
                          ? "bg-red-500"
                          : "bg-blue-500"
                  }`}
                ></div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-white/5 hover:border-amber-500/30 transition-colors">
                  <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    {log.action}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>
                      {log.user} • {log.branch}
                    </span>
                    <span>{log.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20">
            <FileText size={14} /> View Master Ledger
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminOverview;
