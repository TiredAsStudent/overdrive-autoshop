import React, { useState, useEffect, useCallback, useId } from "react";
import {
  TrendingUp,
  Download,
  Calendar,
  PieChart,
  List,
  Eye,
  Loader2,
  Building2,
  Calculator,
  Wrench,
  Package,
  Users,
  CreditCard,
  Printer,
  ChevronDown,
} from "lucide-react";

// Services
import { salesReportService } from "../../services/manager/salesReport.service";
import { inventoryService } from "../../services/manager/inventory.service";

// Shared Components
import PageHeader from "../../components/shared/PageHeader";
import FilterModal from "../../components/shared/FilterModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";

// UI Components
import SearchBar from "../../components/ui/SearchBar";
import FilterButton from "../../components/ui/FilterButton";
import ActionButton from "../../components/ui/ActionButton";
import StatCard from "../../components/ui/StatCard";
import StatusToggle from "../../components/ui/StatusToggle";
import StatusBadge from "../../components/ui/StatusBadge";

// Drill-Down Drawer
import GeneralLedgerSourceDrawer from "../../features/manager/components/GeneralLedgerSourceDrawer";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const DATE_PRESET_OPTIONS = [
  { label: "This Month", value: "this_month" },
  { label: "This Quarter", value: "this_quarter" },
  { label: "This Year", value: "this_year" },
];

const ITEMS_PER_PAGE = 10;

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

const SalesReports = () => {
  const { showToast } = useApp();

  // Accessible Filter Modal Control IDs
  const branchSelectId = useId();
  const paymentStatusSelectId = useId();
  const periodSelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();

  const initialDates = getPresetDates("this_month");

  // Report State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lookups
  const [branches, setBranches] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [datePreset, setDatePreset] = useState("this_month");
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [branchFilter, setBranchFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // View States
  const [selectedSource, setSelectedSource] = useState(null);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) +
    (paymentStatusFilter !== "all" ? 1 : 0) +
    (datePreset !== "this_month" ? 1 : 0);

  // Initial Load: Branches
  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch((err) => console.error("Failed to fetch branches", err));
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handlePresetChange = (val) => {
    setDatePreset(val);
    if (val !== "custom") {
      const presetDates = getPresetDates(val);
      if (presetDates) {
        setStartDate(presetDates.start);
        setEndDate(presetDates.end);
      }
    }
    if (currentPage !== 1) setCurrentPage(1);
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
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleFilterSelectChange = (setter) => (e) => {
    setter(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const resetFilters = () => {
    setBranchFilter("all");
    setPaymentStatusFilter("all");
    setDatePreset("this_month");
    const { start, end } = getPresetDates("this_month");
    setStartDate(start);
    setEndDate(end);
    if (currentPage !== 1) setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  // Load Report Data
  const loadReport = useCallback(async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      const res = await salesReportService.getSalesReport(
        currentPage,
        ITEMS_PER_PAGE,
        {
          search: debouncedSearchQuery,
          branch: branchFilter,
          payment_status: paymentStatusFilter,
          start_date: startDate,
          end_date: endDate,
        },
      );

      const fetchedTransactions = res.data?.transactions || [];
      const fetchedTotalPages = res.data?.pagination?.totalPages || 1;

      if (fetchedTransactions.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setData(res.data);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(error.message || "Unable to load Sales Reports data.", "error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    branchFilter,
    paymentStatusFilter,
    startDate,
    endDate,
    showToast,
  ]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getStatusVariant = (status) => {
    if (status === "PAID") return "success";
    if (status === "UNPAID" || status === "PARTIALLY_PAID") return "warning";
    if (status === "OVERDUE") return "danger";
    return "default";
  };

  // Helper to render horizontal progress bars for distributions
  const renderProgressBar = (value, total, colorClass, label) => {
    const numericValue = parseFloat(value) || 0;
    const numericTotal = parseFloat(total) || 0;
    const percentage =
      numericTotal > 0
        ? Math.min(100, Math.max(0, (numericValue / numericTotal) * 100))
        : 0;

    return (
      <div
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden print:hidden mt-2"
      >
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* PAGE HEADER & CONTROLS */}
      <PageHeader
        title="Sales Reports"
        subtitle="Revenue Operations & Liquidation Analytics"
        icon={TrendingUp}
      >
        <div className="hidden lg:block">
          <StatusToggle
            activeValue={datePreset}
            onToggle={handlePresetChange}
            ariaLabel="Select sales report period preset"
            options={DATE_PRESET_OPTIONS}
          />
        </div>

        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Invoice or Customer..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <ActionButton
          label="Export"
          icon={Download}
          onClick={() =>
            showToast("CSV/Excel export queued for reporting phase.", "info")
          }
          disabled={!data || loading}
        />
      </PageHeader>

      {/* EXECUTIVE KPI DASHBOARD (Hidden in Print) */}
      {data?.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:hidden">
          <StatCard
            title="Total Net Sales Revenue"
            value={`₱${formatCurrency(data.kpis.total_sales_revenue)}`}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title={`Service Revenue (${data.kpis.service_revenue?.percentage ?? 0}%)`}
            value={`₱${formatCurrency(data.kpis.service_revenue?.amount)}`}
            icon={Wrench}
            variant="info"
          />
          <StatCard
            title={`Parts Revenue (${data.kpis.parts_revenue?.percentage ?? 0}%)`}
            value={`₱${formatCurrency(data.kpis.parts_revenue?.amount)}`}
            icon={Package}
            variant="warning"
          />
          <StatCard
            title={`Average Sales Value (${data.kpis.total_invoices ?? 0} Txns)`}
            value={`₱${formatCurrency(data.kpis.average_sales_value)}`}
            icon={Calculator}
            variant="default"
          />
        </div>
      )}

      {/* DOCUMENT BODY */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-[32px] shadow-xs overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Print & Document Header */}
        <div className="relative p-6 sm:p-8 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-700/50 text-center bg-slate-50/70 dark:bg-slate-900/50 print:bg-transparent print:border-b-2 print:border-slate-900">
          <div className="absolute right-8 top-8 hidden print:block">
            <Printer size={24} aria-hidden="true" className="text-slate-900" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
            Sales Performance Report
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

        <div className="p-6 sm:p-8 lg:px-12 print:px-0">
          {/* ANALYTICAL DISTRIBUTIONS */}
          <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Sales by Branch */}
            <section>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-6 flex items-center gap-2 print:text-black">
                <Building2 size={16} aria-hidden="true" />
                <span>Sales by Branch</span>
              </h3>
              {loading ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex justify-center py-6"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-6 h-6 animate-spin text-emerald-500"
                  />
                </div>
              ) : !Array.isArray(data?.distributions?.by_branch) ||
                data.distributions.by_branch.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                  No branch data.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.distributions.by_branch.map((b) => (
                    <div key={b.branch_id}>
                      <div className="flex justify-between items-end gap-4">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase print:text-black truncate"
                            title={b.branch_name}
                          >
                            {b.branch_name}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mt-0.5 tracking-widest uppercase">
                            {b.transaction_count} Invoices
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black shrink-0">
                          ₱{formatCurrency(b.net_revenue)}
                        </span>
                      </div>
                      {renderProgressBar(
                        b.net_revenue,
                        data.kpis?.total_sales_revenue,
                        "bg-emerald-500",
                        `${b.branch_name} revenue share`,
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 2. Sales by Service Category */}
            <section>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-6 flex items-center gap-2 print:text-black">
                <PieChart size={16} aria-hidden="true" />
                <span>Labor by Service Category</span>
              </h3>
              {loading ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex justify-center py-6"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-6 h-6 animate-spin text-blue-500"
                  />
                </div>
              ) : !Array.isArray(data?.distributions?.by_service_category) ||
                data.distributions.by_service_category.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                  No service data.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.distributions.by_service_category.map((s, idx) => (
                    <div key={`${s.service_category}-${idx}`}>
                      <div className="flex justify-between items-end gap-4">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase print:text-black truncate"
                            title={s.service_category}
                          >
                            {s.service_category}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mt-0.5 tracking-widest uppercase">
                            {s.transaction_count} Rendered
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black shrink-0">
                          ₱{formatCurrency(s.net_revenue)}
                        </span>
                      </div>
                      {renderProgressBar(
                        s.net_revenue,
                        data.kpis?.service_revenue?.amount,
                        "bg-blue-500",
                        `${s.service_category} service revenue share`,
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 3. Sales by Parts Category */}
            <section>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-6 flex items-center gap-2 print:text-black mt-2 lg:mt-0">
                <Package size={16} aria-hidden="true" />
                <span>Parts Sales by Category</span>
              </h3>
              {loading ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex justify-center py-6"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-6 h-6 animate-spin text-amber-500"
                  />
                </div>
              ) : !Array.isArray(data?.distributions?.by_parts_category) ||
                data.distributions.by_parts_category.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                  No parts data.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.distributions.by_parts_category.map((p, idx) => (
                    <div key={`${p.part_category}-${idx}`}>
                      <div className="flex justify-between items-end gap-4">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase print:text-black truncate"
                            title={p.part_category}
                          >
                            {p.part_category}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mt-0.5 tracking-widest uppercase">
                            {p.transaction_count} Sold
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black shrink-0">
                          ₱{formatCurrency(p.net_revenue)}
                        </span>
                      </div>
                      {renderProgressBar(
                        p.net_revenue,
                        data.kpis?.parts_revenue?.amount,
                        "bg-amber-500",
                        `${p.part_category} parts revenue share`,
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 4. Top Customers */}
            <section>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-6 flex items-center gap-2 print:text-black mt-2 lg:mt-0">
                <Users size={16} aria-hidden="true" />
                <span>Top 10 Customers</span>
              </h3>
              {loading ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex justify-center py-6"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-6 h-6 animate-spin text-emerald-500"
                  />
                </div>
              ) : !Array.isArray(data?.distributions?.top_customers) ||
                data.distributions.top_customers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                  No customer data.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.distributions.top_customers.map((c, idx) => (
                    <div
                      key={c.customer_id || `${c.customer_name}-${idx}`}
                      className="flex justify-between items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-[10px] font-mono tabular-nums font-black text-emerald-600 dark:text-emerald-400 w-5 shrink-0">
                          {idx + 1}.
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span
                            className="text-xs font-black text-slate-900 dark:text-white uppercase truncate print:text-black"
                            title={c.customer_name}
                          >
                            {c.customer_name}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                            {c.transaction_count} Purchases
                          </span>
                        </div>
                      </div>
                      <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black shrink-0">
                        ₱{formatCurrency(c.net_revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 5. Payment Liquidation Status */}
            <section>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-6 flex items-center gap-2 print:text-black mt-2 lg:mt-0">
                <CreditCard size={16} aria-hidden="true" />
                <span>A/R & Payment Liquidation</span>
              </h3>
              {loading ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex justify-center py-6"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-6 h-6 animate-spin text-purple-500"
                  />
                </div>
              ) : !Array.isArray(data?.distributions?.payment_status) ||
                data.distributions.payment_status.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                  No payment data.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.distributions.payment_status.map((p, idx) => {
                    const isOverdue = p.status === "OVERDUE";
                    const isPaid = p.status === "PAID";
                    return (
                      <div
                        key={p.status || idx}
                        className={`flex justify-between items-center gap-4 p-3 sm:p-4 rounded-xl border ${
                          isOverdue
                            ? "bg-red-50 dark:bg-red-500/5 border-red-200/80 dark:border-red-500/20"
                            : isPaid
                              ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200/80 dark:border-emerald-500/20"
                              : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700/50"
                        }`}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className={`text-xs font-black uppercase tracking-widest truncate ${
                              isOverdue
                                ? "text-red-600 dark:text-red-400"
                                : isPaid
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {(p.status || "").replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase mt-0.5">
                            {p.invoice_count} Invoices
                          </span>
                        </div>
                        <div className="text-right flex flex-col items-end shrink-0">
                          <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black">
                            ₱{formatCurrency(p.total_volume)}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mt-0.5">
                            Gross Volume
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* SECTION B: ITEMIZED TRANSACTION LEDGER */}
          <section>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 flex items-center gap-2 print:text-black print:mt-10 border-t border-slate-200 dark:border-slate-700 pt-8">
              <List
                size={16}
                aria-hidden="true"
                className="text-amber-500 dark:text-overdrive-yellow"
              />
              <span>Itemized Sales Ledger</span>
            </h3>

            <DataTable
              caption="Itemized Sales Revenue and Liquidation Ledger"
              headers={[
                "Date & Invoice",
                "Customer & Branch",
                "Line Item Breakdown",
                "Status",
                "Net Revenue (₱)",
                "Action",
              ]}
              data={data?.transactions || []}
              loading={loading}
              emptyTitle="No transactions found"
              emptySubtitle="No sales match the selected filters."
              minWidth="min-w-[900px]"
              renderRow={(txn) => (
                <tr
                  key={txn.invoice_id}
                  className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0 print:hover:bg-transparent"
                >
                  {/* Date & Invoice */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <p className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white print:text-black mb-1.5">
                      {formatDisplayDate(txn.invoice_date)}
                    </p>
                    <span className="inline-flex px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900/70 text-[10px] font-black text-slate-800 dark:text-slate-200 font-mono tabular-nums tracking-wider border border-slate-200/70 dark:border-white/10 print:bg-transparent print:border-slate-400 print:text-black">
                      {txn.invoice_number}
                    </span>
                  </td>

                  {/* Customer & Branch */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <p
                      className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px] print:text-black print:max-w-none print:whitespace-normal"
                      title={txn.customer_name}
                    >
                      {txn.customer_name}
                    </p>
                    <p
                      className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[200px] flex items-center gap-1 print:text-black"
                      title={txn.branch_name}
                    >
                      <Building2 size={11} aria-hidden="true" />
                      <span className="truncate">{txn.branch_name}</span>
                    </p>
                  </td>

                  {/* Line Item Breakdown */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {txn.service_count > 0 && (
                        <span className="text-[10px] font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 px-2 py-0.5 rounded-md w-max">
                          {txn.service_count} Services Rendered
                        </span>
                      )}
                      {txn.part_count > 0 && (
                        <span className="text-[10px] font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 px-2 py-0.5 rounded-md w-max">
                          {txn.part_count} Parts Sold
                        </span>
                      )}
                      {!txn.service_count && !txn.part_count && (
                        <span className="text-[10px] font-medium text-slate-400 italic">
                          Standard Invoice
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <StatusBadge
                      label={(txn.status || "").replace(/_/g, " ")}
                      variant={getStatusVariant(txn.status)}
                    />
                  </td>

                  {/* Net Revenue */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                    <p className="text-xs sm:text-sm font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 print:text-black">
                      ₱{formatCurrency(txn.net_revenue)}
                    </p>
                    <p className="text-[10px] font-mono tabular-nums font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                      Gross: ₱{formatCurrency(txn.grand_total)}
                    </p>
                  </td>

                  {/* Action */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSource({
                          type: "INVOICE",
                          id: txn.invoice_id,
                          ref: txn.invoice_number,
                        })
                      }
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer print:hidden"
                      title={`Inspect Invoice ${txn.invoice_number}`}
                      aria-label={`Inspect invoice ${txn.invoice_number}`}
                    >
                      <Eye size={16} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              )}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </section>
        </div>
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
                onChange={handleFilterSelectChange(setBranchFilter)}
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
            <label htmlFor={paymentStatusSelectId} className="form-label">
              Payment / Liquidation Status
            </label>
            <div className="relative">
              <select
                id={paymentStatusSelectId}
                value={paymentStatusFilter}
                onChange={handleFilterSelectChange(setPaymentStatusFilter)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="PAID">Fully Paid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="OVERDUE">Overdue (Past Due Date)</option>
              </select>
              <ChevronDown
                size={15}
                aria-hidden="true"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
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
        </div>
      </FilterModal>

      {/* Read-Only Source Inspection Drawer */}
      <GeneralLedgerSourceDrawer
        isOpen={Boolean(selectedSource)}
        onClose={() => setSelectedSource(null)}
        source={selectedSource}
      />
    </div>
  );
};

export default SalesReports;
