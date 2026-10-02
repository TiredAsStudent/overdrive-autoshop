import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  Calculator,
  Loader2,
  ArrowRight,
} from "lucide-react";

// Services
import { incomeStatementService } from "../../services/manager/incomeStatement.service";
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

const IncomeStatement = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();

  const initialDates = getPresetDates("this_month");

  // State
  const [data, setData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [branchFilter, setBranchFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("this_month");
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
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

  // Fetch Income Statement Data
  const loadIncomeStatement = async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      const res = await incomeStatementService.getIncomeStatement({
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
    loadIncomeStatement();
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

  // --- GENERAL LEDGER DRILL-DOWN ---
  const handleDrillDown = (accountId) => {
    const params = new URLSearchParams();
    params.append("accountId", accountId);

    if (branchFilter && branchFilter !== "all") {
      params.append("branch", branchFilter);
    }
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    navigate(`/manager/accounting/general-ledger?${params.toString()}`);
  };

  const renderAccountRows = (accounts) => {
    if (!accounts || accounts.length === 0) {
      return (
        <div className="flex justify-between py-2 text-sm">
          <span className="text-slate-400 italic">No transactions</span>
          <span className="text-slate-400 font-mono">₱0.00</span>
        </div>
      );
    }

    return accounts.map((acc) => (
      <div
        key={acc.id}
        onClick={() => handleDrillDown(acc.id)}
        className="flex justify-between items-center py-2.5 px-2 -mx-2 text-sm hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer rounded-lg border-b border-dashed border-slate-100 dark:border-slate-800 last:border-0 group print:border-none print:px-0 print:mx-0 print:cursor-auto"
        title="Click to view detailed General Ledger for this account"
      >
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 print:text-black print:group-hover:text-black transition-colors">
          <span>{acc.account_name}</span>
          <ArrowRight
            size={14}
            className="opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
          />
        </div>
        <span className="font-mono text-slate-900 dark:text-white print:text-black">
          {formatCurrency(acc.net_balance)}
        </span>
      </div>
    ));
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* PAGE HEADER & CONTROLS */}
      <PageHeader
        title="Income Statement"
        subtitle="Profit & Loss Financial Performance Report"
        icon={FileText}
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
            label="Print"
            icon={Printer}
            onClick={() => window.print()}
            className="!bg-slate-100 dark:!bg-slate-800 !text-slate-700 dark:!text-slate-300 hover:!bg-slate-200 dark:hover:!bg-slate-700 shadow-none border border-slate-200 dark:border-slate-700"
          />
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
            title="Total Revenue"
            value={formatCurrency(data.summary.total_revenue)}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Cost of Goods Sold"
            value={formatCurrency(data.summary.total_cogs)}
            icon={Calculator}
            variant="warning"
          />
          <StatCard
            title="Operating Expenses"
            value={formatCurrency(data.summary.total_opex)}
            icon={TrendingDown}
            variant="danger"
          />
          <StatCard
            title="Net Profit / Loss"
            value={formatCurrency(data.summary.net_profit)}
            icon={FileText}
            variant={data.summary.net_profit >= 0 ? "success" : "danger"}
          />
        </div>
      )}

      {/* FINANCIAL STATEMENT (Printable Document Area) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[24px] sm:rounded-[32px] shadow-sm overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Print & Document Header */}
        <div className="p-6 sm:p-8 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-800/50 text-center bg-slate-50 dark:bg-slate-900/50 print:bg-transparent print:border-b-2 print:border-slate-900">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
            Income Statement
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
              Calculating Financials...
            </p>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center print:hidden w-full max-w-[250px] sm:max-w-none mx-auto">
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-3">
              <FileText
                size={28}
                className="opacity-40 sm:w-8 sm:h-8 w-6 h-6 text-slate-400"
              />
            </div>
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-normal">
              No Financial Data Available
            </p>
            <p className="text-[10px] sm:text-xs font-medium mt-1.5 opacity-70 text-slate-400 whitespace-normal">
              No transactions found for the selected reporting period.
            </p>
          </div>
        ) : (
          <div className="p-6 sm:p-10 lg:px-16 max-w-4xl mx-auto space-y-8 print:p-0 print:pt-6">
            {/* 1. OPERATING REVENUE */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-700 pb-2 mb-3 print:text-black print:border-black">
                Operating Revenue
              </h3>
              <div className="pl-2 sm:pl-4">
                {renderAccountRows(data.operating_revenue)}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white print:text-black print:border-black">
                <span className="uppercase text-[10px] sm:text-[11px] tracking-widest">
                  Total Operating Revenue
                </span>
                <span className="font-mono text-sm sm:text-base">
                  {formatCurrency(data.summary.total_revenue)}
                </span>
              </div>
            </div>

            {/* 2. COST OF GOODS SOLD */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-700 pb-2 mb-3 mt-8 print:text-black print:border-black">
                Cost of Goods Sold
              </h3>
              <div className="pl-2 sm:pl-4">
                {renderAccountRows(data.cost_of_goods_sold)}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white print:text-black print:border-black">
                <span className="uppercase text-[10px] sm:text-[11px] tracking-widest">
                  Total Cost of Goods Sold
                </span>
                <span className="font-mono text-sm sm:text-base">
                  {formatCurrency(data.summary.total_cogs)}
                </span>
              </div>
            </div>

            {/* 3. GROSS PROFIT (Subtotal) */}
            <div className="flex justify-between items-center py-4 px-4 sm:px-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 print:bg-transparent print:border-none print:px-0 print:border-t-2 print:border-b-2 print:border-black print:rounded-none">
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                Gross Profit
              </span>
              <span
                className={`text-lg sm:text-xl font-black font-mono tracking-tight print:text-black ${data.summary.gross_profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
              >
                {formatCurrency(data.summary.gross_profit)}
              </span>
            </div>

            {/* 4. OPERATING EXPENSES */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-700 pb-2 mb-3 mt-8 print:text-black print:border-black">
                Operating Expenses
              </h3>
              <div className="pl-2 sm:pl-4">
                {renderAccountRows(data.operating_expenses)}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white print:text-black print:border-black">
                <span className="uppercase text-[10px] sm:text-[11px] tracking-widest">
                  Total Operating Expenses
                </span>
                <span className="font-mono text-sm sm:text-base">
                  {formatCurrency(data.summary.total_opex)}
                </span>
              </div>
            </div>

            {/* 5. NET PROFIT (Grand Total) */}
            <div className="flex justify-between items-center mt-10 pt-4 pb-4 border-t-2 border-b-4 border-double border-slate-900 dark:border-white print:border-black">
              <span className="text-base sm:text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                Net Operating Profit / (Loss)
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight print:text-black ${data.summary.net_profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
              >
                {formatCurrency(data.summary.net_profit)}
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
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
              <Building2 size={12} /> Branch Scope
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
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
              <Calendar size={12} /> Reporting Period
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

export default IncomeStatement;
