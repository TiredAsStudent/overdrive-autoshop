import React, { useState, useEffect } from "react";
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
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [branchFilter, setBranchFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("this_month");
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
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
  const loadOverviewData = async (isManualRefresh = false) => {
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
  }, [branchFilter, startDate, endDate]);

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
    (data.alerts.approvals.pending_pos > 0 ||
      data.alerts.approvals.pending_manual_expenses > 0 ||
      data.alerts.approvals.pending_ocr_receipts > 0 ||
      data.alerts.approvals.pending_stock_adjustments > 0 ||
      data.alerts.inventory.out_of_stock_count > 0 ||
      data.alerts.inventory.low_stock_count > 0 ||
      data.alerts.financial.overdue_invoices > 0 ||
      data.alerts.financial.overdue_bills > 0);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* PAGE HEADER */}
      <PageHeader
        title="Dashboard Overview"
        subtitle="Executive Business Intelligence & Operational Monitoring"
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
            label={isRefreshing ? "Syncing..." : "Refresh Data"}
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
            Compiling Executive Dashboard...
          </p>
        </div>
      ) : data ? (
        <div className="space-y-6 sm:space-y-8">
          {/* ACTIONABLE ALERT CENTER */}
          {hasAlerts && (
            <div className="bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" /> Action
                Required Center
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Pending Approvals (Amber) */}
                {data.alerts.approvals.pending_pos > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink(
                        "/manager/approvals/purchase-order-approvals",
                      )
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors text-left group"
                  >
                    <ShoppingCart
                      size={20}
                      className="text-amber-600 dark:text-amber-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400">
                      {data.alerts.approvals.pending_pos}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mt-1 flex items-center justify-between w-full">
                      Pending POs{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                  </button>
                )}
                {data.alerts.approvals.pending_ocr_receipts > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/manager/approvals/receipt-approvals")
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors text-left group"
                  >
                    <ScanText
                      size={20}
                      className="text-amber-600 dark:text-amber-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400">
                      {data.alerts.approvals.pending_ocr_receipts}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mt-1 flex items-center justify-between w-full">
                      OCR Approvals{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                  </button>
                )}
                {data.alerts.approvals.pending_manual_expenses > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/manager/approvals/expense-approvals")
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors text-left group"
                  >
                    <ReceiptText
                      size={20}
                      className="text-amber-600 dark:text-amber-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400">
                      {data.alerts.approvals.pending_manual_expenses}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mt-1 flex items-center justify-between w-full">
                      Expense Approvals{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                  </button>
                )}
                {data.alerts.approvals.pending_stock_adjustments > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/manager/inventory/stock-adjustments")
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors text-left group"
                  >
                    <Scale
                      size={20}
                      className="text-amber-600 dark:text-amber-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400">
                      {data.alerts.approvals.pending_stock_adjustments}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 mt-1 flex items-center justify-between w-full">
                      Stock Adjustments{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                  </button>
                )}

                {/* Critical Liabilities & Shortages (Rose) */}
                {data.alerts.inventory.out_of_stock_count > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/manager/inventory/stock-management", {
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
                      {data.alerts.inventory.out_of_stock_count}
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
                {data.alerts.inventory.low_stock_count > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/manager/inventory/stock-management", {
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
                      {data.alerts.inventory.low_stock_count}
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
                {data.alerts.financial.overdue_invoices > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/manager/reports/receivables-reports", {
                        payment_status: "OVERDUE",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors text-left group"
                  >
                    <Users
                      size={20}
                      className="text-rose-600 dark:text-rose-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-rose-700 dark:text-rose-400">
                      {data.alerts.financial.overdue_invoices}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-500 mt-1 flex items-center justify-between w-full">
                      Overdue A/R{" "}
                      <ArrowRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                  </button>
                )}
                {data.alerts.financial.overdue_bills > 0 && (
                  <button
                    onClick={() =>
                      handleDeepLink("/manager/reports/payables-reports", {
                        payment_status: "OVERDUE",
                      })
                    }
                    className="flex flex-col items-start p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors text-left group"
                  >
                    <Store
                      size={20}
                      className="text-rose-600 dark:text-rose-500 mb-2"
                    />
                    <span className="text-2xl font-black font-mono tracking-tight text-rose-700 dark:text-rose-400">
                      {data.alerts.financial.overdue_bills}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-500 mt-1 flex items-center justify-between w-full">
                      Overdue A/P{" "}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div
              onClick={() => handleDeepLink("/manager/reports/sales-reports")}
              className="cursor-pointer transition-transform active:scale-[0.98] hover:opacity-90"
            >
              <StatCard
                title="Net Sales Revenue"
                value={formatCurrency(data.kpis.total_sales)}
                icon={TrendingUp}
                variant="success"
              />
            </div>
            <div
              onClick={() => handleDeepLink("/manager/reports/expense-reports")}
              className="cursor-pointer transition-transform active:scale-[0.98] hover:opacity-90"
            >
              <StatCard
                title="Operating Expenses"
                value={formatCurrency(data.kpis.total_expenses)}
                icon={TrendingDown}
                variant="danger"
              />
            </div>
            <div
              onClick={() =>
                handleDeepLink("/manager/reports/income-statement")
              }
              className="cursor-pointer transition-transform active:scale-[0.98] hover:opacity-90"
            >
              <StatCard
                title="Net Operating Margin"
                value={formatCurrency(data.kpis.net_operating_margin)}
                icon={Calculator}
                variant={
                  data.kpis.net_operating_margin >= 0 ? "success" : "danger"
                }
              />
            </div>
            <div
              onClick={() =>
                handleDeepLink("/manager/reports/receivables-reports")
              }
              className="cursor-pointer transition-transform active:scale-[0.98] hover:opacity-90"
            >
              <StatCard
                title="Accounts Receivable"
                value={formatCurrency(data.kpis.total_ar)}
                icon={Users}
                variant="warning"
              />
            </div>
            <div
              onClick={() =>
                handleDeepLink("/manager/reports/payables-reports")
              }
              className="cursor-pointer transition-transform active:scale-[0.98] hover:opacity-90"
            >
              <StatCard
                title="Accounts Payable"
                value={formatCurrency(data.kpis.total_ap)}
                icon={Store}
                variant="danger"
              />
            </div>
            <div
              onClick={() =>
                handleDeepLink("/manager/reports/inventory-reports")
              }
              className="cursor-pointer transition-transform active:scale-[0.98] hover:opacity-90"
            >
              <StatCard
                title="Inventory Asset Value"
                value={formatCurrency(data.kpis.total_inventory_value)}
                icon={Boxes}
                variant="info"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* BRANCH PERFORMANCE DISTRIBUTION */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Building2 size={14} className="text-amber-500" /> Branch
                  Performance
                </h3>
              </div>
              <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-5">
                {data.distributions.branch_performance.length === 0 ? (
                  <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 py-8">
                    No branch data available.
                  </p>
                ) : (
                  data.distributions.branch_performance.map((branch) => {
                    // Safe calculation for percentages to prevent NaN or Infinity
                    const maxMetric = Math.max(
                      branch.total_sales,
                      branch.total_expenses,
                    );
                    const salesWidth =
                      maxMetric > 0
                        ? (branch.total_sales / maxMetric) * 100
                        : 0;
                    const expWidth =
                      maxMetric > 0
                        ? (branch.total_expenses / maxMetric) * 100
                        : 0;

                    return (
                      <div
                        key={branch.branch_id}
                        className="space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between items-end">
                          <span className="text-sm font-black uppercase text-slate-900 dark:text-white truncate pr-4">
                            {branch.branch_name}
                          </span>
                          <span
                            className={`font-mono text-xs font-black ${branch.net_margin >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                          >
                            {formatCurrency(branch.net_margin)} Net
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {/* Revenue Bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase text-slate-400 w-8 text-right">
                              Rev
                            </span>
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                style={{ width: `${salesWidth}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-mono text-slate-600 dark:text-slate-300 w-16 text-right">
                              {formatCurrency(branch.total_sales)}
                            </span>
                          </div>
                          {/* Expense Bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase text-slate-400 w-8 text-right">
                              Exp
                            </span>
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                                style={{ width: `${expWidth}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-mono text-slate-600 dark:text-slate-300 w-16 text-right">
                              {formatCurrency(branch.total_expenses)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RECENT ACTIVITY STREAM */}
            <div className="lg:col-span-2">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-500 mb-4 flex items-center gap-2">
                <Calendar size={16} /> Recent Enterprise Activity
              </h3>
              <DataTable
                headers={[
                  "Date & Time",
                  "Module / Activity",
                  "Reference",
                  "Amount (₱)",
                  "Status",
                ]}
                data={data.recent_activities}
                loading={loading}
                emptyTitle="No recent activity found"
                emptySubtitle="No transactions match the selected reporting period."
                minWidth="min-w-[700px]"
                renderRow={(activity, idx) => {
                  const isNegative = [
                    "VENDOR_PAYMENT",
                    "EXPENSE",
                    "OCR_RECEIPT",
                  ].includes(activity.module);
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
                        {branchFilter === "all" && (
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1 truncate max-w-[150px]">
                            <Building2 size={10} />{" "}
                            {branches.find((b) => b.id === activity.branch_id)
                              ?.branch_name || "Enterprise"}
                          </p>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono tracking-widest uppercase">
                          {activity.reference}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span
                          className={`text-sm font-black font-mono ${isNegative ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}
                        >
                          {isNegative ? "-" : ""}
                          {parseFloat(activity.amount).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
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

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
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
        </div>
      </FilterModal>
    </div>
  );
};

export default Overview;
