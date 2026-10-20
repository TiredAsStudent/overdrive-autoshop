import React, { useState, useEffect, useCallback, useId } from "react";
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
  ChevronDown,
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

const DATE_PRESET_OPTIONS = [
  { label: "This Month", value: "this_month" },
  { label: "This Quarter", value: "this_quarter" },
  { label: "This Year", value: "this_year" },
];

// --- Date Utility Helpers ---
const getPresetDates = (preset) => {
  const today = new Date();
  let start;
  let end;

  switch (preset) {
    case "this_month":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case "this_quarter": {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), currentQuarter * 3, 1);
      end = new Date(today.getFullYear(), currentQuarter * 3 + 3, 0);
      break;
    }
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

const formatDisplayDate = (dateString) => {
  if (!dateString) return "N/A";
  const [year, month, day] = String(dateString).split("T")[0].split("-");
  if (year && month && day) {
    const localDate = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
    );
    if (!isNaN(localDate.getTime())) {
      return localDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }
  }
  const fallback = new Date(dateString);
  return isNaN(fallback.getTime())
    ? String(dateString)
    : fallback.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
};

const CashFlowStatement = () => {
  const { showToast } = useApp();
  const [searchParams] = useSearchParams();

  // Accessible Filter Modal IDs
  const branchSelectId = useId();
  const periodSelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();
  const hideZeroCheckboxId = useId();

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
      const [endYear] = String(urlEndDate).split("-");
      if (endYear && /^\d{4}$/.test(endYear)) {
        defaultStart = `${endYear}-01-01`;
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
    (!hideZero ? 1 : 0);

  // Initial Load: Branches
  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch(() => console.error("Failed to fetch branches."));
  }, []);

  // Fetch Cash Flow Data
  const loadCashFlowStatement = useCallback(async () => {
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
      showToast(
        error.message || "Unable to load Cash Flow Statement report.",
        "error",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [branchFilter, startDate, endDate, hideZero, showToast]);

  useEffect(() => {
    loadCashFlowStatement();
  }, [loadCashFlowStatement]);

  const handlePresetChange = (val) => {
    setDatePreset(val);
    if (val !== "custom") {
      const presetDates = getPresetDates(val);
      if (presetDates) {
        setStartDate(presetDates.start);
        setEndDate(presetDates.end);
      }
    }
  };

  const handleCustomDateChange = (field, value) => {
    setDatePreset("custom");
    if (field === "start") {
      setStartDate(value);
      if (value && endDate && value > endDate) {
        setEndDate(value);
      }
    } else if (field === "end") {
      setEndDate(value);
      if (value && startDate && value < startDate) {
        setStartDate(value);
      }
    }
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
    if (!Array.isArray(activities) || activities.length === 0) {
      return (
        <div className="flex justify-between items-center py-2.5 text-xs sm:text-sm">
          <span className="text-slate-400 dark:text-slate-500 italic">
            No cash movements recorded
          </span>
          <span className="text-slate-400 dark:text-slate-500 font-mono tabular-nums">
            ₱0.00
          </span>
        </div>
      );
    }

    return activities.map((activity, idx) => {
      const netBalance = parseFloat(activity.net_balance) || 0;
      return (
        <div
          key={activity.id || `${activity.description}-${idx}`}
          className="flex justify-between items-center gap-4 py-2.5 px-2.5 -mx-2.5 text-xs sm:text-sm rounded-xl hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors border-b border-dashed border-slate-100 dark:border-slate-700/60 last:border-0 print:border-none print:px-0 print:mx-0"
        >
          <span className="text-slate-700 dark:text-slate-300 font-medium min-w-0 break-words print:text-black">
            {activity.description}
          </span>
          <span
            className={`font-mono tabular-nums font-bold shrink-0 print:text-black ${
              netBalance < 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {formatCurrency(netBalance)}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
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
            ariaLabel="Select cash flow reporting period preset"
            options={DATE_PRESET_OPTIONS}
          />
        </div>

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <ActionButton
          label="Export"
          icon={Download}
          onClick={() =>
            showToast("CSV export queued for reporting phase.", "info")
          }
          disabled={!data || loading}
        />
      </PageHeader>

      {/* KPI DASHBOARD (Hidden in Print) */}
      {data?.summary && (
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
      <div
        aria-busy={loading}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-[32px] shadow-xs overflow-hidden print:border-none print:shadow-none print:p-0"
      >
        {/* Print & Document Header */}
        <div className="p-6 sm:p-8 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-700/50 text-center bg-slate-50/70 dark:bg-slate-900/50 print:bg-transparent print:border-b-2 print:border-slate-900">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
            Cash Flow Statement
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mt-1.5 uppercase print:text-black">
            {branchFilter === "all"
              ? "Enterprise Global (Consolidated)"
              : branches.find(
                  (b) => b.id.toString() === branchFilter.toString(),
                )?.branch_name || "Branch Specific"}
          </p>
          <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-widest flex justify-center items-center gap-1.5 print:text-slate-700">
            <Calendar size={12} aria-hidden="true" className="print:hidden" />
            <span>
              For the period {formatDisplayDate(startDate)} to{" "}
              {formatDisplayDate(endDate)}
            </span>
          </p>
        </div>

        {/* Loading / Empty States inside document */}
        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col items-center justify-center py-20 sm:py-32 text-slate-400 print:hidden"
          >
            <Loader2
              aria-hidden="true"
              className="w-8 h-8 animate-spin mb-3 text-amber-500"
            />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
              Calculating Liquidity Movements...
            </p>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center print:hidden w-full max-w-[260px] sm:max-w-md mx-auto">
            <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900/60 rounded-full mb-3 border border-slate-100 dark:border-white/5">
              <Banknote
                size={28}
                aria-hidden="true"
                className="opacity-40 sm:w-8 sm:h-8 w-6 h-6 text-slate-400"
              />
            </div>
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 whitespace-normal">
              No Financial Data Available
            </p>
            <p className="text-[11px] sm:text-xs font-medium mt-1.5 text-slate-500 dark:text-slate-400 whitespace-normal leading-relaxed">
              No cash transactions found for the selected reporting period.
            </p>
          </div>
        ) : (
          <div className="p-6 sm:p-10 lg:px-16 max-w-4xl mx-auto space-y-8 print:p-0 print:pt-6">
            {/* 0. BEGINNING BALANCE */}
            <div className="flex justify-between items-center gap-4 pb-4 border-b-2 border-slate-200 dark:border-slate-700 print:border-black">
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                Beginning Cash Balance
              </span>
              <span
                className={`text-lg sm:text-xl font-black font-mono tabular-nums tracking-tight shrink-0 print:text-black ${
                  (parseFloat(data.opening_balance) || 0) < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {formatCurrency(data.opening_balance)}
              </span>
            </div>

            {/* 1. OPERATING ACTIVITIES */}
            <section>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-700 pb-2 mb-3 print:text-black print:border-black">
                Cash Flow from Operating Activities
              </h3>
              <div className="pl-2 sm:pl-4">
                {renderActivityRows(data.operating_activities)}
              </div>
              <div className="flex justify-between items-center gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white print:text-black print:border-black">
                <span className="uppercase text-[10px] sm:text-[11px] tracking-widest">
                  Net Cash from Operating Activities
                </span>
                <span
                  className={`font-mono tabular-nums font-black text-sm sm:text-base shrink-0 print:text-black ${
                    (parseFloat(data.summary.net_operating) || 0) < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {formatCurrency(data.summary.net_operating)}
                </span>
              </div>
            </section>

            {/* 2. INVESTING ACTIVITIES */}
            <section>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-700 pb-2 mb-3 mt-8 print:text-black print:border-black">
                Cash Flow from Investing Activities
              </h3>
              <div className="pl-2 sm:pl-4">
                {renderActivityRows(data.investing_activities)}
              </div>
              <div className="flex justify-between items-center gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white print:text-black print:border-black">
                <span className="uppercase text-[10px] sm:text-[11px] tracking-widest">
                  Net Cash from Investing Activities
                </span>
                <span
                  className={`font-mono tabular-nums font-black text-sm sm:text-base shrink-0 print:text-black ${
                    (parseFloat(data.summary.net_investing) || 0) < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {formatCurrency(data.summary.net_investing)}
                </span>
              </div>
            </section>

            {/* 3. FINANCING ACTIVITIES */}
            <section>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-700 pb-2 mb-3 mt-8 print:text-black print:border-black">
                Cash Flow from Financing Activities
              </h3>
              <div className="pl-2 sm:pl-4">
                {renderActivityRows(data.financing_activities)}
              </div>
              <div className="flex justify-between items-center gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white print:text-black print:border-black">
                <span className="uppercase text-[10px] sm:text-[11px] tracking-widest">
                  Net Cash from Financing Activities
                </span>
                <span
                  className={`font-mono tabular-nums font-black text-sm sm:text-base shrink-0 print:text-black ${
                    (parseFloat(data.summary.net_financing) || 0) < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {formatCurrency(data.summary.net_financing)}
                </span>
              </div>
            </section>

            {/* 4. NET CHANGE IN CASH (Subtotal) */}
            <div className="flex justify-between items-center gap-4 py-4 px-4 sm:px-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 mt-6 print:bg-transparent print:border-none print:px-0 print:border-t-2 print:border-b-2 print:border-black print:rounded-none">
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                Net Increase / (Decrease) in Cash
              </span>
              <span
                className={`text-lg sm:text-xl font-black font-mono tabular-nums tracking-tight shrink-0 print:text-black ${
                  data.summary.net_change_in_cash >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {formatCurrency(data.summary.net_change_in_cash)}
              </span>
            </div>

            {/* 5. ENDING BALANCE (Grand Total with Typographic Parity) */}
            <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 mt-8 pt-4 pb-4 border-t-2 border-b-4 border-double border-slate-900 dark:border-white print:border-black">
              <span className="text-sm sm:text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                Ending Cash Balance
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight shrink-0 print:text-black ${
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
            <label htmlFor={branchSelectId} className="form-label">
              Branch Scope
            </label>
            <div className="relative">
              <select
                id={branchSelectId}
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">Enterprise Global (Consolidated)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                aria-hidden="true"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor={periodSelectId} className="form-label">
              Reporting Period
            </label>
            <div className="relative">
              <select
                id={periodSelectId}
                value={datePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="this_month">This Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom Date Range</option>
              </select>
              <ChevronDown
                size={15}
                aria-hidden="true"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {datePreset === "custom" && (
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <div>
                  <label htmlFor={startDateInputId} className="form-label">
                    Start Date
                  </label>
                  <input
                    id={startDateInputId}
                    type="date"
                    max={endDate || undefined}
                    value={startDate}
                    onChange={(e) =>
                      handleCustomDateChange("start", e.target.value)
                    }
                    className="form-input font-mono tabular-nums cursor-pointer"
                  />
                </div>
                <div>
                  <label htmlFor={endDateInputId} className="form-label">
                    End Date
                  </label>
                  <input
                    id={endDateInputId}
                    type="date"
                    min={startDate || undefined}
                    value={endDate}
                    onChange={(e) =>
                      handleCustomDateChange("end", e.target.value)
                    }
                    className="form-input font-mono tabular-nums cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <label
              htmlFor={hideZeroCheckboxId}
              className="flex items-center gap-3 cursor-pointer group p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors hover:border-amber-300 dark:hover:border-amber-500/40 select-none"
            >
              <input
                id={hideZeroCheckboxId}
                type="checkbox"
                checked={hideZero}
                onChange={(e) => setHideZero(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-amber-500 text-amber-500 focus:ring-amber-500 bg-white dark:bg-slate-800 cursor-pointer shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-overdrive-yellow transition-colors">
                  Hide Zero Balances
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
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
