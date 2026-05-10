import React, { useState, useMemo } from "react";
import {
  Landmark,
  Calendar,
  MapPin,
  Download,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  Building,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

// --- DUMMY DATA ENGINE (Perfectly Balanced) ---
const MOCK_DATA = {
  assets: {
    current: [
      { id: "1000", name: "Cash on Hand & Bank", value: 250000.0 },
      { id: "1200", name: "Accounts Receivable", value: 50000.0 },
      { id: "1300", name: "Inventory Assets (Moving Avg)", value: 195000.0 },
    ],
    fixed: [
      { id: "1500", name: "Shop Equipment & Lifts", value: 500000.0 },
      {
        id: "1501",
        name: "Accumulated Depreciation",
        value: -25000.0,
        isContra: true,
      },
    ],
  },
  liabilities: {
    current: [
      { id: "2000", name: "Accounts Payable (Suppliers)", value: 120000.0 },
      { id: "2100", name: "Output VAT Payable", value: 35000.0 },
    ],
    longTerm: [{ id: "2500", name: "Business Bank Loan", value: 200000.0 }],
  },
  equity: [
    { id: "3000", name: "Owner's Capital", value: 500000.0 },
    { id: "3100", name: "Retained Earnings (Net Income)", value: 115000.0 },
  ],
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount,
  );

const BalanceSheet = () => {
  // --- STATE ---
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // --- CALCULATIONS ---
  // A branch multiplier to simulate data changing when a branch is selected
  const mult =
    selectedBranch === "All" ? 1.0 : selectedBranch === "Calamba" ? 0.5 : 0.3;

  const totalCurrentAssets =
    MOCK_DATA.assets.current.reduce((sum, item) => sum + item.value, 0) * mult;
  const totalFixedAssets =
    MOCK_DATA.assets.fixed.reduce((sum, item) => sum + item.value, 0) * mult;
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  const totalCurrentLiabilities =
    MOCK_DATA.liabilities.current.reduce((sum, item) => sum + item.value, 0) *
    mult;
  const totalLongTermLiabilities =
    MOCK_DATA.liabilities.longTerm.reduce((sum, item) => sum + item.value, 0) *
    mult;
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const totalEquity =
    MOCK_DATA.equity.reduce((sum, item) => sum + item.value, 0) * mult;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  // The Ultimate Integrity Check
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

  // Liquidity Ratios
  const currentRatio = totalCurrentAssets / totalCurrentLiabilities;
  const debtToEquity = totalLiabilities / totalEquity;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 relative">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <Landmark className="text-indigo-500" size={28} />
            Balance Sheet
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Statement of Financial Position
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* As Of Date Filter */}
          <div className="relative flex-1 md:w-40">
            <Calendar
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
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

      {/* FINANCIAL HEALTH RATIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Ratio */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={14} className="text-emerald-500" />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Current Ratio (Liquidity)
              </p>
            </div>
            <h2 className="text-3xl font-mono font-black text-slate-900 dark:text-white mt-1">
              {currentRatio.toFixed(2)}
            </h2>
            <p className="text-[10px] font-bold text-emerald-500 mt-1">
              Healthy ({">"} 1.5): Shop can easily pay short-term debts.
            </p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center">
            <span className="text-xs font-black text-emerald-500">Good</span>
          </div>
        </div>

        {/* Debt to Equity Ratio */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building size={14} className="text-indigo-500" />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Debt-to-Equity
              </p>
            </div>
            <h2 className="text-3xl font-mono font-black text-slate-900 dark:text-white mt-1">
              {debtToEquity.toFixed(2)}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1">
              Proportion of business financed by creditors vs owner.
            </p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 flex items-center justify-center">
            <span className="text-xs font-black text-indigo-500">Safe</span>
          </div>
        </div>
      </div>

      {/* THE BALANCE SHEET (Split View) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 text-center bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">
            Overdrive Auto Shop
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
            Balance Sheet •{" "}
            {selectedBranch === "All" ? "Consolidated" : selectedBranch}
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            As of{" "}
            {new Date(asOfDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/10">
          {/* LEFT COLUMN: ASSETS */}
          <div className="p-6 md:p-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
              Assets{" "}
              <span className="text-[9px] text-slate-400 font-medium">
                (What the business owns)
              </span>
            </h3>

            <table className="w-full text-left text-sm">
              <tbody>
                {/* Current Assets */}
                <tr>
                  <td
                    colSpan="2"
                    className="pb-2 text-xs font-bold text-slate-500 uppercase tracking-widest"
                  >
                    Current Assets
                  </td>
                </tr>
                {MOCK_DATA.assets.current.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <td className="py-2 pl-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      {item.name}
                      {item.id === "1300" && (
                        <ExternalLink
                          size={12}
                          className="text-indigo-400 opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="View Stock Data"
                        />
                      )}
                    </td>
                    <td className="py-2 text-right font-mono text-slate-900 dark:text-white">
                      {formatCurrency(item.value * mult)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold border-b border-slate-200 dark:border-white/10">
                  <td className="py-3 pl-2 text-slate-900 dark:text-white">
                    Total Current Assets
                  </td>
                  <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                    {formatCurrency(totalCurrentAssets)}
                  </td>
                </tr>

                {/* Fixed Assets */}
                <tr>
                  <td
                    colSpan="2"
                    className="pt-6 pb-2 text-xs font-bold text-slate-500 uppercase tracking-widest"
                  >
                    Fixed Assets (Property & Equipment)
                  </td>
                </tr>
                {MOCK_DATA.assets.fixed.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <td
                      className={`py-2 pl-2 ${item.isContra ? "text-rose-600 dark:text-rose-400 italic" : "text-slate-700 dark:text-slate-300"}`}
                    >
                      {item.name}
                    </td>
                    <td
                      className={`py-2 text-right font-mono ${item.isContra ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}
                    >
                      {formatCurrency(item.value * mult)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-3 pl-2 text-slate-900 dark:text-white">
                    Total Fixed Assets (Net)
                  </td>
                  <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                    {formatCurrency(totalFixedAssets)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* RIGHT COLUMN: LIABILITIES & EQUITY */}
          <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-black/10">
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-6 flex items-center gap-2">
              Liabilities & Equity{" "}
              <span className="text-[9px] text-slate-400 font-medium">
                (Who claims the assets)
              </span>
            </h3>

            <table className="w-full text-left text-sm">
              <tbody>
                {/* Current Liabilities */}
                <tr>
                  <td
                    colSpan="2"
                    className="pb-2 text-xs font-bold text-slate-500 uppercase tracking-widest"
                  >
                    Current Liabilities
                  </td>
                </tr>
                {MOCK_DATA.liabilities.current.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <td className="py-2 pl-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      {item.name}
                      {item.id === "2100" && (
                        <ExternalLink
                          size={12}
                          className="text-amber-400 opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="View VAT Ledger"
                        />
                      )}
                    </td>
                    <td className="py-2 text-right font-mono text-slate-900 dark:text-white">
                      {formatCurrency(item.value * mult)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold border-b border-slate-200 dark:border-white/10">
                  <td className="py-3 pl-2 text-slate-900 dark:text-white">
                    Total Current Liabilities
                  </td>
                  <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                    {formatCurrency(totalCurrentLiabilities)}
                  </td>
                </tr>

                {/* Long Term Liabilities */}
                <tr>
                  <td
                    colSpan="2"
                    className="pt-6 pb-2 text-xs font-bold text-slate-500 uppercase tracking-widest"
                  >
                    Long-Term Liabilities
                  </td>
                </tr>
                {MOCK_DATA.liabilities.longTerm.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <td className="py-2 pl-2 text-slate-700 dark:text-slate-300">
                      {item.name}
                    </td>
                    <td className="py-2 text-right font-mono text-slate-900 dark:text-white">
                      {formatCurrency(item.value * mult)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold border-b-2 border-slate-300 dark:border-white/20">
                  <td className="py-3 pl-2 text-slate-900 dark:text-white">
                    Total Liabilities
                  </td>
                  <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                    {formatCurrency(totalLiabilities)}
                  </td>
                </tr>

                {/* Equity */}
                <tr>
                  <td
                    colSpan="2"
                    className="pt-6 pb-2 text-xs font-bold text-slate-500 uppercase tracking-widest"
                  >
                    Owner's Equity
                  </td>
                </tr>
                {MOCK_DATA.equity.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <td className="py-2 pl-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      {item.name}
                      {item.id === "3100" && (
                        <TrendingUp
                          size={12}
                          className="text-emerald-500 opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Linked from Income Statement"
                        />
                      )}
                    </td>
                    <td className="py-2 text-right font-mono text-slate-900 dark:text-white">
                      {formatCurrency(item.value * mult)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-3 pl-2 text-slate-900 dark:text-white">
                    Total Equity
                  </td>
                  <td className="py-3 text-right font-mono text-slate-900 dark:text-white">
                    {formatCurrency(totalEquity)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* THE INTEGRITY CHECK FOOTER */}
        <div
          className={`p-6 border-t-[3px] flex flex-col md:flex-row justify-between items-center gap-6 transition-colors ${
            isBalanced
              ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-500"
              : "bg-rose-50 border-rose-500 dark:bg-rose-900/20 dark:border-rose-500"
          }`}
        >
          <div className="flex items-center gap-3">
            {isBalanced ? (
              <ShieldCheck
                size={28}
                className="text-emerald-600 dark:text-emerald-400"
              />
            ) : (
              <AlertTriangle
                size={28}
                className="text-rose-600 dark:text-rose-400"
              />
            )}
            <div>
              <h3
                className={`text-base font-black uppercase tracking-widest ${
                  isBalanced
                    ? "text-emerald-800 dark:text-emerald-400"
                    : "text-rose-800 dark:text-rose-400"
                }`}
              >
                {isBalanced
                  ? "Accounting Equation Balanced"
                  : "Imbalance Detected"}
              </h3>
              <p
                className={`text-[10px] font-bold ${isBalanced ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-rose-600/80 dark:text-rose-400/80"}`}
              >
                Assets perfectly equal Liabilities + Equity.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-12 w-full md:w-auto">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Total Assets
              </p>
              <p
                className={`text-2xl font-mono font-black ${isBalanced ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
              >
                {formatCurrency(totalAssets)}
              </p>
            </div>
            <div className="hidden md:block w-px bg-slate-300 dark:bg-slate-600 h-10 self-center"></div>
            <div className="text-right border-b-[6px] border-double border-slate-300 dark:border-slate-600 pb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Total Liabilities & Equity
              </p>
              <p
                className={`text-2xl font-mono font-black ${isBalanced ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
              >
                {formatCurrency(totalLiabilitiesAndEquity)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
