import React, { useState, useEffect, useCallback, useId } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  TrendingDown,
  Calculator,
  Users,
  Store,
  Boxes,
  Loader2,
  RefreshCw,
  ShoppingCart,
  ReceiptText,
  ScanText,
  Scale,
  PackageX,
  AlertTriangle,
  FileText,
  Banknote,
  CreditCard,
  Building2,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

// Services
import { managerDashboardService } from "../../services/manager/dashboard.service";
import { inventoryService } from "../../services/manager/inventory.service";

// Shared Components
import PageHeader from "../../components/shared/PageHeader";
import FilterModal from "../../components/shared/FilterModal";
import DataTable from "../../components/shared/DataTable";

// UI Components
import FilterButton from "../../components/ui/FilterButton";
import ActionButton from "../../components/ui/ActionButton";
import StatCard from "../../components/ui/StatCard";
import StatusToggle from "../../components/ui/StatusToggle";
import StatusBadge from "../../components/ui/StatusBadge";

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

const Overview = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();

  // Accessible Filter IDs
  const branchSelectId = useId();
  const periodSelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();

  // State
  const [data, setData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [branchFilter, setBranchFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("this_month");
  const [startDate, setStartDate] = useState(
    () => getPresetDates("this_month").start,
  );
  const [endDate, setEndDate] = useState(
    () => getPresetDates("this_month").end,
  );
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) + (datePreset !== "this_month" ? 1 : 0);

  // Initial Load: Branches
  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch(() => console.error("Failed to fetch branches."));
  }, []);

  // Fetch Dashboard Data
  const loadOverviewData = useCallback(
    async (isManualRefresh = false) => {
      if (!startDate || !endDate) return;

      try {
        if (isManualRefresh) setIsRefreshing(true);
        else setLoading(true);

        const res = await managerDashboardService.getOverviewData({
          branch: branchFilter,
          start_date: startDate,
          end_date: endDate,
        });

        setData(res.data);
        if (isManualRefresh) showToast("Dashboard synchronized.", "success");
      } catch (error) {
        showToast(
          error.message || "Unable to compile executive dashboard.",
          "error",
        );
        if (!isManualRefresh) setData(null);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [branchFilter, startDate, endDate, showToast],
  );

  useEffect(() => {
    loadOverviewData(false);
  }, [loadOverviewData]);

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
    }
    if (field === "end") {
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
    setIsFilterModalOpen(false);
  };

  // --- Dynamic Deep Link Handoff Engine ---
  const handleDeepLink = (basePath, extraParams = {}) => {
    const params = new URLSearchParams();

    // Inject global dashboard scope
    if (branchFilter && branchFilter !== "all")
      params.append("branch", branchFilter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    // Inject alert-specific parameters
    Object.entries(extraParams).forEach(([key, value]) => {
      params.append(key, value);
    });

    navigate(`${basePath}?${params.toString()}`);
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    const formatted = Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return num < 0 ? `-₱${formatted}` : `₱${formatted}`;
  };

  const formatActivityDate = (dateString) => {
    if (!dateString) return { date: "--", time: "--" };
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { date: String(dateString), time: "" };
    return {
      date: d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getSourceBadge = (moduleStr) => {
    switch (moduleStr) {
      case "INVOICE":
        return <StatusBadge label="Invoice" variant="info" icon={FileText} />;
      case "PAYMENT":
        return (
          <StatusBadge label="Collection" variant="success" icon={Banknote} />
        );
      case "BILL":
        return (
          <StatusBadge
            label="Supplier Bill"
            variant="default"
            icon={Store}
            className="!text-purple-700 dark:!text-purple-400 !bg-purple-50 dark:!bg-purple-500/10 !border-purple-200 dark:!border-purple-500/20"
          />
        );
      case "VENDOR_PAYMENT":
        return (
          <StatusBadge
            label="Disbursement"
            variant="danger"
            icon={CreditCard}
          />
        );
      case "EXPENSE":
        return (
          <StatusBadge label="Expense" variant="default" icon={ReceiptText} />
        );
      case "OCR_RECEIPT":
        return (
          <StatusBadge label="OCR Receipt" variant="warning" icon={ScanText} />
        );
      default:
        return (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {moduleStr || "SYSTEM"}
          </span>
        );
    }
  };

  const getStatusVariant = (status) => {
    if (!status) return "default";
    const s = status.toUpperCase();
    if (["PAID", "COMPLETED", "APPROVED", "RECEIVED", "CLOSED"].includes(s))
      return "success";
    if (["UNPAID", "PARTIALLY_PAID", "PENDING"].includes(s)) return "warning";
    if (["OVERDUE", "VOID", "REJECTED", "CANCELLED"].includes(s))
      return "danger";
    return "default";
  };

  const hasAlerts =
    data &&
    (data.alerts?.approvals?.pending_pos > 0 ||
      data.alerts?.approvals?.pending_manual_expenses > 0 ||
      data.alerts?.approvals?.pending_ocr_receipts > 0 ||
      data.alerts?.approvals?.pending_stock_adjustments > 0 ||
      data.alerts?.inventory?.out_of_stock_count > 0 ||
      data.alerts?.inventory?.low_stock_count > 0 ||
      data.alerts?.financial?.overdue_invoices > 0 ||
      data.alerts?.financial?.overdue_bills > 0);

  const netOperatingMargin = parseFloat(data?.kpis?.net_operating_margin) || 0;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* PAGE HEADER */}
      <PageHeader
        title="Overview"
        subtitle="Business Performance & Operations"
        icon={LayoutDashboard}
      >
        <div className="hidden lg:block">
          <StatusToggle
            activeValue={datePreset}
            onToggle={handlePresetChange}
            ariaLabel="Select dashboard reporting period preset"
            options={DATE_PRESET_OPTIONS}
          />
        </div>

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <ActionButton
          label={isRefreshing ? "Syncing..." : "Refresh"}
          icon={RefreshCw}
          loading={isRefreshing}
          onClick={() => loadOverviewData(true)}
          disabled={loading || isRefreshing}
        />
      </PageHeader>

      {loading && !data ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center justify-center py-32 text-slate-400"
        >
          <Loader2
            aria-hidden="true"
            className="w-10 h-10 animate-spin mb-4 text-amber-500"
          />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Compiling Executive Dashboard...
          </p>
        </div>
      ) : !data ? (
        <div
          role="alert"
          className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/10 p-10 sm:p-16 text-center shadow-xs flex flex-col items-center justify-center"
        >
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-full text-amber-500 mb-4 border border-amber-200/60 dark:border-amber-500/20">
            <AlertTriangle size={28} aria-hidden="true" />
          </div>
          <h2 className="text-sm sm:text-base font-black uppercase tracking-widest text-slate-900 dark:text-white">
            Unable to Load Dashboard Data
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5 max-w-md leading-relaxed mb-6">
            We could not retrieve the latest metrics for the selected reporting
            period. Please verify your connection and try again.
          </p>
          <ActionButton
            label="Retry Connection"
            icon={RefreshCw}
            onClick={() => loadOverviewData(false)}
          />
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* ACTIONABLE ALERT CENTER */}
          {hasAlerts && (
            <section
              aria-label="Action Required Center"
              className="bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xs"
            >
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                <AlertTriangle
                  size={14}
                  aria-hidden="true"
                  className="text-amber-500 dark:text-overdrive-yellow"
                />
                <span>Action Required Center</span>
              </h2>
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Pending Approvals (Amber) */}
                {data.alerts.approvals.pending_pos > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink(
                        "/manager/approvals/purchase-order-approvals",
                      )
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100/80 dark:hover:bg-amber-500/20 transition-all active:scale-[0.98] text-left group cursor-pointer"
                  >
                    <ShoppingCart
                      size={20}
                      aria-hidden="true"
                      className="text-amber-600 dark:text-overdrive-yellow mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-amber-800 dark:text-amber-400">
                      {data.alerts.approvals.pending_pos}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-500 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Pending POs</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {data.alerts.approvals.pending_ocr_receipts > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/manager/approvals/receipt-approvals")
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100/80 dark:hover:bg-amber-500/20 transition-all active:scale-[0.98] text-left group cursor-pointer"
                  >
                    <ScanText
                      size={20}
                      aria-hidden="true"
                      className="text-amber-600 dark:text-overdrive-yellow mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-amber-800 dark:text-amber-400">
                      {data.alerts.approvals.pending_ocr_receipts}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-500 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">OCR Approvals</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {data.alerts.approvals.pending_manual_expenses > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/manager/approvals/expense-approvals")
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100/80 dark:hover:bg-amber-500/20 transition-all active:scale-[0.98] text-left group cursor-pointer"
                  >
                    <ReceiptText
                      size={20}
                      aria-hidden="true"
                      className="text-amber-600 dark:text-overdrive-yellow mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-amber-800 dark:text-amber-400">
                      {data.alerts.approvals.pending_manual_expenses}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-500 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Expense Approvals</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {data.alerts.approvals.pending_stock_adjustments > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/manager/inventory/stock-adjustments")
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100/80 dark:hover:bg-amber-500/20 transition-all active:scale-[0.98] text-left group cursor-pointer"
                  >
                    <Scale
                      size={20}
                      aria-hidden="true"
                      className="text-amber-600 dark:text-overdrive-yellow mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-amber-800 dark:text-amber-400">
                      {data.alerts.approvals.pending_stock_adjustments}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-500 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Stock Adjustments</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {/* Critical Liabilities & Shortages (Rose) */}
                {data.alerts.inventory.out_of_stock_count > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/manager/inventory/stock-management", {
                        stock_status: "out_of_stock",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100/80 dark:hover:bg-rose-500/20 transition-all active:scale-[0.98] text-left group cursor-pointer"
                  >
                    <PackageX
                      size={20}
                      aria-hidden="true"
                      className="text-rose-600 dark:text-rose-400 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-rose-800 dark:text-rose-400">
                      {data.alerts.inventory.out_of_stock_count}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:text-rose-500 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Out of Stock</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {data.alerts.inventory.low_stock_count > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/manager/inventory/stock-management", {
                        stock_status: "low_stock",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100/80 dark:hover:bg-rose-500/20 transition-all active:scale-[0.98] text-left group cursor-pointer"
                  >
                    <AlertTriangle
                      size={20}
                      aria-hidden="true"
                      className="text-rose-600 dark:text-rose-400 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-rose-800 dark:text-rose-400">
                      {data.alerts.inventory.low_stock_count}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:text-rose-500 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Low Stock</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {data.alerts.financial.overdue_invoices > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/manager/reports/receivables-reports", {
                        payment_status: "OVERDUE",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100/80 dark:hover:bg-rose-500/20 transition-all active:scale-[0.98] text-left group cursor-pointer"
                  >
                    <Users
                      size={20}
                      aria-hidden="true"
                      className="text-rose-600 dark:text-rose-400 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-rose-800 dark:text-rose-400">
                      {data.alerts.financial.overdue_invoices}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:text-rose-500 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Overdue A/R</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {data.alerts.financial.overdue_bills > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/manager/reports/payables-reports", {
                        payment_status: "OVERDUE",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100/80 dark:hover:bg-rose-500/20 transition-all active:scale-[0.98] text-left group cursor-pointer"
                  >
                    <Store
                      size={20}
                      aria-hidden="true"
                      className="text-rose-600 dark:text-rose-400 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-rose-800 dark:text-rose-400">
                      {data.alerts.financial.overdue_bills}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:text-rose-500 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Overdue A/P</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* KPI GRID */}
          <section
            aria-label="Key Performance Indicators"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            <button
              type="button"
              onClick={() => handleDeepLink("/manager/reports/sales-reports")}
              aria-label={`View Sales Reports: Net Sales Revenue ${formatCurrency(data.kpis.total_sales)}`}
              className="w-full text-left rounded-[20px] sm:rounded-[24px] cursor-pointer transition-transform active:scale-[0.98] hover:opacity-95"
            >
              <StatCard
                title="Net Sales Revenue"
                value={formatCurrency(data.kpis.total_sales)}
                icon={TrendingUp}
                variant="success"
              />
            </button>

            <button
              type="button"
              onClick={() => handleDeepLink("/manager/reports/expense-reports")}
              aria-label={`View Expense Reports: Operating Expenses ${formatCurrency(data.kpis.total_expenses)}`}
              className="w-full text-left rounded-[20px] sm:rounded-[24px] cursor-pointer transition-transform active:scale-[0.98] hover:opacity-95"
            >
              <StatCard
                title="Operating Expenses"
                value={formatCurrency(data.kpis.total_expenses)}
                icon={TrendingDown}
                variant="danger"
              />
            </button>

            <button
              type="button"
              onClick={() =>
                handleDeepLink("/manager/reports/income-statement")
              }
              aria-label={`View Income Statement: Net Operating Margin ${formatCurrency(netOperatingMargin)}`}
              className="w-full text-left rounded-[20px] sm:rounded-[24px] cursor-pointer transition-transform active:scale-[0.98] hover:opacity-95"
            >
              <StatCard
                title="Net Operating Margin"
                value={formatCurrency(netOperatingMargin)}
                icon={Calculator}
                variant={netOperatingMargin >= 0 ? "success" : "danger"}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                handleDeepLink("/manager/reports/receivables-reports")
              }
              aria-label={`View Receivables Reports: Accounts Receivable ${formatCurrency(data.kpis.total_ar)}`}
              className="w-full text-left rounded-[20px] sm:rounded-[24px] cursor-pointer transition-transform active:scale-[0.98] hover:opacity-95"
            >
              <StatCard
                title="Accounts Receivable"
                value={formatCurrency(data.kpis.total_ar)}
                icon={Users}
                variant="warning"
              />
            </button>

            <button
              type="button"
              onClick={() =>
                handleDeepLink("/manager/reports/payables-reports")
              }
              aria-label={`View Payables Reports: Accounts Payable ${formatCurrency(data.kpis.total_ap)}`}
              className="w-full text-left rounded-[20px] sm:rounded-[24px] cursor-pointer transition-transform active:scale-[0.98] hover:opacity-95"
            >
              <StatCard
                title="Accounts Payable"
                value={formatCurrency(data.kpis.total_ap)}
                icon={Store}
                variant="danger"
              />
            </button>

            <button
              type="button"
              onClick={() =>
                handleDeepLink("/manager/reports/inventory-reports")
              }
              aria-label={`View Inventory Reports: Inventory Asset Value ${formatCurrency(data.kpis.total_inventory_value)}`}
              className="w-full text-left rounded-[20px] sm:rounded-[24px] cursor-pointer transition-transform active:scale-[0.98] hover:opacity-95"
            >
              <StatCard
                title="Inventory Asset Value"
                value={formatCurrency(data.kpis.total_inventory_value)}
                icon={Boxes}
                variant="info"
              />
            </button>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* BRANCH PERFORMANCE DISTRIBUTION */}
            <section
              aria-label="Branch Performance Distribution"
              className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Building2
                    size={14}
                    aria-hidden="true"
                    className="text-amber-500 dark:text-overdrive-yellow"
                  />
                  <span>Branch Performance</span>
                </h2>
              </div>
              <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-5">
                {!data.distributions?.branch_performance ||
                data.distributions.branch_performance.length === 0 ? (
                  <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 py-8">
                    No branch data available.
                  </p>
                ) : (
                  data.distributions.branch_performance.map((branch) => {
                    const salesVal = parseFloat(branch.total_sales) || 0;
                    const expVal = parseFloat(branch.total_expenses) || 0;
                    const netMargin = parseFloat(branch.net_margin) || 0;
                    const maxMetric = Math.max(salesVal, expVal);
                    const salesWidth =
                      maxMetric > 0 ? (salesVal / maxMetric) * 100 : 0;
                    const expWidth =
                      maxMetric > 0 ? (expVal / maxMetric) * 100 : 0;

                    return (
                      <div
                        key={branch.branch_id}
                        className="space-y-3 pb-5 border-b border-slate-100 dark:border-slate-700/60 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between items-end gap-2">
                          <span
                            className="text-xs sm:text-sm font-black uppercase italic text-slate-900 dark:text-white truncate"
                            title={branch.branch_name}
                          >
                            {branch.branch_name}
                          </span>
                          <span
                            className={`font-mono tabular-nums text-xs font-black shrink-0 ${
                              netMargin >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {formatCurrency(netMargin)} Net
                          </span>
                        </div>
                        <div className="space-y-2">
                          {/* Revenue Bar */}
                          <div className="flex items-center gap-2.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 w-7 text-right shrink-0">
                              Rev
                            </span>
                            <div
                              aria-hidden="true"
                              className="flex-1 h-2 bg-slate-100 dark:bg-slate-700/80 rounded-full overflow-hidden"
                            >
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                style={{ width: `${salesWidth}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300 min-w-[88px] text-right shrink-0">
                              {formatCurrency(salesVal)}
                            </span>
                          </div>
                          {/* Expense Bar */}
                          <div className="flex items-center gap-2.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 w-7 text-right shrink-0">
                              Exp
                            </span>
                            <div
                              aria-hidden="true"
                              className="flex-1 h-2 bg-slate-100 dark:bg-slate-700/80 rounded-full overflow-hidden"
                            >
                              <div
                                className="h-full bg-rose-500 rounded-full transition-all duration-700"
                                style={{ width: `${expWidth}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300 min-w-[88px] text-right shrink-0">
                              {formatCurrency(expVal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* RECENT ACTIVITY STREAM */}
            <section
              aria-label="Recent Enterprise Activity"
              className="lg:col-span-2"
            >
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                <Calendar size={16} aria-hidden="true" />
                <span>Recent Enterprise Activity</span>
              </h2>
              <DataTable
                caption="Recent Enterprise Financial and Operational Activity"
                headers={[
                  "Date & Time",
                  "Module / Activity",
                  "Reference",
                  "Amount (₱)",
                  "Status",
                ]}
                data={data.recent_activities || []}
                loading={loading || isRefreshing}
                emptyTitle="No recent activity found"
                emptySubtitle="No transactions match the selected reporting period."
                minWidth="min-w-[700px]"
                renderRow={(activity, idx) => {
                  const isNegative = [
                    "VENDOR_PAYMENT",
                    "EXPENSE",
                    "OCR_RECEIPT",
                  ].includes(activity.module);
                  const { date, time } = formatActivityDate(
                    activity.activity_date,
                  );
                  const branchObj = branches.find(
                    (b) => Number(b.id) === Number(activity.branch_id),
                  );

                  return (
                    <tr
                      key={`${activity.module}-${activity.reference}-${idx}`}
                      className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <p className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                          {date}
                        </p>
                        <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-widest">
                          {time}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {getSourceBadge(activity.module)}
                        {branchFilter === "all" && (
                          <p
                            className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1.5 flex items-center gap-1 truncate max-w-[160px]"
                            title={branchObj?.branch_name || "Enterprise"}
                          >
                            <Building2
                              size={10}
                              aria-hidden="true"
                              className="shrink-0"
                            />
                            <span className="truncate">
                              {branchObj?.branch_name || "Enterprise"}
                            </span>
                          </p>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 font-mono tabular-nums tracking-widest uppercase">
                          {activity.reference}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                        <span
                          className={`text-xs sm:text-sm font-black font-mono tabular-nums ${
                            isNegative
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {isNegative ? "-" : ""}
                          {(parseFloat(activity.amount) || 0).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                        <StatusBadge
                          label={(activity.status || "PENDING").replace(
                            /_/g,
                            " ",
                          )}
                          variant={getStatusVariant(activity.status)}
                        />
                      </td>
                    </tr>
                  );
                }}
              />
            </section>
          </div>
        </div>
      )}

      {/* FILTER MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Dashboard Parameters"
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

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-4">
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
            </div>

            {datePreset === "custom" && (
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
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
        </div>
      </FilterModal>
    </div>
  );
};

export default Overview;
