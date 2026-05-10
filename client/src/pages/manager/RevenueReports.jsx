import React, { useState } from "react";
import {
  TrendingUp,
  Calendar,
  MapPin,
  Download,
  PieChart as PieChartIcon,
  CreditCard,
  Users,
  Tag,
  Award,
  Wallet,
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

// --- DUMMY DATA ENGINE ---
const BASE_REVENUE = 905000.0; // Consolidated total (Net of VAT)
const BASE_ATV = 4525.0; // Average Transaction Value
const BASE_DISCOUNTS = 12500.0; // Contra-revenue

const TOP_SERVICES = [
  {
    id: 1,
    name: "Full Synthetic Change Oil",
    category: "Preventive",
    qty: 145,
    revenue: 362500.0,
    margin: "High",
  },
  {
    id: 2,
    name: "Brake System Overhaul",
    category: "Repair",
    qty: 82,
    revenue: 164000.0,
    margin: "Medium",
  },
  {
    id: 3,
    name: "Computerized Wheel Alignment",
    category: "Service",
    qty: 110,
    revenue: 88000.0,
    margin: "High",
  },
  {
    id: 4,
    name: "Aircon Cleaning & Freon Refill",
    category: "Maintenance",
    qty: 65,
    revenue: 97500.0,
    margin: "Medium",
  },
  {
    id: 5,
    name: "Battery Replacement (2SM)",
    category: "Parts",
    qty: 25,
    revenue: 105000.0,
    margin: "Low",
  },
];

const COLORS = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  slate: "#64748b",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount,
  );

const RevenueReports = () => {
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState("May 2026");

  // --- DYNAMIC CALCULATIONS ---
  // Simulate filtering by branch
  const mult =
    selectedBranch === "All"
      ? 1.0
      : selectedBranch === "Calamba"
        ? 0.5
        : selectedBranch === "Batino"
          ? 0.3
          : 0.2;

  const totalRevenue = BASE_REVENUE * mult;
  const averageTransaction =
    BASE_ATV * (mult === 1.0 ? 1 : 0.9 + Math.random() * 0.2); // Varies slightly per branch
  const contraRevenue = BASE_DISCOUNTS * mult;

  // Customer Split Math
  const returningPct = 68;
  const newPct = 32;

  // Chart Data: Labor vs Parts
  const mixData = [
    {
      name: "Labor / Services",
      value: totalRevenue * 0.65,
      color: COLORS.indigo,
    },
    { name: "Retail Parts", value: totalRevenue * 0.35, color: COLORS.emerald },
  ];

  // Chart Data: Payment Methods
  const paymentData = [
    { name: "Cash", value: totalRevenue * 0.45, color: COLORS.emerald },
    { name: "GCash / Maya", value: totalRevenue * 0.35, color: COLORS.indigo },
    { name: "Bank Transfer", value: totalRevenue * 0.2, color: COLORS.amber },
  ];

  // Chart Data: Branch Leaderboard (Only shown on "All" view)
  const branchData = [
    { name: "Calamba", revenue: BASE_REVENUE * 0.5 },
    { name: "Batino", revenue: BASE_REVENUE * 0.3 },
    { name: "Biñan", revenue: BASE_REVENUE * 0.2 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 relative">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <TrendingUp className="text-indigo-500" size={28} />
            Revenue Analytics
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Sales Intelligence & Performance
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-slate-900 dark:bg-black/40 p-6 rounded-3xl border border-slate-700 dark:border-white/10 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full"></div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-emerald-500" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Total Revenue (Net VAT)
              </p>
            </div>
            <h2 className="text-2xl font-mono font-black text-white">
              {formatCurrency(totalRevenue)}
            </h2>
          </div>
          <p className="text-[10px] font-bold text-emerald-400 mt-4 flex items-center gap-1">
            <TrendingUp size={12} /> +12.5% vs Last Month
          </p>
        </div>

        {/* Average Transaction Value (ATV) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={16} className="text-indigo-500" />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Avg Transaction Value
              </p>
            </div>
            <h2 className="text-2xl font-mono font-black text-slate-900 dark:text-white">
              {formatCurrency(averageTransaction)}
            </h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4">
            Average spend per customer visit.
          </p>
        </div>

        {/* Customer Retention Split */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-amber-500" />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Customer Loyalty
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-mono font-black text-slate-900 dark:text-white">
                {returningPct}%
              </h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Returning
              </span>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-4 flex overflow-hidden">
            <div
              className="h-full bg-amber-500"
              style={{ width: `${returningPct}%` }}
            ></div>
            <div
              className="h-full bg-slate-300 dark:bg-slate-500"
              style={{ width: `${newPct}%` }}
            ></div>
          </div>
        </div>

        {/* Contra-Revenue (Discounts & Refunds) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag size={16} className="text-rose-500" />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Discounts & Refunds
              </p>
            </div>
            <h2 className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400">
              -{formatCurrency(contraRevenue)}
            </h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4">
            Contra-revenue deducting from gross sales.
          </p>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Mix (Labor vs Parts) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2">
            <PieChartIcon size={14} /> Revenue Mix (Labor vs Parts)
          </h3>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mixData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {mixData.map((entry, index) => (
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
                  wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label for Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total
              </span>
              <span className="text-sm font-mono font-black text-slate-900 dark:text-white">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2">
            <CreditCard size={14} /> Payment Gateway Distribution
          </h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={paymentData}
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
                  width={100}
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
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CONDITIONAL: BRANCH LEADERBOARD (Only show if "All" is selected) */}
      {selectedBranch === "All" && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2">
            <MapPin size={14} /> Branch Revenue Leaderboard
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={branchData}
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
                <Bar
                  dataKey="revenue"
                  fill={COLORS.indigo}
                  radius={[6, 6, 0, 0]}
                  barSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TOP PERFORMING SERVICES TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
            <Award size={14} className="text-amber-500" /> Top Performing
            Services (Volume & Revenue)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10">
                <th className="p-4 w-12 text-center">Rank</th>
                <th className="p-4">Service Name / Recipe</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">Qty Sold</th>
                <th className="p-4 text-center">Gross Margin</th>
                <th className="p-4 text-right">Generated Revenue</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-white/5">
              {TOP_SERVICES.map((service, index) => (
                <tr
                  key={service.id}
                  className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 text-center font-black text-slate-400">
                    #{index + 1}
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">
                    {service.name}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-bold uppercase tracking-widest">
                      {service.category}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono font-black">
                    {Math.floor(service.qty * mult)}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${
                        service.margin === "High"
                          ? "text-emerald-500"
                          : service.margin === "Medium"
                            ? "text-indigo-500"
                            : "text-amber-500"
                      }`}
                    >
                      {service.margin}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(service.revenue * mult)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueReports;
