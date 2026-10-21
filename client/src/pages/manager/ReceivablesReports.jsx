import React, { useState, useEffect, useCallback, useId } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Download,
  Calendar,
  AlertTriangle,
  Loader2,
  Users,
  Eye,
  TrendingDown,
  Clock,
  Building2,
  Calculator,
  Printer,
  ChevronDown,
} from "lucide-react";

// Services
import { receivablesReportService } from "../../services/manager/receivablesReport.service";
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
import StatusBadge from "../../components/ui/StatusBadge";

// Drill-Down Drawer
import CustomerReceivableDrawer from "../../features/manager/components/CustomerReceivableDrawer";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const ITEMS_PER_PAGE = 10;

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

const ReceivablesReports = () => {
  const { showToast } = useApp();
  const [searchParams] = useSearchParams();

  // Accessible Filter Modal Control IDs
  const branchSelectId = useId();
  const paymentStatusSelectId = useId();
  const agingSelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();

  // Report State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lookups
  const [branches, setBranches] = useState([]);

  // Filters (Initialized from URL Search Params if present)
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [branchFilter, setBranchFilter] = useState(
    searchParams.get("branch") || "all",
  );
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(
    searchParams.get("payment_status") || "all",
  );
  const [agingFilter, setAgingFilter] = useState("all");
  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") || "",
  );
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // View States
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) +
    (paymentStatusFilter !== "all" ? 1 : 0) +
    (agingFilter !== "all" ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  // 1. Initial Load: Branches
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

  const handleFilterSelectChange = (setter) => (e) => {
    setter(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleDateRangeChange = (field, value) => {
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

  const resetFilters = () => {
    setBranchFilter("all");
    setPaymentStatusFilter("all");
    setAgingFilter("all");
    setStartDate("");
    setEndDate("");
    if (currentPage !== 1) setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  // 2. Load Report Data
  const loadReport = useCallback(async () => {
    if (startDate && endDate && startDate > endDate) {
      showToast("Start date cannot be after end date.", "warning");
      return;
    }

    try {
      setLoading(true);
      const res = await receivablesReportService.getReceivablesReport(
        currentPage,
        ITEMS_PER_PAGE,
        {
          search: debouncedSearchQuery,
          branch: branchFilter,
          payment_status: paymentStatusFilter,
          aging_category: agingFilter,
          start_date: startDate,
          end_date: endDate,
        },
      );

      const fetchedLedger = res.data?.ledger || [];
      const fetchedTotalPages = res.data?.pagination?.totalPages || 1;

      if (fetchedLedger.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setData(res.data);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load Receivables Reports data.",
        "error",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    branchFilter,
    paymentStatusFilter,
    agingFilter,
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
    if (status === "OVERDUE") return "danger";
    if (status === "UNPAID" || status === "PARTIALLY_PAID") return "warning";
    return "default";
  };

  // Helper to render horizontal progress bars for aging distributions
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

  const agingDist = data?.aging_distribution;
  const totalOutstanding = parseFloat(data?.kpis?.total_outstanding) || 0;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* PAGE HEADER & CONTROLS */}
      <PageHeader
        title="Receivables Reports"
        subtitle="Accounts Receivable Aging & Sub-Ledger"
        icon={Users}
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Customer or Invoice..."
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
            showToast("CSV export queued for reporting phase.", "info")
          }
          disabled={!data || loading}
        />
      </PageHeader>

      {/* KPI DASHBOARD (Hidden in Print) */}
      {data?.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:hidden">
          <StatCard
            title="Total Outstanding A/R"
            value={`₱${formatCurrency(data.kpis.total_outstanding)}`}
            icon={Calculator}
            variant="warning"
          />
          <StatCard
            title="Total Overdue"
            value={`₱${formatCurrency(data.kpis.total_overdue)}`}
            icon={AlertTriangle}
            variant={data.kpis.total_overdue > 0 ? "danger" : "default"}
          />
          <StatCard
            title="Open Invoices"
            value={(data.kpis.open_invoices_count || 0).toLocaleString()}
            icon={FileText}
            variant="default"
          />
          <StatCard
            title="High Risk (>90 Days)"
            value={`₱${formatCurrency(data.kpis.high_risk_overdue)}`}
            icon={TrendingDown}
            variant={data.kpis.high_risk_overdue > 0 ? "danger" : "default"}
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
            Accounts Receivable Aging Summary
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
              As of{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </span>
          </p>
        </div>

        <div className="p-6 sm:p-8 lg:px-12 print:px-0">
          {/* SECTION A: AGING DISTRIBUTION BREAKDOWN */}
          <section className="mb-10">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 flex items-center gap-2 print:text-black">
              <Clock
                size={16}
                aria-hidden="true"
                className="text-amber-500 dark:text-overdrive-yellow"
              />
              <span>Aging Distribution</span>
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
            ) : !data || !agingDist || totalOutstanding === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                No outstanding balances found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
                {/* Current */}
                <div>
                  <div className="flex justify-between items-end gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      Current
                    </span>
                    <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black shrink-0">
                      ₱{formatCurrency(agingDist.current_balance)}
                    </span>
                  </div>
                  {renderProgressBar(
                    agingDist.current_balance,
                    totalOutstanding,
                    "bg-emerald-500",
                    "Current receivables share",
                  )}
                </div>

                {/* 1-30 Days */}
                <div>
                  <div className="flex justify-between items-end gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                      1–30 Days
                    </span>
                    <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black shrink-0">
                      ₱{formatCurrency(agingDist.days_1_30)}
                    </span>
                  </div>
                  {renderProgressBar(
                    agingDist.days_1_30,
                    totalOutstanding,
                    "bg-amber-400",
                    "1 to 30 days overdue share",
                  )}
                </div>

                {/* 31-60 Days */}
                <div>
                  <div className="flex justify-between items-end gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
                      31–60 Days
                    </span>
                    <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black shrink-0">
                      ₱{formatCurrency(agingDist.days_31_60)}
                    </span>
                  </div>
                  {renderProgressBar(
                    agingDist.days_31_60,
                    totalOutstanding,
                    "bg-amber-500",
                    "31 to 60 days overdue share",
                  )}
                </div>

                {/* 61-90 Days */}
                <div>
                  <div className="flex justify-between items-end gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-400">
                      61–90 Days
                    </span>
                    <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black shrink-0">
                      ₱{formatCurrency(agingDist.days_61_90)}
                    </span>
                  </div>
                  {renderProgressBar(
                    agingDist.days_61_90,
                    totalOutstanding,
                    "bg-rose-400",
                    "61 to 90 days overdue share",
                  )}
                </div>

                {/* Over 90 Days */}
                <div>
                  <div className="flex justify-between items-end gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-500">
                      Over 90 Days
                    </span>
                    <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black shrink-0">
                      ₱{formatCurrency(agingDist.days_over_90)}
                    </span>
                  </div>
                  {renderProgressBar(
                    agingDist.days_over_90,
                    totalOutstanding,
                    "bg-rose-600",
                    "Over 90 days overdue share",
                  )}
                </div>
              </div>
            )}
          </section>

          {/* SECTION B: ITEMIZED A/R LEDGER */}
          <section>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 flex items-center gap-2 print:text-black print:mt-10 border-t border-slate-200 dark:border-slate-700 pt-8">
              <FileText
                size={16}
                aria-hidden="true"
                className="text-blue-600 dark:text-blue-400"
              />
              <span>Itemized Accounts Receivable Ledger</span>
            </h3>

            <DataTable
              caption="Itemized Accounts Receivable and Aging Sub-Ledger"
              headers={[
                "Customer & Reference",
                "Terms & Location",
                "Invoice Amount",
                "Outstanding Bal",
                "Status & Aging",
                "Actions",
              ]}
              data={data?.ledger || []}
              loading={loading}
              emptyTitle="No open receivables found"
              emptySubtitle="Try adjusting the filters or search criteria."
              minWidth="min-w-[1000px]"
              renderRow={(item, idx) => (
                <tr
                  key={`${item.invoice_id}-${idx}`}
                  className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0 print:hover:bg-transparent"
                >
                  {/* Customer & Reference */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <div className="min-w-0 max-w-[200px] sm:max-w-[250px]">
                      <p
                        className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate print:text-black print:max-w-none print:whitespace-normal"
                        title={item.customer_name}
                      >
                        {item.customer_name}
                      </p>
                      <span className="inline-flex mt-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900/70 text-[10px] font-black text-slate-800 dark:text-slate-200 font-mono tabular-nums tracking-wider border border-slate-200/70 dark:border-white/10 print:bg-transparent print:border-slate-400 print:text-black">
                        {item.invoice_number}
                      </span>
                    </div>
                  </td>

                  {/* Terms & Location */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">
                      Issued: {formatDisplayDate(item.invoice_date)}
                    </p>
                    <p className="text-[10px] font-mono tabular-nums font-bold text-amber-600 dark:text-overdrive-yellow uppercase tracking-widest mt-1 truncate">
                      Due: {formatDisplayDate(item.due_date)}
                    </p>
                    <p
                      className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate flex items-center gap-1 mt-1.5 max-w-[180px]"
                      title={item.branch_name}
                    >
                      <Building2
                        size={11}
                        aria-hidden="true"
                        className="shrink-0"
                      />
                      <span className="truncate">{item.branch_name}</span>
                    </p>
                  </td>

                  {/* Invoice Amount */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-slate-600 dark:text-slate-300 print:text-black">
                        ₱{formatCurrency(item.invoice_amount)}
                      </span>
                      {parseFloat(item.amount_paid) > 0 && (
                        <span className="text-[10px] font-mono tabular-nums font-black text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-widest">
                          Paid: ₱{formatCurrency(item.amount_paid)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Outstanding Bal */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <span
                      className={`text-xs sm:text-sm font-black font-mono tabular-nums print:text-black ${
                        item.status === "OVERDUE"
                          ? "text-rose-600 dark:text-rose-400"
                          : item.status === "PAID"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      ₱{formatCurrency(item.outstanding_balance)}
                    </span>
                  </td>

                  {/* Status & Aging */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1.5">
                      <StatusBadge
                        label={(item.status || "").replace(/_/g, " ")}
                        variant={getStatusVariant(item.status)}
                      />
                      {item.days_overdue > 0 ? (
                        <span className="text-[10px] font-mono tabular-nums font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                          {item.days_overdue} Days Overdue
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                          In Terms
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerId(item.customer_id)}
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer print:hidden"
                      title={`View Customer Profile & Ledger (${item.customer_name})`}
                      aria-label={`View receivable profile and ledger for ${item.customer_name}`}
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
              Status Filter
            </label>
            <div className="relative">
              <select
                id={paymentStatusSelectId}
                value={paymentStatusFilter}
                onChange={handleFilterSelectChange(setPaymentStatusFilter)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Active Receivables (Default)</option>
                <option value="UNPAID">Strictly Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="OVERDUE">Overdue Only</option>
                <option value="PAID">Fully Paid (Historical Recon)</option>
              </select>
              <ChevronDown
                size={15}
                aria-hidden="true"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor={agingSelectId} className="form-label">
              Aging Category Focus
            </label>
            <div className="relative">
              <select
                id={agingSelectId}
                value={agingFilter}
                onChange={handleFilterSelectChange(setAgingFilter)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Aging Buckets</option>
                <option value="CURRENT">Current (Not Due Yet)</option>
                <option value="1_30_DAYS">1–30 Days Overdue</option>
                <option value="31_60_DAYS">31–60 Days Overdue</option>
                <option value="61_90_DAYS">61–90 Days Overdue</option>
                <option value="OVER_90_DAYS">Over 90 Days (High Risk)</option>
              </select>
              <ChevronDown
                size={15}
                aria-hidden="true"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
            <span className="form-label">Invoice Issue Date Range</span>
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
                    handleDateRangeChange("start", e.target.value)
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
                  onChange={(e) => handleDateRangeChange("end", e.target.value)}
                  className="form-input font-mono tabular-nums cursor-pointer"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2.5 font-medium leading-relaxed">
              * Filters which invoices were issued in this period. Aging
              computations always evaluate against today.
            </p>
          </div>
        </div>
      </FilterModal>

      {/* Drill-Down Customer Profile Drawer */}
      <CustomerReceivableDrawer
        isOpen={Boolean(selectedCustomerId)}
        onClose={() => setSelectedCustomerId(null)}
        customerId={selectedCustomerId}
      />
    </div>
  );
};

export default ReceivablesReports;
