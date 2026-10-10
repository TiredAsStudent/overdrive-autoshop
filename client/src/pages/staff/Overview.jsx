import React, { useState, useEffect } from "react";
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

const Overview = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const initialDates = getPresetDates("this_month");

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

  // Fetch Dashboard Data
  const loadOverviewData = async (isManualRefresh = false) => {
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
      showToast(error.message, "error");
      if (!isManualRefresh) setData(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverviewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

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
    setDatePreset("this_month");
    const { start, end } = getPresetDates("this_month");
    setStartDate(start);
    setEndDate(end);
    setIsFilterModalOpen(false);
  };

  // --- Dynamic Deep Link Handoff Engine ---
  const handleDeepLink = (basePath, extraParams = {}) => {
    const params = new URLSearchParams();

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
            className="!text-purple-600 dark:!text-purple-400 !bg-purple-50 dark:!bg-purple-500/10 !border-purple-200"
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
        return <span className="text-[9px] text-slate-400">{moduleStr}</span>;
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
    (data.action_alerts.pending_estimates > 0 ||
      data.action_alerts.pending_billings > 0 ||
      data.action_alerts.overdue_invoices > 0 ||
      data.action_alerts.pending_deliveries > 0 ||
      data.action_alerts.unverified_receipts > 0 ||
      data.action_alerts.pending_adjustments > 0 ||
      data.inventory_alerts.out_of_stock_count > 0 ||
      data.inventory_alerts.low_stock_count > 0);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
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

        <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0">
          <ActionButton
            label={isRefreshing ? "Syncing..." : "Refresh"}
            icon={isRefreshing ? Loader2 : RefreshCw}
            onClick={() => loadOverviewData(true)}
            disabled={loading || isRefreshing}
            className={isRefreshing ? "opacity-80 cursor-wait" : ""}
          />
        </div>
      </PageHeader>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-amber-500" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Compiling Operational Dashboard...
          </p>
        </div>
      ) : data ? (
        <div className="space-y-6 sm:space-y-8">
          {/* ACTIONABLE ALERT CENTER (WORKFLOW QUEUES) */}
          {hasAlerts && (
            <div className="bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" /> Action
                Required Queue
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Workflow Alerts */}
                {data.action_alerts.pending_estimates > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/staff/sales/estimates", {
                        status: "APPROVED",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors text-left group"
                  >
                    <FileText
                      size={20}
                      className="text-blue-600 dark:text-blue-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-blue-700 dark:text-blue-400">
                      {data.action_alerts.pending_estimates}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-500 mt-1 flex items-center justify-between w-full">
                      Approved Estimates{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                  </button>
                )}

                {data.action_alerts.pending_billings > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/staff/sales/sales-orders", {
                        status: "COMPLETED",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors text-left group"
                  >
                    <ClipboardList
                      size={20}
                      className="text-emerald-600 dark:text-emerald-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-emerald-700 dark:text-emerald-400">
                      {data.action_alerts.pending_billings}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mt-1 flex items-center justify-between w-full">
                      Pending Billings{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                  </button>
                )}

                {data.action_alerts.unverified_receipts > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/staff/receipts/receipt-scanner")
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors text-left group"
                  >
                    <ScanText
                      size={20}
                      className="text-amber-600 dark:text-amber-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400">
                      {data.action_alerts.unverified_receipts}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mt-1 flex items-center justify-between w-full">
                      Unverified OCR{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                  </button>
                )}

                {data.action_alerts.pending_deliveries > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/staff/purchases/purchase-orders", {
                        status: "APPROVED",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors text-left group"
                  >
                    <ShoppingCart
                      size={20}
                      className="text-amber-600 dark:text-amber-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400">
                      {data.action_alerts.pending_deliveries}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mt-1 flex items-center justify-between w-full">
                      Expected Deliveries{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                  </button>
                )}

                {/* Critical Alerts (Rose) */}
                {data.action_alerts.overdue_invoices > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/staff/sales/invoices", {
                        status: "OVERDUE",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors text-left group"
                  >
                    <AlertTriangle
                      size={20}
                      className="text-rose-600 dark:text-rose-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-rose-700 dark:text-rose-400">
                      {data.action_alerts.overdue_invoices}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-500 mt-1 flex items-center justify-between w-full">
                      Overdue Invoices{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                  </button>
                )}

                {data.inventory_alerts.out_of_stock_count > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/staff/inventory/stock-management", {
                        stock_status: "out_of_stock",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors text-left group"
                  >
                    <PackageX
                      size={20}
                      className="text-rose-600 dark:text-rose-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-rose-700 dark:text-rose-400">
                      {data.inventory_alerts.out_of_stock_count}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-500 mt-1 flex items-center justify-between w-full">
                      Out of Stock{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                  </button>
                )}

                {data.inventory_alerts.low_stock_count > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/staff/inventory/stock-management", {
                        stock_status: "low_stock",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors text-left group"
                  >
                    <AlertTriangle
                      size={20}
                      className="text-rose-600 dark:text-rose-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-rose-700 dark:text-rose-400">
                      {data.inventory_alerts.low_stock_count}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-500 mt-1 flex items-center justify-between w-full">
                      Low Stock{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                  </button>
                )}

                {data.action_alerts.pending_adjustments > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/staff/inventory/stock-adjustments", {
                        status: "PENDING",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors text-left group"
                  >
                    <Scale
                      size={20}
                      className="text-amber-600 dark:text-amber-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400">
                      {data.action_alerts.pending_adjustments}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mt-1 flex items-center justify-between w-full">
                      Pending Audits{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* KPI GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Sales Invoiced"
              value={formatCurrency(data.kpis.total_sales)}
              icon={TrendingUp}
              variant="success"
            />
            <StatCard
              title="Collections Received"
              value={formatCurrency(data.kpis.total_collections)}
              icon={Banknote}
              variant="info"
            />
            <StatCard
              title="Operational Expenses"
              value={formatCurrency(data.kpis.total_expenses)}
              icon={TrendingDown}
              variant="danger"
            />
            <StatCard
              title="Inventory Procurement"
              value={formatCurrency(data.kpis.total_procurement)}
              icon={Store}
              variant="warning"
            />
          </div>

          {/* RECENT ACTIVITY STREAM */}
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-500 mb-4 flex items-center gap-2">
              <Calendar size={16} /> Recent Branch Activity
            </h3>
            <DataTable
              headers={[
                "Date & Time",
                "Module / Activity",
                "Reference",
                "Amount (₱)",
                "Status",
              ]}
              data={data.recent_activity}
              loading={loading}
              emptyTitle="No recent activity found"
              emptySubtitle="No transactions match the selected reporting period."
              minWidth="min-w-[700px]"
              renderRow={(activity, idx) => {
                const isNegative = ["EXPENSE", "OCR_RECEIPT", "BILL"].includes(
                  activity.module,
                );
                return (
                  <tr
                    key={`${activity.module}-${activity.reference}-${idx}`}
                    className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {new Date(activity.activity_date).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </p>
                      <p className="text-[9px] font-medium text-slate-500 mt-1 uppercase tracking-widest">
                        {new Date(activity.activity_date).toLocaleTimeString(
                          undefined,
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {getSourceBadge(activity.module)}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono tracking-widest uppercase">
                        {activity.reference}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span
                        className={`text-sm font-black font-mono ${isNegative ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}
                      >
                        {isNegative ? "-" : ""}
                        {parseFloat(activity.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <StatusBadge
                        label={activity.status.replace(/_/g, " ")}
                        variant={getStatusVariant(activity.status)}
                      />
                    </td>
                  </tr>
                );
              }}
            />
          </div>
        </div>
      ) : null}

      {/* FILTER MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Dashboard Parameters"
      >
        <div className="space-y-5">
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
            <p className="text-[9px] text-slate-400 mt-2 font-medium">
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
