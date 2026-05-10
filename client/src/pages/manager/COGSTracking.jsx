import React, { useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Receipt,
  MapPin,
  Calendar,
  Percent,
  TrendingDown,
  Activity,
  ShieldAlert,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// --- DUMMY DATA FOR MOCKUP ---
const MOCK_PROFIT_TREND = [
  { month: "Nov", revenue: 450000, cogs: 280000 },
  { month: "Dec", revenue: 520000, cogs: 310000 },
  { month: "Jan", revenue: 480000, cogs: 295000 },
  { month: "Feb", revenue: 590000, cogs: 340000 },
  { month: "Mar", revenue: 610000, cogs: 360000 },
  { month: "Apr", revenue: 680000, cogs: 395000 },
];

const MOCK_BRANCH_COGS = [
  { branch: "Calamba", revenue: 320000, cogs: 190000 },
  { branch: "Batino", revenue: 210000, cogs: 115000 },
  { branch: "Cabuyao", revenue: 150000, cogs: 90000 },
];

const MOCK_HIGHEST_COST_PARTS = [
  {
    id: 1,
    sku: "OIL-SYN-4L",
    name: "Full Synthetic Motor Oil (4L)",
    branch: "Calamba",
    qtyUsed: 124,
    cogsImpact: 148800,
    standardPrice: 1100,
    movingAvg: 1200,
    inflationAlert: true,
  },
  {
    id: 2,
    sku: "BRK-PAD-VS",
    name: "Brake Pads (Vios/Yaris)",
    branch: "Batino",
    qtyUsed: 86,
    cogsImpact: 73100,
    standardPrice: 850,
    movingAvg: 850,
    inflationAlert: false,
  },
  {
    id: 3,
    sku: "BTR-MF-2SM",
    name: "Maintenance Free Battery",
    branch: "Calamba",
    qtyUsed: 14,
    cogsImpact: 63000,
    standardPrice: 4200,
    movingAvg: 4500,
    inflationAlert: true,
  },
  {
    id: 4,
    sku: "FLT-OIL-TYT",
    name: "Toyota Genuine Oil Filter",
    branch: "Cabuyao",
    qtyUsed: 145,
    cogsImpact: 36250,
    standardPrice: 250,
    movingAvg: 250,
    inflationAlert: false,
  },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount,
  );

const COGSTracking = () => {
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");

  const filteredParts =
    selectedBranch === "All"
      ? MOCK_HIGHEST_COST_PARTS
      : MOCK_HIGHEST_COST_PARTS.filter((p) => p.branch === selectedBranch);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <Activity className="text-rose-500" size={28} />
            COGS Tracking
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Cost of Goods Sold & Margin Analysis
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Period Filter */}
          <div className="relative flex-1 sm:w-40">
            <Calendar
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 transition-all appearance-none"
            >
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="Year to Date">Year to Date</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="relative flex-1 sm:w-40">
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 transition-all appearance-none"
            >
              <option value="All">All Branches</option>
              <option value="Calamba">Calamba</option>
              <option value="Batino">Batino</option>
              <option value="Cabuyao">Cabuyao</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total COGS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-l-4 border-rose-500 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              Total COGS (Expense)
            </p>
            <Receipt size={16} className="text-rose-500" />
          </div>
          <h2 className="text-3xl font-mono font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(395000)}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp size={12} className="text-rose-500" /> +8.2% from last
            month
          </p>
        </div>

        {/* Gross Profit Margin */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-l-4 border-emerald-500 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              Gross Profit Margin
            </p>
            <Percent size={16} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-2">
            41.9%
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
            <TrendingDown size={12} className="text-rose-500" /> -1.2% due to
            rising part costs
          </p>
        </div>

        {/* NEW: Shrinkage & Waste Threshold */}
        <div className="bg-slate-900 dark:bg-black/40 p-6 rounded-3xl border border-slate-700 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full"></div>
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Waste & Shrinkage
            </p>
            <ShieldAlert size={16} className="text-amber-500" />
          </div>
          <h2 className="text-3xl font-mono font-black text-white mt-2">
            2.4%
          </h2>
          <p className="text-[10px] font-bold text-amber-400 mt-2">
            Warning: Approaching 3% threshold
          </p>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs COGS Trend */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp size={14} /> Revenue vs COGS Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={MOCK_PROFIT_TREND}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCogs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(val) => `₱${val / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Total Revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="cogs"
                  name="COGS"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCogs)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Profitability Comparison */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6">
            Branch COGS Comparison
          </h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={MOCK_BRANCH_COGS}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                />
                <XAxis
                  dataKey="branch"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(val) => `₱${val / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Bar
                  dataKey="cogs"
                  name="COGS"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* HIGHEST COST PARTS (With Inflation Guard) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">
            Highest-Cost Parts Analysis
          </h3>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <AlertTriangle size={10} className="text-amber-500" /> Watch for
            Inflation Alerts
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10">
                <th className="p-4">SKU / Part Name</th>
                <th className="p-4">Branch</th>
                <th className="p-4 text-center">Qty Sold</th>
                <th className="p-4 text-right">Avg Cost vs Standard</th>
                <th className="p-4 text-right">Total COGS Impact</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-white/5">
              {filteredParts.map((part) => (
                <tr
                  key={part.id}
                  className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {part.sku}
                      {/* INFLATION GUARD ALERT */}
                      {part.inflationAlert && (
                        <span className="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 text-[9px] px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-widest">
                          <TrendingUp size={10} /> Cost Spike
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{part.name}</p>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-bold uppercase tracking-widest">
                      {part.branch}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-mono font-black">{part.qtyUsed}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                      <span
                        className={`font-mono font-black ${part.inflationAlert ? "text-rose-500" : "text-slate-500"}`}
                      >
                        {formatCurrency(part.movingAvg)}{" "}
                        <span className="text-[9px] text-slate-400 font-sans">
                          Avg
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatCurrency(part.standardPrice)}{" "}
                        <span className="font-sans">Std</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                      {formatCurrency(part.cogsImpact)}
                    </span>
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

export default COGSTracking;
