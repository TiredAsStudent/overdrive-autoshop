import React, { useState, useEffect } from "react";
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
  CheckCircle2,
  AlertTriangle,
  Printer,
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

const SalesReports = () => {
  const { showToast } = useApp();

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
  const ITEMS_PER_PAGE = 10;

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

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    branchFilter,
    paymentStatusFilter,
    startDate,
    endDate,
  ]);

  // Load Report Data
  const loadReport = async () => {
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
      setData(res.data);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    debouncedSearchQuery,
    branchFilter,
    paymentStatusFilter,
    startDate,
    endDate,
  ]);

  const handlePresetChange = (val) => {
    setDatePreset(val);
    if (val !== "custom") {
      const { start, end } = getPresetDates(val);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const resetFilters = () => {
    setBranchFilter("all");
    setPaymentStatusFilter("all");
    setDatePreset("this_month");
    const { start, end } = getPresetDates("this_month");
    setStartDate(start);
    setEndDate(end);
    setIsFilterModalOpen(false);
  };

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
  const renderProgressBar = (value, total, colorClass) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden print:hidden mt-2">
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
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
            options={[
              { label: "This Month", value: "this_month" },
              { label: "This Quarter", value: "this_quarter" },
              { label: "This Year", value: "this_year" },
            ]}
          />
        </div>

        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Invoice or Customer..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <div className="flex gap-2">
          <ActionButton
            label="Export"
            icon={Download}
            onClick={() =>
              showToast("CSV/Excel export queued for reporting phase.", "info")
            }
            disabled={!data || loading}
          />
        </div>
      </PageHeader>

      {/* EXECUTIVE KPI DASHBOARD (Hidden in Print) */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:hidden">
          <StatCard
            title="Total Net Sales Revenue"
            value={`₱${formatCurrency(data.kpis.total_sales_revenue)}`}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title={`Service Revenue (${data.kpis.service_revenue.percentage}%)`}
            value={`₱${formatCurrency(data.kpis.service_revenue.amount)}`}
            icon={Wrench}
            variant="info"
          />
          <StatCard
            title={`Parts Revenue (${data.kpis.parts_revenue.percentage}%)`}
            value={`₱${formatCurrency(data.kpis.parts_revenue.amount)}`}
            icon={Package}
            variant="warning"
          />
          <StatCard
            title={`Average Sales Value (${data.kpis.total_invoices} Txns)`}
            value={`₱${formatCurrency(data.kpis.average_sales_value)}`}
            icon={Calculator}
            variant="default"
          />
        </div>
      )}

      {/* DOCUMENT BODY */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[24px] sm:rounded-[32px] shadow-sm overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Print & Document Header */}
        <div className="p-6 sm:p-8 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-800/50 text-center bg-slate-50 dark:bg-slate-900/50 print:bg-transparent print:border-b-2 print:border-slate-900">
          <div className="absolute right-8 top-8 hidden print:block">
            <Printer size={24} className="text-slate-900" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
            Sales Performance Report
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

        <div className="p-6 sm:p-8 lg:px-12 print:px-0">
          {/* ANALYTICAL DISTRIBUTIONS */}
          <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Sales by Branch */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-500 mb-6 flex items-center gap-2 print:text-black">
                <Building2 size={16} /> Sales by Branch
              </h3>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-emerald-500" />
                </div>
              ) : !data || data.distributions.by_branch.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  No branch data.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.distributions.by_branch.map((b) => (
                    <div key={b.branch_id}>
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white uppercase print:text-black truncate pr-4">
                            {b.branch_name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5 tracking-widest uppercase">
                            {b.transaction_count} Invoices
                          </span>
                        </div>
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                          ₱{formatCurrency(b.net_revenue)}
                        </span>
                      </div>
                      {renderProgressBar(
                        b.net_revenue,
                        data.kpis.total_sales_revenue,
                        "bg-emerald-500",
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Sales by Service Category */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-500 dark:text-blue-500 mb-6 flex items-center gap-2 print:text-black">
                <PieChart size={16} /> Labor by Service Category
              </h3>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-blue-500" />
                </div>
              ) : !data ||
                data.distributions.by_service_category.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  No service data.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.distributions.by_service_category.map((s, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white uppercase print:text-black truncate pr-4">
                            {s.service_category}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5 tracking-widest uppercase">
                            {s.transaction_count} Rendered
                          </span>
                        </div>
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                          ₱{formatCurrency(s.net_revenue)}
                        </span>
                      </div>
                      {renderProgressBar(
                        s.net_revenue,
                        data.kpis.service_revenue.amount,
                        "bg-blue-500",
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Sales by Parts Category */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-500 dark:text-amber-500 mb-6 flex items-center gap-2 print:text-black mt-2 lg:mt-0">
                <Package size={16} /> Parts Sales by Category
              </h3>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-amber-500" />
                </div>
              ) : !data || data.distributions.by_parts_category.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  No parts data.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.distributions.by_parts_category.map((p, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white uppercase print:text-black truncate pr-4">
                            {p.part_category}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5 tracking-widest uppercase">
                            {p.transaction_count} Sold
                          </span>
                        </div>
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                          ₱{formatCurrency(p.net_revenue)}
                        </span>
                      </div>
                      {renderProgressBar(
                        p.net_revenue,
                        data.kpis.parts_revenue.amount,
                        "bg-amber-500",
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Top Customers */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-6 flex items-center gap-2 print:text-black mt-2 lg:mt-0">
                <Users size={16} /> Top 10 Customers
              </h3>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-emerald-500" />
                </div>
              ) : !data || data.distributions.top_customers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  No customer data.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.distributions.top_customers.map((c, idx) => (
                    <div
                      key={c.customer_id}
                      className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-[10px] font-black text-emerald-500 w-4">
                          {idx + 1}.
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase truncate print:text-black">
                            {c.customer_name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                            {c.transaction_count} Purchases
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white print:text-black shrink-0">
                        ₱{formatCurrency(c.net_revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Payment Liquidation Status */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-purple-500 dark:text-purple-400 mb-6 flex items-center gap-2 print:text-black mt-2 lg:mt-0">
                <CreditCard size={16} /> A/R & Payment Liquidation
              </h3>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-purple-500" />
                </div>
              ) : !data || data.distributions.payment_status.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  No payment data.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.distributions.payment_status.map((p, idx) => {
                    const isOverdue = p.status === "OVERDUE";
                    const isPaid = p.status === "PAID";
                    return (
                      <div
                        key={idx}
                        className={`flex justify-between items-center p-3 sm:p-4 rounded-xl border ${
                          isOverdue
                            ? "bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20"
                            : isPaid
                              ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20"
                              : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span
                            className={`text-xs font-black uppercase tracking-widest ${
                              isOverdue
                                ? "text-red-600 dark:text-red-400"
                                : isPaid
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {p.status.replace("_", " ")}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mt-0.5">
                            {p.invoice_count} Invoices
                          </span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                            ₱{formatCurrency(p.total_volume)}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                            Gross Volume
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SECTION B: ITEMIZED TRANSACTION LEDGER */}
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 flex items-center gap-2 print:text-black print:mt-10 border-t border-slate-200 dark:border-slate-700 pt-8">
              <List size={16} className="text-amber-500" /> Itemized Sales
              Ledger
            </h3>

            <DataTable
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
              renderRow={(txn, idx) => (
                <tr
                  key={txn.invoice_id}
                  className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors print:hover:bg-transparent"
                >
                  <td className="px-4 sm:px-8 py-4">
                    <p className="text-xs font-bold text-slate-900 dark:text-white print:text-black mb-1.5">
                      {new Date(txn.invoice_date).toLocaleDateString()}
                    </p>
                    <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-800 dark:text-slate-300 font-mono tracking-wider print:bg-transparent print:border print:border-slate-400 print:text-black">
                      {txn.invoice_number}
                    </span>
                  </td>

                  <td className="px-4 sm:px-8 py-4">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px] print:text-black print:max-w-none print:whitespace-normal">
                      {txn.customer_name}
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate max-w-[200px] flex items-center gap-1 print:text-black">
                      <Building2 size={10} /> {txn.branch_name}
                    </p>
                  </td>

                  <td className="px-4 sm:px-8 py-4">
                    <div className="flex flex-col gap-1">
                      {txn.service_count > 0 && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded w-max">
                          {txn.service_count} Services Rendered
                        </span>
                      )}
                      {txn.part_count > 0 && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded w-max">
                          {txn.part_count} Parts Sold
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 sm:px-8 py-4">
                    <StatusBadge
                      label={txn.status.replace("_", " ")}
                      variant={getStatusVariant(txn.status)}
                    />
                  </td>

                  <td className="px-4 sm:px-8 py-4 text-right">
                    <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 print:text-black">
                      {formatCurrency(txn.net_revenue)}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Gross: {formatCurrency(txn.grand_total)}
                    </p>
                  </td>

                  <td className="px-4 sm:px-8 py-4 text-right">
                    <button
                      onClick={() =>
                        setSelectedSource({
                          type: "INVOICE",
                          id: txn.invoice_id,
                          ref: txn.invoice_number,
                        })
                      }
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer print:hidden"
                      title="Inspect Invoice"
                    >
                      <Eye size={16} />
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
          </div>
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
              Payment / Liquidation Status
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="PAID">Fully Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="OVERDUE">Overdue (Past Due Date)</option>
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
                    onChange={(e) => setStartDate(e.target.value)}
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
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </FilterModal>

      {/* Read-Only Source Inspection Drawer */}
      <GeneralLedgerSourceDrawer
        isOpen={!!selectedSource}
        onClose={() => setSelectedSource(null)}
        source={selectedSource}
      />
    </div>
  );
};

export default SalesReports;
