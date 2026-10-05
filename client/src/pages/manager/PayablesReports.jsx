import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Calendar,
  AlertTriangle,
  Loader2,
  Store,
  Search,
  Eye,
  TrendingDown,
  Clock,
  Calculator,
  Building2,
} from "lucide-react";

// Services
import { payablesReportService } from "../../services/manager/payablesReport.service";
import { inventoryService } from "../../services/manager/inventory.service";
import { managerVendorService } from "../../services/manager/vendor.service";

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
import VendorPayableDrawer from "../../features/manager/components/VendorPayableDrawer";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const PayablesReports = () => {
  const { showToast } = useApp();

  // Report State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lookups
  const [branches, setBranches] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [branchFilter, setBranchFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [agingFilter, setAgingFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // View States
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) +
    (vendorFilter !== "all" ? 1 : 0) +
    (paymentStatusFilter !== "all" ? 1 : 0) +
    (agingFilter !== "all" ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  // 1. Initial Load: Branches and Vendors
  useEffect(() => {
    Promise.all([
      inventoryService.getActiveBranches(),
      managerVendorService.getVendors(1, 500, "", "active", "all", "all"),
    ])
      .then(([brRes, venRes]) => {
        setBranches(brRes.data || []);
        setVendors(venRes.data?.vendors || []);
      })
      .catch((err) => console.error("Failed to fetch lookups", err));
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    branchFilter,
    vendorFilter,
    paymentStatusFilter,
    agingFilter,
    startDate,
    endDate,
  ]);

  // 2. Load Report Data
  const loadReport = async () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      showToast("Start date cannot be after end date.", "warning");
      return;
    }

    try {
      setLoading(true);
      const res = await payablesReportService.getPayablesReport(
        currentPage,
        ITEMS_PER_PAGE,
        {
          search: debouncedSearchQuery,
          branch: branchFilter,
          vendor_id: vendorFilter,
          payment_status: paymentStatusFilter,
          aging_category: agingFilter,
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
    vendorFilter,
    paymentStatusFilter,
    agingFilter,
    startDate,
    endDate,
  ]);

  const resetFilters = () => {
    setBranchFilter("all");
    setVendorFilter("all");
    setPaymentStatusFilter("all");
    setAgingFilter("all");
    setStartDate("");
    setEndDate("");
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
    if (status === "OVERDUE") return "danger";
    if (status === "UNPAID" || status === "PARTIALLY_PAID") return "warning";
    return "default";
  };

  // Helper to render horizontal progress bars for aging distributions
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

  const agingDist = data?.aging_distribution;
  const totalOutstanding = data?.kpis?.total_outstanding || 0;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* PAGE HEADER & CONTROLS */}
      <PageHeader
        title="Payables Reports"
        subtitle="Accounts Payable Aging & Vendor Sub-Ledger"
        icon={Store}
      >
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Vendor or Bill..."
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
            title="Total Outstanding A/P"
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
            title="Open Bills"
            value={data.kpis.open_bills_count.toLocaleString()}
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
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[24px] sm:rounded-[32px] shadow-sm overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Print & Document Header */}
        <div className="p-6 sm:p-8 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-800/50 text-center bg-slate-50 dark:bg-slate-900/50 print:bg-transparent print:border-b-2 print:border-slate-900">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
            Accounts Payable Aging Summary
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
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="p-6 sm:p-8 lg:px-12 print:px-0">
          {/* SECTION A: AGING DISTRIBUTION BREAKDOWN */}
          <div className="mb-10 print:mb-6">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 flex items-center gap-2 print:text-black print:mb-4">
              <Clock size={16} className="text-amber-500 print:hidden" /> Aging
              Distribution
            </h3>

            {loading ? (
              <div className="flex justify-center py-6 print:hidden">
                <Loader2 className="animate-spin text-amber-500" />
              </div>
            ) : !data || totalOutstanding === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-700 rounded-xl print:text-black print:border-slate-300">
                No outstanding liabilities found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 print:grid-cols-5 print:gap-4">
                {/* Current */}
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 print:text-black">
                      Current
                    </span>
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                      ₱{formatCurrency(agingDist.current_balance)}
                    </span>
                  </div>
                  {renderProgressBar(
                    agingDist.current_balance,
                    totalOutstanding,
                    "bg-emerald-500",
                  )}
                </div>

                {/* 1-30 Days */}
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 print:text-black">
                      1–30 Days
                    </span>
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                      ₱{formatCurrency(agingDist.days_1_30)}
                    </span>
                  </div>
                  {renderProgressBar(
                    agingDist.days_1_30,
                    totalOutstanding,
                    "bg-amber-400",
                  )}
                </div>

                {/* 31-60 Days */}
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 print:text-black">
                      31–60 Days
                    </span>
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                      ₱{formatCurrency(agingDist.days_31_60)}
                    </span>
                  </div>
                  {renderProgressBar(
                    agingDist.days_31_60,
                    totalOutstanding,
                    "bg-amber-500",
                  )}
                </div>

                {/* 61-90 Days */}
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 print:text-black">
                      61–90 Days
                    </span>
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                      ₱{formatCurrency(agingDist.days_61_90)}
                    </span>
                  </div>
                  {renderProgressBar(
                    agingDist.days_61_90,
                    totalOutstanding,
                    "bg-rose-400",
                  )}
                </div>

                {/* Over 90 Days */}
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-500 print:text-black">
                      Over 90 Days
                    </span>
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                      ₱{formatCurrency(agingDist.days_over_90)}
                    </span>
                  </div>
                  {renderProgressBar(
                    agingDist.days_over_90,
                    totalOutstanding,
                    "bg-rose-600",
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION B: ITEMIZED A/P LEDGER */}
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 flex items-center gap-2 print:text-black print:mt-10 border-t border-slate-200 dark:border-slate-700 pt-8 print:pt-4">
              <FileText size={16} className="text-amber-500 print:hidden" />{" "}
              Itemized Accounts Payable Ledger
            </h3>

            <DataTable
              headers={[
                "Vendor & Reference",
                "Terms & Location",
                "Bill Amount",
                "Outstanding Bal",
                "Status & Aging",
                "Actions",
              ]}
              data={data?.ledger || []}
              loading={loading}
              emptyTitle="No open payables found"
              emptySubtitle="Try adjusting the filters or search criteria."
              minWidth="min-w-[1000px]"
              renderRow={(item, idx) => (
                <tr
                  key={`${item.bill_id}-${idx}`}
                  className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors print:hover:bg-transparent print:break-inside-avoid"
                >
                  <td className="px-4 sm:px-8 py-4">
                    <div className="min-w-0 max-w-[200px] sm:max-w-[250px]">
                      <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate print:text-black print:max-w-none print:whitespace-normal">
                        {item.vendor_name}
                      </p>
                      <div className="flex flex-col mt-1.5 gap-1">
                        <span className="inline-flex w-max px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-800 dark:text-slate-300 font-mono tracking-wider print:bg-transparent print:border print:border-slate-400 print:text-black">
                          {item.bill_number}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate print:text-slate-600">
                          INV: {item.vendor_invoice_number}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 sm:px-8 py-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate print:text-slate-600">
                      Issued: {item.bill_date}
                    </p>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1 truncate print:text-slate-800">
                      Due: {item.due_date}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate flex items-center gap-1 mt-1.5 print:text-slate-600">
                      <Building2 size={10} className="print:hidden" />{" "}
                      {item.branch_name}
                    </p>
                  </td>

                  <td className="px-4 sm:px-8 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold font-mono text-slate-600 dark:text-slate-400 print:text-black">
                        ₱{formatCurrency(item.bill_amount)}
                      </span>
                      {item.amount_paid > 0 && (
                        <span className="text-[9px] font-black text-emerald-500 mt-1 uppercase tracking-widest print:text-slate-700">
                          Paid: ₱{formatCurrency(item.amount_paid)}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 sm:px-8 py-4">
                    <span
                      className={`text-sm font-black font-mono print:text-black ${
                        item.status === "OVERDUE"
                          ? "text-rose-600 dark:text-rose-400"
                          : item.status === "PAID"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-500"
                      }`}
                    >
                      ₱{formatCurrency(item.outstanding_balance)}
                    </span>
                  </td>

                  <td className="px-4 sm:px-8 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <StatusBadge
                        label={item.status.replace("_", " ")}
                        variant={getStatusVariant(item.status)}
                        className="print:bg-transparent print:border-slate-400 print:text-black"
                      />
                      {item.days_overdue > 0 ? (
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest print:text-slate-800">
                          {item.days_overdue} Days Overdue
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest print:text-slate-800">
                          In Terms
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 sm:px-8 py-4 text-right print:hidden">
                    <button
                      onClick={() => setSelectedVendorId(item.vendor_id)}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                      title="View Vendor Profile & Ledger"
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
              Vendor Filter
            </label>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.business_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Status Filter
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Active Payables (Default)</option>
              <option value="UNPAID">Strictly Unpaid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="OVERDUE">Overdue Only</option>
              <option value="PAID">Fully Paid (Historical Recon)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Aging Category Focus
            </label>
            <select
              value={agingFilter}
              onChange={(e) => setAgingFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Aging Buckets</option>
              <option value="CURRENT">Current (In Terms)</option>
              <option value="1_30_DAYS">1-30 Days Overdue</option>
              <option value="31_60_DAYS">31-60 Days Overdue</option>
              <option value="61_90_DAYS">61-90 Days Overdue</option>
              <option value="OVER_90_DAYS">Over 90 Days (High Risk)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Bill Issue Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
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
            <p className="text-[9px] text-slate-400 mt-2 font-medium">
              * Filters which bills were issued in this period. Aging
              computations always evaluate against today.
            </p>
          </div>
        </div>
      </FilterModal>

      {/* Drill-Down Vendor Profile Drawer */}
      <VendorPayableDrawer
        isOpen={!!selectedVendorId}
        onClose={() => setSelectedVendorId(null)}
        vendorId={selectedVendorId}
      />
    </div>
  );
};

export default PayablesReports;
