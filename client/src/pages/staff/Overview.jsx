import React, { useState, useEffect, useCallback, useId } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  TrendingDown,
  Store,
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
  ArrowRight,
  ClipboardList,
  ChevronDown,
} from "lucide-react";

// Services
import { staffDashboardService } from "../../services/staff/dashboard.service";

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

// --- Date Utility Helpers ---
const getPresetDates = (preset) => {
  const today = new Date();
  let start, end;

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
  const initialDates = getPresetDates("this_month");

  // Accessible IDs for Filter Modal Controls
  const periodSelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();

  // State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [datePreset, setDatePreset] = useState("this_month");
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const activeFilterCount = datePreset !== "this_month" ? 1 : 0;
  const hasInvertedDates = Boolean(
    startDate && endDate && new Date(startDate) > new Date(endDate),
  );

  // Fetch Dashboard Data
  const loadOverviewData = useCallback(
    async (isManualRefresh = false) => {
      if (!startDate || !endDate) return;

      if (new Date(startDate) > new Date(endDate)) {
        showToast("Start date cannot be after end date.", "warning");
        return;
      }

      try {
        if (isManualRefresh) setIsRefreshing(true);
        else setLoading(true);

        const res = await staffDashboardService.getOverviewData({
          start_date: startDate,
          end_date: endDate,
        });

        setData(res.data);
        if (isManualRefresh) showToast("Dashboard synchronized.", "success");
      } catch (error) {
        showToast(
          error.message || "Unable to load operational dashboard.",
          "error",
        );
        if (!isManualRefresh) setData(null);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [startDate, endDate, showToast],
  );

  useEffect(() => {
    loadOverviewData(false);
  }, [loadOverviewData]);

  const handlePresetChange = (val) => {
    setDatePreset(val);
    if (val !== "custom") {
      const presetRange = getPresetDates(val);
      if (presetRange) {
        setStartDate(presetRange.start);
        setEndDate(presetRange.end);
      }
    }
  };

  const handleCustomDateChange = (field, value) => {
    setDatePreset("custom");
    if (field === "start") setStartDate(value);
    if (field === "end") setEndDate(value);
  };

  const resetFilters = () => {
    setDatePreset("this_month");
    const { start, end } = getPresetDates("this_month");
    setStartDate(start);
    setEndDate(end);
    setIsFilterModalOpen(false);
  };

  // --- Dynamic Deep Link Handoff Engine ---
  const handleDeepLink = (basePath, extraParams = {}) => {
    const params = new URLSearchParams();

    Object.entries(extraParams).forEach(([key, value]) => {
      params.append(key, value);
    });

    const queryString = params.toString();
    navigate(queryString ? `${basePath}?${queryString}` : basePath);
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    const formatted = Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return num < 0 ? `-₱${formatted}` : `₱${formatted}`;
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
          <StatusBadge label={moduleStr || "Activity"} variant="default" />
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

  const actionAlerts = data?.action_alerts || {};
  const inventoryAlerts = data?.inventory_alerts || {};
  const kpis = data?.kpis || {};
  const recentActivity = Array.isArray(data?.recent_activity)
    ? data.recent_activity
    : [];

  const hasAlerts =
    Boolean(data) &&
    (actionAlerts.pending_estimates > 0 ||
      actionAlerts.pending_billings > 0 ||
      actionAlerts.overdue_invoices > 0 ||
      actionAlerts.pending_deliveries > 0 ||
      actionAlerts.unverified_receipts > 0 ||
      actionAlerts.pending_adjustments > 0 ||
      inventoryAlerts.out_of_stock_count > 0 ||
      inventoryAlerts.low_stock_count > 0);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* PAGE HEADER */}
      <PageHeader
        title="Overview"
        subtitle="Local Operations & Accounting Metrics"
        icon={LayoutDashboard}
      >
        <div className="hidden lg:block">
          <StatusToggle
            activeValue={datePreset}
            onToggle={handlePresetChange}
            ariaLabel="Select dashboard reporting period"
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
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 animate-pulse">
            Compiling Operational Dashboard...
          </p>
        </div>
      ) : data ? (
        <div className="space-y-6 sm:space-y-8">
          {/* ACTIONABLE ALERT CENTER (WORKFLOW QUEUES) */}
          {hasAlerts && (
            <section
              aria-labelledby="action-queue-heading"
              className="bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xs"
            >
              <h2
                id="action-queue-heading"
                className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2"
              >
                <AlertTriangle
                  size={14}
                  aria-hidden="true"
                  className="text-amber-500 dark:text-overdrive-yellow"
                />
                <span>Action Required Queue</span>
              </h2>

              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Workflow Alerts */}
                {actionAlerts.pending_estimates > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/staff/sales/estimates", {
                        status: "APPROVED",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-blue-50/90 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100/80 dark:hover:bg-blue-500/20 transition-all active:scale-[0.99] text-left group cursor-pointer"
                  >
                    <FileText
                      size={20}
                      aria-hidden="true"
                      className="text-blue-600 dark:text-blue-400 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-blue-800 dark:text-blue-400">
                      {actionAlerts.pending_estimates}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Approved Estimates</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {actionAlerts.pending_billings > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/staff/sales/sales-orders", {
                        status: "COMPLETED",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/20 transition-all active:scale-[0.99] text-left group cursor-pointer"
                  >
                    <ClipboardList
                      size={20}
                      aria-hidden="true"
                      className="text-emerald-600 dark:text-emerald-400 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-emerald-800 dark:text-emerald-400">
                      {actionAlerts.pending_billings}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Pending Billings</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {actionAlerts.unverified_receipts > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/staff/receipts/receipt-scanner")
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100/80 dark:hover:bg-amber-500/20 transition-all active:scale-[0.99] text-left group cursor-pointer"
                  >
                    <ScanText
                      size={20}
                      aria-hidden="true"
                      className="text-amber-600 dark:text-amber-400 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-amber-800 dark:text-amber-400">
                      {actionAlerts.unverified_receipts}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Unverified OCR</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {actionAlerts.pending_deliveries > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/staff/purchases/purchase-orders", {
                        status: "APPROVED",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100/80 dark:hover:bg-amber-500/20 transition-all active:scale-[0.99] text-left group cursor-pointer"
                  >
                    <ShoppingCart
                      size={20}
                      aria-hidden="true"
                      className="text-amber-600 dark:text-amber-400 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-amber-800 dark:text-amber-400">
                      {actionAlerts.pending_deliveries}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Expected Deliveries</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {/* Critical Alerts (Rose) */}
                {actionAlerts.overdue_invoices > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/staff/sales/invoices", {
                        status: "OVERDUE",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100/80 dark:hover:bg-rose-500/20 transition-all active:scale-[0.99] text-left group cursor-pointer"
                  >
                    <AlertTriangle
                      size={20}
                      aria-hidden="true"
                      className="text-rose-600 dark:text-rose-400 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-rose-800 dark:text-rose-400">
                      {actionAlerts.overdue_invoices}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Overdue Invoices</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {inventoryAlerts.out_of_stock_count > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/staff/inventory/stock-management", {
                        stock_status: "out_of_stock",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100/80 dark:hover:bg-rose-500/20 transition-all active:scale-[0.99] text-left group cursor-pointer"
                  >
                    <PackageX
                      size={20}
                      aria-hidden="true"
                      className="text-rose-600 dark:text-rose-400 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-rose-800 dark:text-rose-400">
                      {inventoryAlerts.out_of_stock_count}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Out of Stock</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {inventoryAlerts.low_stock_count > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/staff/inventory/stock-management", {
                        stock_status: "low_stock",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100/80 dark:hover:bg-rose-500/20 transition-all active:scale-[0.99] text-left group cursor-pointer"
                  >
                    <AlertTriangle
                      size={20}
                      aria-hidden="true"
                      className="text-rose-600 dark:text-rose-400 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-rose-800 dark:text-rose-400">
                      {inventoryAlerts.low_stock_count}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Low Stock</span>
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0"
                      />
                    </span>
                  </button>
                )}

                {actionAlerts.pending_adjustments > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeepLink("/staff/inventory/stock-adjustments", {
                        status: "PENDING",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100/80 dark:hover:bg-amber-500/20 transition-all active:scale-[0.99] text-left group cursor-pointer"
                  >
                    <Scale
                      size={20}
                      aria-hidden="true"
                      className="text-amber-600 dark:text-amber-400 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-amber-800 dark:text-amber-400">
                      {actionAlerts.pending_adjustments}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mt-1 flex items-center justify-between w-full gap-2">
                      <span className="truncate">Pending Audits</span>
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
            aria-label="Branch Financial Summary Metrics"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
          >
            <StatCard
              title="Sales Invoiced"
              value={formatCurrency(kpis.total_sales)}
              icon={TrendingUp}
              variant="success"
            />
            <StatCard
              title="Collections Received"
              value={formatCurrency(kpis.total_collections)}
              icon={Banknote}
              variant="info"
            />
            <StatCard
              title="Operational Expenses"
              value={formatCurrency(kpis.total_expenses)}
              icon={TrendingDown}
              variant="danger"
            />
            <StatCard
              title="Inventory Procurement"
              value={formatCurrency(kpis.total_procurement)}
              icon={Store}
              variant="warning"
            />
          </section>

          {/* RECENT ACTIVITY STREAM */}
          <section aria-labelledby="recent-branch-activity-heading">
            <div className="mb-3 flex items-center gap-2 pl-1">
              <Calendar
                size={16}
                aria-hidden="true"
                className="text-amber-600 dark:text-overdrive-yellow shrink-0"
              />
              <h2
                id="recent-branch-activity-heading"
                className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 truncate"
              >
                Recent Branch Activity
              </h2>
            </div>

            <DataTable
              caption="Recent Branch Activity Transactions"
              headers={[
                "Date & Time",
                "Module / Activity",
                "Reference",
                "Amount (₱)",
                "Status",
              ]}
              data={recentActivity}
              loading={loading || isRefreshing}
              emptyTitle="No recent activity found"
              emptySubtitle="No transactions match the selected reporting period."
              minWidth="min-w-[720px]"
              renderRow={(activity, idx) => {
                const isNegative = ["EXPENSE", "OCR_RECEIPT", "BILL"].includes(
                  activity.module,
                );
                const activityDate = activity.activity_date
                  ? new Date(activity.activity_date)
                  : null;

                return (
                  <tr
                    key={`${activity.module}-${activity.reference}-${idx}`}
                    className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
                  >
                    <td className="px-4 sm:px-6 lg:px-8 py-4 whitespace-nowrap">
                      <p className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {activityDate
                          ? activityDate.toLocaleDateString(undefined, {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                            })
                          : "N/A"}
                      </p>
                      <p className="text-[10px] font-mono tabular-nums font-medium text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-widest">
                        {activityDate
                          ? activityDate.toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </p>
                    </td>

                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {getSourceBadge(activity.module)}
                    </td>

                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono tabular-nums tracking-widest uppercase truncate block max-w-[180px]"
                        title={activity.reference}
                      >
                        {activity.reference}
                      </span>
                    </td>

                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
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

                    <td className="px-4 sm:px-6 lg:px-8 py-4 text-right whitespace-nowrap">
                      <StatusBadge
                        label={
                          activity.status
                            ? activity.status.replace(/_/g, " ")
                            : "RECORDED"
                        }
                        variant={getStatusVariant(activity.status)}
                      />
                    </td>
                  </tr>
                );
              }}
            />
          </section>
        </div>
      ) : (
        <div
          role="alert"
          className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 p-10 sm:p-14 text-center flex flex-col items-center justify-center shadow-xs"
        >
          <div className="p-4 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-4 border border-rose-200/60 dark:border-rose-500/20">
            <AlertTriangle size={28} aria-hidden="true" />
          </div>
          <h2 className="text-sm sm:text-base font-black uppercase tracking-widest text-slate-900 dark:text-white">
            Unable to Load Dashboard Data
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5 max-w-md">
            We could not synchronize your branch operational metrics. Please
            verify your connection and try refreshing.
          </p>
          <div className="mt-6">
            <ActionButton
              label="Retry Synchronization"
              icon={RefreshCw}
              onClick={() => loadOverviewData(false)}
            />
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
            <label htmlFor={periodSelectId} className="form-label">
              Reporting Period
            </label>
            <div className="relative mb-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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

            {hasInvertedDates && (
              <p
                role="alert"
                className="text-[10px] text-red-600 dark:text-red-400 font-bold tracking-wider uppercase text-center mt-3"
              >
                Start Date cannot be later than End Date.
              </p>
            )}

            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 font-medium leading-relaxed">
              * Note: The date range only affects the KPIs and Recent Activity
              feed. Action alerts reflect your real-time workflow queues.
            </p>
          </div>
        </div>
      </FilterModal>
    </div>
  );
};

export default Overview;
