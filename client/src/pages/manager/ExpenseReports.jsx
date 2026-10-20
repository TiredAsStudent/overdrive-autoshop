import React, { useState, useEffect, useCallback, useId } from "react";
import {
  Receipt,
  Download,
  Calendar,
  PieChart,
  List,
  Eye,
  Loader2,
  TrendingDown,
  Calculator,
  ScanText,
  FileText,
  BookOpen,
  ChevronDown,
} from "lucide-react";

// Services
import { expenseReportService } from "../../services/manager/expenseReport.service";
import { inventoryService } from "../../services/manager/inventory.service";
import { chartOfAccountsService } from "../../services/manager/chartOfAccounts.service";
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

const ExpenseReports = () => {
  const { showToast } = useApp();

  // Accessible Filter Modal Control IDs
  const branchSelectId = useId();
  const sourceModuleSelectId = useId();
  const categorySelectId = useId();
  const vendorSelectId = useId();
  const periodSelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();

  // Initialization Dates
  const initialDates = getPresetDates("this_month");

  // Report State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lookups
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [datePreset, setDatePreset] = useState("this_month");
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [branchFilter, setBranchFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [sourceModuleFilter, setSourceModuleFilter] = useState("all");

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // View States
  const [selectedSource, setSelectedSource] = useState(null);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (vendorFilter !== "all" ? 1 : 0) +
    (sourceModuleFilter !== "all" ? 1 : 0) +
    (datePreset !== "this_month" ? 1 : 0);

  // 1. Initial Load: Lookups
  useEffect(() => {
    Promise.all([
      inventoryService.getActiveBranches(),
      chartOfAccountsService.getAccounts(1, 500, "", "EXPENSE", "active"),
      managerVendorService.getVendors(1, 500, "", "active"),
    ])
      .then(([brRes, catRes, venRes]) => {
        setBranches(brRes.data || []);
        setCategories(catRes.data?.accounts || []);
        setVendors(venRes.data?.vendors || []);
      })
      .catch((err) => console.error("Failed to fetch lookups", err));
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
    setCategoryFilter("all");
    setVendorFilter("all");
    setSourceModuleFilter("all");
    setDatePreset("this_month");
    const { start, end } = getPresetDates("this_month");
    setStartDate(start);
    setEndDate(end);
    if (currentPage !== 1) setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  // 2. Load Report Data
  const loadReport = useCallback(async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      const res = await expenseReportService.getExpenseReport(
        currentPage,
        ITEMS_PER_PAGE,
        {
          search: debouncedSearchQuery,
          branch: branchFilter,
          category_id: categoryFilter,
          vendor_id: vendorFilter,
          source_module: sourceModuleFilter,
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
      showToast(
        error.message || "Unable to load Expense Reports data.",
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
    categoryFilter,
    vendorFilter,
    sourceModuleFilter,
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

  const getSourceBadge = (source) => {
    switch (source) {
      case "MANUAL_EXPENSE":
        return (
          <StatusBadge
            label="Manual"
            variant="info"
            icon={FileText}
            className="print:bg-transparent print:border-slate-300 print:text-black"
          />
        );
      case "OCR_RECEIPT":
        return (
          <StatusBadge
            label="OCR Receipt"
            variant="warning"
            icon={ScanText}
            className="print:bg-transparent print:border-slate-300 print:text-black"
          />
        );
      case "BILL":
        return (
          <StatusBadge
            label="Supplier Bill"
            variant="default"
            icon={List}
            className="!text-purple-700 dark:!text-purple-400 !bg-purple-50 dark:!bg-purple-500/10 !border-purple-200 dark:!border-purple-500/20 print:!bg-transparent print:!border-slate-300 print:!text-black"
          />
        );
      case "JOURNAL_ENTRY":
        return (
          <StatusBadge
            label="Journal"
            variant="default"
            icon={BookOpen}
            className="print:bg-transparent print:border-slate-300 print:text-black"
          />
        );
      default:
        return (
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {source}
          </span>
        );
    }
  };

  const handleDrillDown = (module, id, ref) => {
    // FRS Engine Map: Both MANUAL and OCR originate from the 'expenses' table and use the 'EXPENSE' Drawer logic
    let targetType = module;
    if (module === "MANUAL_EXPENSE" || module === "OCR_RECEIPT") {
      targetType = "EXPENSE";
    }

    setSelectedSource({
      type: targetType,
      id,
      ref,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* PAGE HEADER & CONTROLS */}
      <PageHeader
        title="Expense Reports"
        subtitle="Operational Expenditure & Category Breakdown"
        icon={Receipt}
      >
        <div className="hidden lg:block">
          <StatusToggle
            activeValue={datePreset}
            onToggle={handlePresetChange}
            ariaLabel="Select expense report period preset"
            options={DATE_PRESET_OPTIONS}
          />
        </div>

        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Reference or Vendor..."
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
            title="Total Operating Expenses"
            value={`₱${formatCurrency(data.kpis.total_operating_expense)}`}
            icon={TrendingDown}
            variant="danger"
          />
          <StatCard
            title="Total Transactions"
            value={data.kpis.total_transaction_count}
            icon={List}
            variant="default"
          />
          <StatCard
            title="Average Expense Size"
            value={`₱${formatCurrency(data.kpis.average_expense_size)}`}
            icon={Calculator}
            variant="default"
          />
          <StatCard
            title="Top Category (% Share)"
            value={
              data.kpis.top_category
                ? `${data.kpis.top_category.percentage}%`
                : "0%"
            }
            icon={PieChart}
            variant={data.kpis.top_category ? "warning" : "default"}
          />
        </div>
      )}

      {/* DOCUMENT BODY */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-[32px] shadow-xs overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Print & Document Header */}
        <div className="p-6 sm:p-8 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-700/50 text-center bg-slate-50/70 dark:bg-slate-900/50 print:bg-transparent print:border-b-2 print:border-slate-900">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
            Expense Report
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
          {/* SECTION A: CATEGORY SUMMARY MATRIX */}
          <section className="mb-10">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-6 flex items-center gap-2 print:text-black">
              <PieChart size={16} aria-hidden="true" />
              <span>Category Spending Breakdown</span>
            </h3>

            {loading ? (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center justify-center py-10 text-slate-400"
              >
                <Loader2
                  aria-hidden="true"
                  className="w-6 h-6 animate-spin text-amber-500 mb-2"
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Compiling Category Breakdown...
                </span>
              </div>
            ) : !Array.isArray(data?.category_summary) ||
              data.category_summary.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                No expenses found for this period.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {data.category_summary.map((cat) => {
                  const pct = Math.min(
                    100,
                    Math.max(0, parseFloat(cat.percentage_of_total) || 0),
                  );
                  return (
                    <div key={cat.category_id} className="relative">
                      <div className="flex justify-between items-end gap-4 mb-2">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase print:text-black truncate"
                            title={cat.category_name}
                          >
                            {cat.category_name}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mt-0.5 tracking-widest uppercase">
                            {cat.transaction_count} Transactions
                          </span>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black">
                            ₱{formatCurrency(cat.total_amount)}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow tracking-widest">
                            {cat.percentage_of_total}%
                          </span>
                        </div>
                      </div>
                      {/* Visual Progress Bar */}
                      <div
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${cat.category_name} spending share`}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden print:hidden"
                      >
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* SECTION B: ITEMIZED TRANSACTION LEDGER */}
          <section>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-6 flex items-center gap-2 print:text-black print:mt-10">
              <List size={16} aria-hidden="true" />
              <span>Itemized Transaction Ledger</span>
            </h3>

            <DataTable
              caption="Itemized Operational Expense Transactions"
              headers={[
                "Date & Source",
                "Reference",
                "Category & Payee",
                "Amount (₱)",
                "Action",
              ]}
              data={data?.transactions || []}
              loading={loading}
              emptyTitle="No transactions found"
              emptySubtitle="No transactions match the selected filters."
              minWidth="min-w-[820px]"
              renderRow={(txn, idx) => (
                <tr
                  key={`${txn.source_module}-${txn.source_id}-${idx}`}
                  className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0 print:hover:bg-transparent"
                >
                  {/* Date & Source */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <p className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white print:text-black">
                      {formatDisplayDate(txn.transaction_date)}
                    </p>
                    <div className="mt-1.5">
                      {getSourceBadge(txn.source_module)}
                    </div>
                  </td>

                  {/* Reference */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono tabular-nums tracking-widest uppercase print:text-black">
                      {txn.reference_number || "N/A"}
                    </p>
                    <p
                      className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[140px]"
                      title={txn.branch_name}
                    >
                      {txn.branch_name || "Enterprise Global"}
                    </p>
                  </td>

                  {/* Category & Payee */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <p
                      className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[220px] print:text-black print:max-w-none print:whitespace-normal"
                      title={txn.category}
                    >
                      {txn.category}
                    </p>
                    <p
                      className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase mt-1 truncate max-w-[220px] print:text-black print:max-w-none print:whitespace-normal"
                      title={txn.vendor_name}
                    >
                      {txn.vendor_name || "Direct Expense"}
                    </p>
                  </td>

                  {/* Amount */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                    <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white print:text-black">
                      ₱{formatCurrency(txn.amount)}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() =>
                        handleDrillDown(
                          txn.source_module,
                          txn.source_id,
                          txn.reference_number,
                        )
                      }
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer print:hidden"
                      title={`View Source Document (${txn.reference_number || txn.category})`}
                      aria-label={`View source document for ${txn.reference_number || txn.category}`}
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
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
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
                  <option value="all">Global (All)</option>
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
              <label htmlFor={sourceModuleSelectId} className="form-label">
                Source Origin
              </label>
              <div className="relative">
                <select
                  id={sourceModuleSelectId}
                  value={sourceModuleFilter}
                  onChange={handleFilterSelectChange(setSourceModuleFilter)}
                  className="form-select appearance-none pr-10 cursor-pointer"
                >
                  <option value="all">All Sources</option>
                  <option value="MANUAL_EXPENSE">Manual Expenses</option>
                  <option value="OCR_RECEIPT">OCR Receipts</option>
                  <option value="BILL">Supplier Bills</option>
                  <option value="JOURNAL_ENTRY">Journal Entries</option>
                </select>
                <ChevronDown
                  size={15}
                  aria-hidden="true"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor={categorySelectId} className="form-label">
              Expense Category
            </label>
            <div className="relative">
              <select
                id={categorySelectId}
                value={categoryFilter}
                onChange={handleFilterSelectChange(setCategoryFilter)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Expense Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.account_name}
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
            <label htmlFor={vendorSelectId} className="form-label">
              Vendor / Supplier
            </label>
            <div className="relative">
              <select
                id={vendorSelectId}
                value={vendorFilter}
                onChange={handleFilterSelectChange(setVendorFilter)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.business_name}
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

      {/* Drill-Down Source Drawer */}
      <GeneralLedgerSourceDrawer
        isOpen={Boolean(selectedSource)}
        onClose={() => setSelectedSource(null)}
        source={selectedSource}
      />
    </div>
  );
};

export default ExpenseReports;
