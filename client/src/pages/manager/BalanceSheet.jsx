import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scale,
  Download,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Landmark,
  Calendar,
} from "lucide-react";

// Services
import { balanceSheetService } from "../../services/manager/balanceSheet.service";
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

// --- Date Utility Helpers (Point-in-Time Focus) ---
const getAsOfDate = (preset) => {
  const today = new Date();
  let target;

  switch (preset) {
    case "today":
      target = today;
      break;
    case "this_month_end":
      target = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case "this_quarter_end":
      const currentQuarter = Math.floor(today.getMonth() / 3);
      target = new Date(today.getFullYear(), currentQuarter * 3 + 3, 0);
      break;
    case "this_year_end":
      target = new Date(today.getFullYear(), 11, 31);
      break;
    default:
      return null;
  }

  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
};

const BalanceSheet = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();

  const initialDate = getAsOfDate("today");

  // State
  const [data, setData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [branchFilter, setBranchFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("today");
  const [asOfDate, setAsOfDate] = useState(initialDate);
  const [hideZero, setHideZero] = useState(true);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) +
    (datePreset !== "today" ? 1 : 0) +
    (hideZero ? 1 : 0);

  // Initial Load: Branches
  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch(() => console.error("Failed to fetch branches."));
  }, []);

  // Fetch Balance Sheet Data
  const loadBalanceSheet = async () => {
    if (!asOfDate) return;

    try {
      setLoading(true);
      const res = await balanceSheetService.getBalanceSheet({
        branch: branchFilter,
        as_of_date: asOfDate,
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
    loadBalanceSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter, asOfDate, hideZero]);

  const handlePresetChange = (val) => {
    setDatePreset(val);
    if (val !== "custom") {
      setAsOfDate(getAsOfDate(val));
    }
  };

  const handleCustomDateChange = (value) => {
    setDatePreset("custom");
    setAsOfDate(value);
  };

  const resetFilters = () => {
    setBranchFilter("all");
    setDatePreset("today");
    setAsOfDate(getAsOfDate("today"));
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

  // --- GENERAL LEDGER DRILL-DOWN ---
  const handleDrillDown = (accountId) => {
    if (accountId === "current_earnings") {
      // Dynamic route to Income Statement for drill down on Current Earnings
      const params = new URLSearchParams();
      if (branchFilter && branchFilter !== "all") {
        params.append("branch", branchFilter);
      }
      params.append("endDate", asOfDate); // Set end boundary to balance sheet cutoff
      navigate(`/manager/reports/income-statement?${params.toString()}`);
      return;
    }

    const params = new URLSearchParams();
    params.append("accountId", accountId);

    if (branchFilter && branchFilter !== "all") {
      params.append("branch", branchFilter);
    }
    if (asOfDate) params.append("endDate", asOfDate);

    navigate(`/manager/accounting/general-ledger?${params.toString()}`);
  };

  const renderAccountRows = (accounts) => {
    if (!accounts || accounts.length === 0) {
      return (
        <div className="flex justify-between py-2 text-sm">
          <span className="text-slate-400 italic">No activity recorded</span>
          <span className="text-slate-400 font-mono">₱0.00</span>
        </div>
      );
    }

    return accounts.map((acc) => (
      <div
        key={acc.id}
        onClick={() => handleDrillDown(acc.id)}
        className="flex justify-between items-center py-2.5 px-2 -mx-2 text-sm hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer rounded-lg border-b border-dashed border-slate-100 dark:border-slate-800 last:border-0 group print:border-none print:px-0 print:mx-0 print:cursor-auto"
        title={
          acc.id === "current_earnings"
            ? "Click to view Income Statement Details"
            : "Click to view detailed General Ledger for this account"
        }
      >
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 print:text-black print:group-hover:text-black transition-colors">
          <span>{acc.account_name}</span>
          <ArrowRight
            size={14}
            className="opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
          />
        </div>
        <span
          className={`font-mono text-slate-900 dark:text-white print:text-black ${acc.net_balance < 0 ? "text-red-500 dark:text-red-400" : ""}`}
        >
          {formatCurrency(acc.net_balance)}
        </span>
      </div>
    ));
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* PAGE HEADER & CONTROLS */}
      <PageHeader
        title="Balance Sheet"
        subtitle="Statement of Financial Position"
        icon={Landmark}
      >
        {/* Quick Date Presets (Desktop) */}
        <div className="hidden lg:block">
          <StatusToggle
            activeValue={datePreset}
            onToggle={handlePresetChange}
            options={[
              { label: "Today", value: "today" },
              { label: "Month End", value: "this_month_end" },
              { label: "Quarter End", value: "this_quarter_end" },
              { label: "Year End", value: "this_year_end" },
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
            title="Total Assets"
            value={formatCurrency(data.summary.total_assets)}
            icon={Building2}
            variant="success"
          />
          <StatCard
            title="Total Liabilities"
            value={formatCurrency(data.summary.total_liabilities)}
            icon={AlertTriangle}
            variant="warning"
          />
          <StatCard
            title="Total Owner's Equity"
            value={formatCurrency(data.summary.total_equity)}
            icon={Landmark}
            variant="default"
          />
          <StatCard
            title={
              data.summary.is_balanced ? "Equation Balanced" : "Out of Balance"
            }
            value={
              data.summary.is_balanced
                ? "Perfect Parity"
                : `Diff: ₱${formatCurrency(data.summary.discrepancy)}`
            }
            icon={data.summary.is_balanced ? CheckCircle2 : AlertTriangle}
            variant={data.summary.is_balanced ? "success" : "danger"}
          />
        </div>
      )}

      {/* FINANCIAL STATEMENT (Printable Document Area) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[24px] sm:rounded-[32px] shadow-sm overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="p-6 sm:p-8 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-800/50 text-center bg-slate-50 dark:bg-slate-900/50 print:bg-transparent print:border-b-2 print:border-slate-900">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
            Balance Sheet
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 mt-1.5 uppercase print:text-black">
            {branchFilter === "all"
              ? "Enterprise Global (Consolidated)"
              : branches.find((b) => b.id.toString() === branchFilter)
                  ?.branch_name || "Branch Specific"}
          </p>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 mt-1.5 uppercase tracking-widest flex justify-center items-center gap-1.5 print:text-slate-700">
            <Calendar size={12} className="print:hidden" />
            As of{" "}
            {new Date(asOfDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Status Warning Banner */}
        {data && !data.summary.is_balanced && (
          <div className="bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/20 p-4 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-500 flex items-center justify-center gap-2">
              <AlertTriangle size={16} /> Warning: The Accounting Equation is
              out of balance by ₱{formatCurrency(data.summary.discrepancy)}.
            </p>
            <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 font-bold">
              Review unmatched manual entries or missing opening balances in the
              General Ledger.
            </p>
          </div>
        )}

        {/* Loading / Empty States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32 text-slate-400 print:hidden">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Compiling Financial Position...
            </p>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center print:hidden w-full max-w-[250px] sm:max-w-none mx-auto">
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-3">
              <Scale
                size={28}
                className="opacity-40 sm:w-8 sm:h-8 w-6 h-6 text-slate-400"
              />
            </div>
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-normal">
              No Financial Data Available
            </p>
            <p className="text-[10px] sm:text-xs font-medium mt-1.5 opacity-70 text-slate-400 whitespace-normal">
              Ensure transactions exist up to the selected As-Of Date.
            </p>
          </div>
        ) : (
          <div className="p-6 sm:p-10 lg:px-16 max-w-4xl mx-auto space-y-8 print:p-0 print:pt-6">
            {/* 1. ASSETS */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-700 pb-2 mb-3 print:text-black print:border-black">
                Assets
              </h3>
              <div className="pl-2 sm:pl-4 space-y-2">
                {renderAccountRows(data.assets)}
              </div>
              <div className="flex justify-between items-center mt-8 pt-4 pb-4 border-t-2 border-b-4 border-double border-slate-900 dark:border-white print:border-black">
                <span className="text-base sm:text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                  Total Assets
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white print:text-black">
                  {formatCurrency(data.summary.total_assets)}
                </span>
              </div>
            </div>

            {/* 2. LIABILITIES */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-700 pb-2 mb-3 mt-8 print:text-black print:border-black">
                Liabilities
              </h3>
              <div className="pl-2 sm:pl-4 space-y-2">
                {renderAccountRows(data.liabilities)}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white print:text-black print:border-black">
                <span className="uppercase text-[10px] sm:text-[11px] tracking-widest">
                  Total Liabilities
                </span>
                <span className="font-mono text-sm sm:text-base">
                  {formatCurrency(data.summary.total_liabilities)}
                </span>
              </div>
            </div>

            {/* 3. OWNER'S EQUITY */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-700 pb-2 mb-3 mt-8 print:text-black print:border-black">
                Owner's Equity
              </h3>
              <div className="pl-2 sm:pl-4 space-y-2">
                {renderAccountRows(data.equity)}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white print:text-black print:border-black">
                <span className="uppercase text-[10px] sm:text-[11px] tracking-widest">
                  Total Owner's Equity
                </span>
                <span
                  className={`font-mono text-sm sm:text-base ${data.summary.total_equity < 0 ? "text-red-500 dark:text-red-400" : ""}`}
                >
                  {formatCurrency(data.summary.total_equity)}
                </span>
              </div>
            </div>

            {/* 4. TOTAL LIABILITIES & EQUITY (Equation Verification) */}
            <div className="flex justify-between items-center mt-10 pt-4 pb-4 border-t-2 border-b-4 border-double border-slate-900 dark:border-white print:border-black">
              <span className="text-base sm:text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                Total Liabilities & Equity
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight print:text-black ${!data.summary.is_balanced ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}
              >
                {formatCurrency(
                  data.summary.total_liabilities + data.summary.total_equity,
                )}
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
              As Of Date
            </label>
            <select
              value={datePreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 mb-3 cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="this_month_end">This Month End</option>
              <option value="this_quarter_end">This Quarter End</option>
              <option value="this_year_end">This Year End</option>
              <option value="custom">Custom Point In Time</option>
            </select>

            {datePreset === "custom" && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                />
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
                  Suppresses inactive accounts with ₱0.00 activity from the
                  report.
                </span>
              </div>
            </label>
          </div>
        </div>
      </FilterModal>
    </div>
  );
};

export default BalanceSheet;
