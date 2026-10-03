import React, { useState, useEffect } from "react";
import {
  Receipt,
  Download,
  Calendar,
  PieChart,
  List,
  Search,
  Eye,
  Loader2,
  Building2,
  TrendingDown,
  Calculator,
  Hash,
  ScanText,
  FileText,
  BookOpen,
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

const ExpenseReports = () => {
  const { showToast } = useApp();

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
  const ITEMS_PER_PAGE = 10;

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

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    branchFilter,
    categoryFilter,
    vendorFilter,
    sourceModuleFilter,
    startDate,
    endDate,
  ]);

  // 2. Load Report Data
  const loadReport = async () => {
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
    categoryFilter,
    vendorFilter,
    sourceModuleFilter,
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
    setCategoryFilter("all");
    setVendorFilter("all");
    setSourceModuleFilter("all");
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

  const getSourceBadge = (source) => {
    switch (source) {
      case "MANUAL_EXPENSE":
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-500/20 print:bg-transparent print:border-slate-300 print:text-black">
            <FileText size={10} /> Manual
          </span>
        );
      case "OCR_RECEIPT":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-500/20 print:bg-transparent print:border-slate-300 print:text-black">
            <ScanText size={10} /> OCR Receipt
          </span>
        );
      case "BILL":
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-purple-200 dark:border-purple-500/20 print:bg-transparent print:border-slate-300 print:text-black">
            <List size={10} /> Supplier Bill
          </span>
        );
      case "JOURNAL_ENTRY":
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-slate-300 dark:border-slate-600 print:bg-transparent print:border-slate-300 print:text-black">
            <BookOpen size={10} /> Journal
          </span>
        );
      default:
        return <span className="text-[9px] text-slate-400">{source}</span>;
    }
  };

  const handleDrillDown = (module, id, ref) => {
    // FRS Engine Map: Both MANUAL and OCR originate from the 'expenses' table and use the 'EXPENSE' Drawer logic
    let targetType = module;
    if (module === "MANUAL_EXPENSE" || module === "OCR_RECEIPT")
      targetType = "EXPENSE";

    setSelectedSource({
      type: targetType,
      id: id,
      ref: ref,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
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
          placeholder="Search ref or vendor..."
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
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[24px] sm:rounded-[32px] shadow-sm overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Print & Document Header */}
        <div className="p-6 sm:p-8 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-800/50 text-center bg-slate-50 dark:bg-slate-900/50 print:bg-transparent print:border-b-2 print:border-slate-900">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
            Expense Report
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 mt-1.5 uppercase print:text-black">
            {branchFilter === "all"
              ? "Enterprise Global (Consolidated)"
              : branches.find((b) => b.id.toString() === branchFilter)
                  ?.branch_name || "Branch Specific"}
          </p>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 mt-1.5 uppercase tracking-widest flex justify-center items-center gap-1.5 print:text-slate-700">
            <Calendar size={12} className="print:hidden" />
            For the period {new Date(startDate).toLocaleDateString()} to{" "}
            {new Date(endDate).toLocaleDateString()}
          </p>
        </div>

        <div className="p-6 sm:p-8 lg:px-12 print:px-0">
          {/* SECTION A: CATEGORY SUMMARY MATRIX */}
          <div className="mb-10">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-500 dark:text-amber-500 mb-6 flex items-center gap-2 print:text-black">
              <PieChart size={16} /> Category Spending Breakdown
            </h3>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-amber-500" />
              </div>
            ) : !data || data.category_summary.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                No expenses found for this period.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {data.category_summary.map((cat) => (
                  <div key={cat.category_id} className="relative">
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase print:text-black truncate pr-4">
                          {cat.category_name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-widest uppercase">
                          {cat.transaction_count} Transactions
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                          ₱{formatCurrency(cat.total_amount)}
                        </span>
                        <span className="text-[10px] font-black text-amber-500 tracking-widest">
                          {cat.percentage_of_total}%
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden print:hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${cat.percentage_of_total}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION B: ITEMIZED TRANSACTION LEDGER */}
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-500 dark:text-blue-500 mb-6 flex items-center gap-2 print:text-black print:mt-10">
              <List size={16} /> Itemized Transaction Ledger
            </h3>

            <DataTable
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
              emptySubtitle="No approved expenses match the selected filters."
              minWidth="min-w-[800px]"
              renderRow={(txn, idx) => (
                <tr
                  key={`${txn.source_module}-${txn.source_id}-${idx}`}
                  className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors print:hover:bg-transparent"
                >
                  <td className="px-4 sm:px-8 py-4">
                    <p className="text-xs font-bold text-slate-900 dark:text-white print:text-black">
                      {new Date(txn.transaction_date).toLocaleDateString()}
                    </p>
                    <div className="mt-1.5">
                      {getSourceBadge(txn.source_module)}
                    </div>
                  </td>

                  <td className="px-4 sm:px-8 py-4">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono tracking-widest uppercase print:text-black">
                      {txn.reference_number || "N/A"}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[120px]">
                      {txn.branch_name}
                    </p>
                  </td>

                  <td className="px-4 sm:px-8 py-4">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px] print:text-black print:max-w-none print:whitespace-normal">
                      {txn.category}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase mt-1 truncate max-w-[200px] print:text-black print:max-w-none print:whitespace-normal">
                      {txn.vendor_name}
                    </p>
                  </td>

                  <td className="px-4 sm:px-8 py-4 text-right">
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-white print:text-black">
                      {parseFloat(txn.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </td>

                  <td className="px-4 sm:px-8 py-4 text-right">
                    <button
                      onClick={() =>
                        handleDrillDown(
                          txn.source_module,
                          txn.source_id,
                          txn.reference_number,
                        )
                      }
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer print:hidden"
                      title="View Source Document"
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
        title="Advanced Report Filters"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                Branch Scope
              </label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">Global (All)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                Source Origin
              </label>
              <select
                value={sourceModuleFilter}
                onChange={(e) => setSourceModuleFilter(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">All Sources</option>
                <option value="MANUAL_EXPENSE">Manual Expenses</option>
                <option value="OCR_RECEIPT">OCR Receipts</option>
                <option value="BILL">Supplier Bills</option>
                <option value="JOURNAL_ENTRY">Journal Entries</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Expense Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Expense Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.account_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Vendor / Supplier
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

      {/* Drill-Down Source Drawer */}
      <GeneralLedgerSourceDrawer
        isOpen={!!selectedSource}
        onClose={() => setSelectedSource(null)}
        source={selectedSource}
      />
    </div>
  );
};

export default ExpenseReports;
