import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Clock,
  UserCheck,
  PackageSearch,
  Zap,
  BarChart3,
  MapPin,
  TrendingUp,
} from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ==========================================
// MOCK DATA ENGINE (Capstone Scope Aligned)
// ==========================================
const BRANCH_DATA = [
  {
    branch: "Main",
    laborRev: 145000,
    partsRev: 95000,
    totalRev: 240000,
    ocrExpenses: 85000,
    efficiency: 3.2,
  },
  {
    branch: "Second",
    laborRev: 110000,
    partsRev: 75000,
    totalRev: 185000,
    ocrExpenses: 60000,
    efficiency: 2.8,
  },
  {
    branch: "Third",
    laborRev: 80000,
    partsRev: 45000,
    totalRev: 125000,
    ocrExpenses: 55000,
    efficiency: 4.5,
  },
];

const DEEP_DIVE_DATA = {
  Main: {
    topServices: [
      "Engine Overhaul",
      "Preventive Maintenance",
      "Aircon Cleaning",
    ],
    topMechanics: ["Alex Turbo (42 Cards)", "Santi Gear (38 Cards)"],
    fastestParts: ["10W-40 Synthetic Oil", "Brake Pads (Toyota)"],
  },
  Second: {
    topServices: ["Brake System Flush", "Suspension Tuning", "Wheel Alignment"],
    topMechanics: ['Mike "Wrench" Torres (45 Cards)', "Luis Tan (40 Cards)"],
    fastestParts: ["Ceramic Brake Pads", "DOT 4 Brake Fluid"],
  },
  Third: {
    topServices: ["Tire Replacement", "Battery Services", "Basic PMS"],
    topMechanics: ["John Doe (30 Cards)", "Eric Garcia (28 Cards)"],
    fastestParts: ["Michelin Tires", "Cabin Air Filters"],
  },
};

const formatMoney = (val) =>
  `₱${Number(val).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// ==========================================
// MAIN COMPONENT
// ==========================================
const BranchRanking = () => {
  const [metric, setMetric] = useState("FINANCIAL"); // 'FINANCIAL' | 'EFFICIENCY'
  const [selectedBranch, setSelectedBranch] = useState("Main");

  const currentDeepDive = DEEP_DIVE_DATA[selectedBranch];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. CHART & METRIC TOGGLE */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20 shrink-0">
              <BarChart3 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Enterprise Ranking
              </h2>
              <p className="text-sm text-slate-500 font-bold mt-1">
                Comparing revenue mix and operational speed across locations.
              </p>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setMetric("FINANCIAL")}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${metric === "FINANCIAL" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
            >
              Financial Matrix
            </button>
            <button
              onClick={() => setMetric("EFFICIENCY")}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${metric === "EFFICIENCY" ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
            >
              Turnover Efficiency
            </button>
          </div>
        </div>

        {/* Recharts Visual Data */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {metric === "FINANCIAL" ? (
              <ComposedChart
                data={BRANCH_DATA}
                margin={{ top: 20, right: 20, left: -10, bottom: 0 }}
                onClick={(data) => {
                  if (data && data.activeLabel)
                    setSelectedBranch(data.activeLabel);
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                  opacity={0.1}
                />
                <XAxis
                  dataKey="branch"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  stroke="#94a3b8"
                  dy={10}
                  fontWeight="bold"
                  uppercase="true"
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  stroke="#94a3b8"
                  tickFormatter={(value) => `₱${value / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#1e293b",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  formatter={(value) => formatMoney(value)}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "10px",
                    fontWeight: "black",
                    paddingTop: "20px",
                  }}
                />

                {/* Stacked Revenue Bars */}
                <Bar
                  yAxisId="left"
                  dataKey="laborRev"
                  name="Labor Revenue"
                  stackId="a"
                  fill="#3b82f6"
                  radius={[0, 0, 4, 4]}
                  barSize={40}
                  cursor="pointer"
                />
                <Bar
                  yAxisId="left"
                  dataKey="partsRev"
                  name="Parts Sales"
                  stackId="a"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                  cursor="pointer"
                />

                {/* OCR Expense Line */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ocrExpenses"
                  name="OCR Tracked Expenses"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: "#f43f5e",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                />
              </ComposedChart>
            ) : (
              <ComposedChart
                data={BRANCH_DATA}
                margin={{ top: 20, right: 20, left: -10, bottom: 0 }}
                onClick={(data) => {
                  if (data && data.activeLabel)
                    setSelectedBranch(data.activeLabel);
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                  opacity={0.1}
                />
                <XAxis
                  dataKey="branch"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
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
                  tickFormatter={(value) => `${value} Hrs`}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#1e293b",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  formatter={(value) => `${value} Hours`}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "10px",
                    fontWeight: "black",
                    paddingTop: "20px",
                  }}
                />
                <Bar
                  dataKey="efficiency"
                  name="Avg Turnover Time (Lower is Better)"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                  cursor="pointer"
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
          Click on any branch bar above to view its Deep-Dive stats below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. EFFICIENCY LEADERBOARD */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="text-amber-500" size={24} />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                Efficiency Leaderboard
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                Performance Metrics
              </p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            {[...BRANCH_DATA]
              .sort((a, b) => a.efficiency - b.efficiency) // Sort lowest to highest time
              .map((branch, i) => (
                <div
                  key={branch.branch}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-colors cursor-pointer ${selectedBranch === branch.branch ? "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}
                  onClick={() => setSelectedBranch(branch.branch)}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-2xl font-black ${i === 0 ? "text-amber-500" : "text-slate-300 dark:text-white/20"}`}
                    >
                      #{i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {branch.branch} Branch
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                        <TrendingUp
                          size={10}
                          className={
                            i === 0 ? "text-emerald-500" : "text-slate-400"
                          }
                        />{" "}
                        Turnover Speed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-black flex items-center gap-1 justify-end ${i === 0 ? "text-emerald-500" : "text-amber-500"}`}
                    >
                      <Clock size={14} /> {branch.efficiency} Hrs
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 3. DEEP DIVE (DRILL DOWN) - Your beautiful UI preserved */}
        <div className="lg:col-span-2 bg-slate-900 p-8 sm:p-10 rounded-[32px] text-white shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute right-0 top-0 opacity-5 -translate-y-1/4 translate-x-1/4 pointer-events-none">
            <Zap size={350} />
          </div>

          <div className="relative z-10 flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 border-b border-white/10 pb-6">
              <div>
                <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  <MapPin className="text-amber-500" size={28} />{" "}
                  {selectedBranch} Deep-Dive
                </h3>
                <p className="text-slate-400 text-sm font-bold mt-2">
                  Identifying the operational drivers of branch success.
                </p>
              </div>
              <div className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-400 border border-white/5 shadow-inner">
                Active Insights
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedBranch}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {/* Top Services */}
                <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4">
                    <Zap size={14} className="text-blue-400" /> Top Services
                  </p>
                  {currentDeepDive.topServices.map((s) => (
                    <div
                      key={s}
                      className="text-sm font-bold border-l-2 border-blue-500 pl-3 py-1 text-slate-200"
                    >
                      {s}
                    </div>
                  ))}
                </div>

                {/* Top Mechanics */}
                <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4">
                    <UserCheck size={14} className="text-emerald-400" /> Key
                    Mechanics
                  </p>
                  {currentDeepDive.topMechanics.map((m) => (
                    <div
                      key={m}
                      className="text-sm font-bold border-l-2 border-emerald-500 pl-3 py-1 text-slate-200"
                    >
                      {m}
                    </div>
                  ))}
                </div>

                {/* Inventory Speed */}
                <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4">
                    <PackageSearch size={14} className="text-amber-400" />{" "}
                    Fast-Moving Parts
                  </p>
                  {currentDeepDive.fastestParts.map((p) => (
                    <div
                      key={p}
                      className="text-sm font-bold border-l-2 border-amber-500 pl-3 py-1 text-slate-200"
                    >
                      {p}
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchRanking;
