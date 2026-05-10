import React, { useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Package,
  Wallet,
  ArrowRightLeft,
  MapPin,
  ExternalLink,
  ShieldCheck,
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
} from "recharts";

// --- DUMMY DATA FOR MOCKUP ---
const MOCK_TREND_DATA = [
  { month: "Nov", stockValue: 850000, payable: 400000 },
  { month: "Dec", stockValue: 920000, payable: 450000 },
  { month: "Jan", stockValue: 1050000, payable: 380000 },
  { month: "Feb", stockValue: 1100000, payable: 320000 },
  { month: "Mar", stockValue: 1180000, payable: 290000 },
  { month: "Apr", stockValue: 1240500, payable: 350000 },
];

const MOCK_BRANCH_DATA = [
  { branch: "Calamba", value: 540500, items: 450 },
  { branch: "Batino", value: 410000, items: 320 },
  { branch: "Cabuyao", value: 290000, items: 210 },
];

const MOCK_INVENTORY = [
  {
    id: 1,
    sku: "OIL-SYN-4L",
    name: "Full Synthetic Motor Oil (4L)",
    branch: "Calamba",
    qty: 24,
    movingAvg: 1200.0,
    status: "Healthy",
  },
  {
    id: 2,
    sku: "BRK-PAD-VS",
    name: "Brake Pads (Vios/Yaris)",
    branch: "Batino",
    qty: 8,
    movingAvg: 850.5,
    status: "Low Stock",
  },
  {
    id: 3,
    sku: "FLT-OIL-TYT",
    name: "Toyota Genuine Oil Filter",
    branch: "Cabuyao",
    qty: 45,
    movingAvg: 250.0,
    status: "Healthy",
  },
  {
    id: 4,
    sku: "BTR-MF-2SM",
    name: "Maintenance Free Battery (2SM)",
    branch: "Calamba",
    qty: 12,
    movingAvg: 4500.0,
    status: "High Value",
  },
  {
    id: 5,
    sku: "SPK-IR-NGK",
    name: "NGK Iridium Spark Plug",
    branch: "Batino",
    qty: 0,
    movingAvg: 650.0,
    status: "Stock Out",
  },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount,
  );

const StockValue = () => {
  const [selectedBranch, setSelectedBranch] = useState("All");

  // Filter logic for the table
  const filteredInventory =
    selectedBranch === "All"
      ? MOCK_INVENTORY
      : MOCK_INVENTORY.filter((item) => item.branch === selectedBranch);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <Package className="text-indigo-500" size={28} />
            Stock Valuation
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Real-Time Moving Average Asset Tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-48">
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
            >
              <option value="All">All Branches</option>
              <option value="Calamba">Calamba</option>
              <option value="Batino">Batino</option>
              <option value="Cabuyao">Cabuyao</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI METRICS (Including Asset-to-Liability) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Asset Value */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-l-4 border-emerald-500 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              Total Inventory Asset
            </p>
            <ShieldCheck size={16} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(1240500)}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-500" /> +5.4% from
            last month
          </p>
        </div>

        {/* Accounts Payable Comparison */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-l-4 border-rose-500 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              Accounts Payable (Debt)
            </p>
            <Wallet size={16} className="text-rose-500" />
          </div>
          <h2 className="text-3xl font-mono font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(350000)}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
            <AlertTriangle size={12} className="text-rose-500" /> Owed to
            suppliers
          </p>
        </div>

        {/* Asset-to-Liability Ratio */}
        <div className="bg-slate-900 dark:bg-black/40 p-6 rounded-3xl border border-slate-700 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full"></div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Asset-to-Debt Ratio
          </p>
          <h2 className="text-3xl font-mono font-black text-white mt-2">
            3.54x
          </h2>
          <p className="text-[10px] font-bold text-indigo-400 mt-2">
            Highly Liquid (Healthy)
          </p>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp size={14} /> 6-Month Valuation vs Debt Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={MOCK_TREND_DATA}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
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
                  itemStyle={{ fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="stockValue"
                  name="Asset Value"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorStock)"
                />
                <Area
                  type="monotone"
                  dataKey="payable"
                  name="AP Debt"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDebt)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Distribution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6">
            Branch Distribution
          </h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={MOCK_BRANCH_DATA}
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
                  dataKey="branch"
                  type="category"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={60}
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
                <Bar
                  dataKey="value"
                  name="Value (₱)"
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* INVENTORY VALUATION TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">
            Itemized Valuation Ledger
          </h3>
          {/* BALANCE SHEET DRILL-DOWN CONCEPT */}
          <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:underline">
            View on Balance Sheet <ExternalLink size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10">
                <th className="p-4">SKU / Part Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Qty on Hand</th>
                <th className="p-4 text-right">Moving Average</th>
                <th className="p-4 text-right">Total Position</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-white/5">
              {filteredInventory.map((item) => {
                const totalValue = item.qty * item.movingAvg;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {item.sku}
                      </p>
                      <p className="text-xs text-slate-500">{item.name}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-bold uppercase tracking-widest">
                        {item.branch}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-mono font-black ${item.qty === 0 ? "text-red-500" : ""}`}
                      >
                        {item.qty}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-500">
                      {formatCurrency(item.movingAvg)}
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalValue)}
                      </span>
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

export default StockValue;
