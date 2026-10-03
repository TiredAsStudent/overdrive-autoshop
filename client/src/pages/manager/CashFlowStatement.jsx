import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Banknote,
  Download,
  Calendar,
  TrendingUp,
  Activity,
  Calculator,
  Loader2,
  Wallet,
} from "lucide-react";

// Services
import { cashFlowStatementService } from "../../services/manager/cashFlowStatement.service";
import { inventoryService } from "../../services/manager/inventory.service";

// Shared Components
import PageHeader from "../../components/shared/PageHeader";
import FilterModal from "../../components/shared/FilterModal";

// UI Components
import FilterButton from "../../components/ui/FilterButton";
import ActionButton from "../../components/ui/ActionButton";
import StatCard from "../../components/ui/StatCard";
import StatusToggle from "../../components/ui/StatusToggle";

import { useApp } from "../../context/AppContext";

// --- Date Utility Helpers ---
const getPresetDates = (preset) => {
  const today = new Date();
  let start, end;

  switch (preset) {
    case "this_month":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case "this_quarter":
      const currentQuarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), currentQuarter * 3, 1);
      end = new Date(today.getFullYear(), currentQuarter * 3 + 3, 0);
      break;
    case "this_year":
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
      break;
    default:
      return null;
  }

  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  return { start: formatDate(start), end: formatDate(end) };
};

const CashFlowStatement = () => {
  const { showToast } = useApp();
  const [searchParams] = useSearchParams();

  const urlBranch = searchParams.get("branch");
  const urlStartDate = searchParams.get("startDate");
  const urlEndDate = searchParams.get("endDate");

  const initialDates = getPresetDates("this_month");

  let defaultStart = initialDates.start;
  let defaultEnd = initialDates.end;
  let defaultPreset = "this_month";

  if (urlStartDate || urlEndDate) {
    defaultPreset = "custom";
    defaultEnd = urlEndDate || initialDates.end;
    if (urlStartDate) {
      defaultStart = urlStartDate;
    } else if (urlEndDate) {
      const endObj = new Date(urlEndDate);
      if (!isNaN(endObj.getTime())) {
        defaultStart = `${endObj.getFullYear()}-01-01`;
      }
    }
  }

  // State
  const [data, setData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [branchFilter, setBranchFilter] = useState(urlBranch || "all");
  const [datePreset, setDatePreset] = useState(defaultPreset);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [hideZero, setHideZero] = useState(true);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) +
    (datePreset !== "this_month" ? 1 : 0) +
    (hideZero ? 1 : 0);

  // Initial Load: Branches
  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch(() => console.error("Failed to fetch branches."));
  }, []);

  // Fetch Cash Flow Data
  const loadCashFlowStatement = async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      const res = await cashFlowStatementService.getCashFlowStatement({
        branch: branchFilter,
        start_date: startDate,
        end_date: endDate,
        hide_zero: hideZero,
      });
      setData(res.data);
    } catch (error) {
      showToast(error.message, "error");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashFlowStatement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter, startDate, endDate, hideZero]);

  const handlePresetChange = (val) => {
    setDatePreset(val);
    if (val !== "custom") {
      const { start, end } = getPresetDates(val);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleCustomDateChange = (field, value) => {
    setDatePreset("custom");
    if (field === "start") setStartDate(value);
    if (field === "end") setEndDate(value);
  };

  const resetFilters = () => {
    setBranchFilter("all");
    setDatePreset("this_month");
    const { start, end } = getPresetDates("this_month");
    setStartDate(start);
    setEndDate(end);
    setHideZero(true);
    setIsFilterModalOpen(false);
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    const formatted = Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return num < 0 ? `(₱${formatted})` : `₱${formatted}`;
  };

  const renderActivityRows = (activities) => {
    if (!activities || activities.length === 0) {
      return (
        <div className="flex justify-between py-2 text-sm">
          <span className="text-slate-400 italic">
            No cash movements recorded
          </span>
          <span className="text-slate-400 font-mono">₱0.00</span>
        </div>
      );
    }

    return activities.map((activity, idx) => (
      <div
        key={idx}
        className="flex justify-between items-center py-2.5 px-2 -mx-2 text-sm border-b border-dashed border-slate-100 dark:border-slate-800 last:border-0 print:border-none print:px-0 print:mx-0"
      >
        <span className="text-slate-700 dark:text-slate-300 font-medium print:text-black">
          {activity.description}
        </span>
        <span
          className={`font-mono print:text-black ${
            activity.net_balance < 0
              ? "text-red-500 dark:text-red-400"
              : "text-slate-900 dark:text-white"
          }`}
        >
          {formatCurrency(activity.net_balance)}
        </span>
      </div>
    ));
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* PAGE HEADER & CONTROLS */}
      <PageHeader
        title="Cash Flow Statement"
        subtitle="Business Liquidity & Cash Movements"
        icon={Banknote}
      >
        {/* Quick Date Presets (Desktop) */}
        <div className="hidden lg:block">
          <StatusToggle
            activeValue={datePreset}
            onToggle={handlePresetChange}
            options={[
              { label: "This Month", value: "this_month" },
              { label: "This Quarter", value: "this_quarter" },
              { label: "This Year", value: "this_year" },
            ]}
          />
        </div>

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <div className="flex gap-2">
          <ActionButton
            label="Export"
            icon={Download}
            onClick={() =>
              showToast("CSV export queued for reporting phase.", "info")
            }
            disabled={!data || loading}
          />
        </div>
      </PageHeader>

      {/* KPI DASHBOARD (Hidden in Print) */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:hidden">
          <StatCard
            title="Opening Balance"
            value={formatCurrency(data.opening_balance)}
            icon={Wallet}
            variant="default"
          />
          <StatCard
            title="Net Operating Cash"
            value={formatCurrency(data.summary.net_operating)}
            icon={Activity}
            variant={data.summary.net_operating >= 0 ? "success" : "danger"}
          />
          <StatCard
            title="Net Change in Cash"
            value={formatCurrency(data.summary.net_change_in_cash)}
            icon={TrendingUp}
            variant={data.summary.net_change_in_cash >= 0 ? "info" : "warning"}
          />
          <StatCard
            title="Ending Cash Balance"
            value={formatCurrency(data.summary.ending_balance)}
            icon={Calculator}
            variant={data.summary.ending_balance >= 0 ? "success" : "danger"}
          />
        </div>
      )}

      {/* FINANCIAL STATEMENT (Printable Document Area) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[24px] sm:rounded-[32px] shadow-sm overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Print & Document Header */}
        <div className="p-6 sm:p-8 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-800/50 text-center bg-slate-50 dark:bg-slate-900/50 print:bg-transparent print:border-b-2 print:border-slate-900">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
            Cash Flow Statement
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 mt-1.5 uppercase print:text-black">
            {branchFilter === "all"
              ? "Enterprise Global (Consolidated)"
              : branches.find((b) => b.id.toString() === branchFilter)
                  ?.branch_name || "Branch Specific"}
          </p>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 mt-1.5 uppercase tracking-widest flex justify-center items-center gap-1.5 print:text-slate-700">
            <Calendar size={12} className="print:hidden" />
            For the period{" "}
            {new Date(startDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}{" "}
            to{" "}
            {new Date(endDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Loading / Empty States inside document */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32 text-slate-400 print:hidden">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Calculating Liquidity Movements...
            </p>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center print:hidden w-full max-w-[250px] sm:max-w-none mx-auto">
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-3">
              <Banknote
                size={28}
                className="opacity-40 sm:w-8 sm:h-8 w-6 h-6 text-slate-400"
              />
            </div>
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-normal">
              No Financial Data Available
            </p>
            <p className="text-[10px] sm:text-xs font-medium mt-1.5 opacity-70 text-slate-400 whitespace-normal">
              No cash transactions found for the selected reporting period.
            </p>
          </div>
        ) : (
          <div className="p-6 sm:p-10 lg:px-16 max-w-4xl mx-auto space-y-8 print:p-0 print:pt-6">
            {/* 0. BEGINNING BALANCE */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-slate-200 dark:border-slate-700 print:border-black">
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                Beginning Cash Balance
              </span>
              <span className="text-lg sm:text-xl font-black font-mono tracking-tight print:text-black">
                {formatCurrency(data.opening_balance)}
              </span>
            </div>

            {/* 1. OPERATING ACTIVITIES */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 print:text-black print:border-black">
                Cash Flow from Operating Activities
              </h3>
              <div className="pl-2 sm:pl-4">
                {renderActivityRows(data.operating_activities)}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white print:text-black print:border-black">
                <span className="uppercase text-[10px] sm:text-[11px] tracking-widest">
                  Net Cash from Operating Activities
                </span>
                <span className="font-mono text-sm sm:text-base">
                  {formatCurrency(data.summary.net_operating)}
                </span>
              </div>
            </div>

            {/* 2. INVESTING ACTIVITIES */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 mt-8 print:text-black print:border-black">
                Cash Flow from Investing Activities
              </h3>
              <div className="pl-2 sm:pl-4">
                {renderActivityRows(data.investing_activities)}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white print:text-black print:border-black">
                <span className="uppercase text-[10px] sm:text-[11px] tracking-widest">
                  Net Cash from Investing Activities
                </span>
                <span className="font-mono text-sm sm:text-base">
                  {formatCurrency(data.summary.net_investing)}
                </span>
              </div>
            </div>

            {/* 3. FINANCING ACTIVITIES */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-3 mt-8 print:text-black print:border-black">
                Cash Flow from Financing Activities
              </h3>
              <div className="pl-2 sm:pl-4">
                {renderActivityRows(data.financing_activities)}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white print:text-black print:border-black">
                <span className="uppercase text-[10px] sm:text-[11px] tracking-widest">
                  Net Cash from Financing Activities
                </span>
                <span className="font-mono text-sm sm:text-base">
                  {formatCurrency(data.summary.net_financing)}
                </span>
              </div>
            </div>

            {/* 4. NET CHANGE IN CASH (Subtotal) */}
            <div className="flex justify-between items-center py-4 px-4 sm:px-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mt-6 print:bg-transparent print:border-none print:px-0 print:border-t-2 print:border-b-2 print:border-black print:rounded-none">
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                Net Increase / (Decrease) in Cash
              </span>
              <span
                className={`text-lg sm:text-xl font-black font-mono tracking-tight print:text-black ${
                  data.summary.net_change_in_cash >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {formatCurrency(data.summary.net_change_in_cash)}
              </span>
            </div>

            {/* 5. ENDING BALANCE (Grand Total) */}
            <div className="flex justify-between items-center mt-8 pt-4 pb-4 border-t-2 border-b-4 border-double border-slate-900 dark:border-white print:border-black">
              <span className="text-base sm:text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                Ending Cash Balance
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight print:text-black ${
                  data.summary.ending_balance >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {formatCurrency(data.summary.ending_balance)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FILTER MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Report Parameters"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Branch Scope
            </label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Enterprise Global (Consolidated)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Reporting Period
            </label>
            <select
              value={datePreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 mb-3 cursor-pointer"
            >
              <option value="this_month">This Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>

            {datePreset === "custom" && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      handleCustomDateChange("start", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                      handleCustomDateChange("end", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <label className="flex items-center gap-3 cursor-pointer group p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors hover:border-amber-300">
              <input
                type="checkbox"
                checked={hideZero}
                onChange={(e) => setHideZero(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 bg-white dark:bg-slate-800 cursor-pointer shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-amber-500 transition-colors">
                  Hide Zero Balances
                </span>
                <span className="text-[9px] text-slate-400 leading-tight mt-0.5">
                  Suppresses categories with ₱0.00 activity from the report.
                </span>
              </div>
            </label>
          </div>
        </div>
      </FilterModal>
    </div>
  );
};

export default CashFlowStatement;
