import React, { useState, useEffect, useCallback, useId } from "react";
import {
  Landmark,
  Download,
  Calendar,
  PieChart,
  List,
  Eye,
  Loader2,
  TrendingDown,
  TrendingUp,
  Calculator,
  ScanText,
  FileText,
  Scale,
  BookOpen,
  Printer,
  ChevronDown,
} from "lucide-react";

import { taxVatReportService } from "../../services/manager/taxVatReport.service";
import { inventoryService } from "../../services/manager/inventory.service";

import PageHeader from "../../components/shared/PageHeader";
import FilterModal from "../../components/shared/FilterModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";

import SearchBar from "../../components/ui/SearchBar";
import FilterButton from "../../components/ui/FilterButton";
import ActionButton from "../../components/ui/ActionButton";
import StatCard from "../../components/ui/StatCard";
import StatusToggle from "../../components/ui/StatusToggle";
import StatusBadge from "../../components/ui/StatusBadge";

import GeneralLedgerSourceDrawer from "../../features/manager/components/GeneralLedgerSourceDrawer";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const DATE_PRESET_OPTIONS = [
  { label: "This Month", value: "this_month" },
  { label: "This Quarter", value: "this_quarter" },
  { label: "This Year", value: "this_year" },
];

const ITEMS_PER_PAGE = 10;

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

const TaxVATReports = () => {
  const { showToast } = useApp();

  // Accessible Filter Modal Control IDs
  const branchSelectId = useId();
  const sourceModuleSelectId = useId();
  const periodSelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();

  const initialDates = getPresetDates("this_month");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [datePreset, setDatePreset] = useState("this_month");
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [branchFilter, setBranchFilter] = useState("all");
  const [sourceModuleFilter, setSourceModuleFilter] = useState("all");

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedSource, setSelectedSource] = useState(null);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) +
    (sourceModuleFilter !== "all" ? 1 : 0) +
    (datePreset !== "this_month" ? 1 : 0);

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
    setSourceModuleFilter("all");
    setDatePreset("this_month");
    const { start, end } = getPresetDates("this_month");
    setStartDate(start);
    setEndDate(end);
    if (currentPage !== 1) setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const loadReport = useCallback(async () => {
    if (!startDate || !endDate) return;

    if (startDate > endDate) {
      showToast("Start date cannot be after end date.", "warning");
      return;
    }

    try {
      setLoading(true);
      const res = await taxVatReportService.getTaxVatReport(
        currentPage,
        ITEMS_PER_PAGE,
        {
          search: debouncedSearchQuery,
          branch: branchFilter,
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
        error.message || "Unable to load Tax & VAT Reports data.",
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
      case "SALES":
        return (
          <StatusBadge
            label="Sales Invoice"
            variant="info"
            icon={FileText}
            className="print:bg-transparent print:border-slate-300 print:text-black"
          />
        );
      case "BILLS":
        return (
          <StatusBadge
            label="Supplier Bill"
            variant="default"
            icon={List}
            className="!text-purple-700 dark:!text-purple-400 !bg-purple-50 dark:!bg-purple-500/10 !border-purple-200 dark:!border-purple-500/20 print:!bg-transparent print:!border-slate-300 print:!text-black"
          />
        );
      case "MANUAL_EXPENSE":
        return (
          <StatusBadge
            label="Manual Expense"
            variant="default"
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
      case "JOURNAL_ENTRY":
        return (
          <StatusBadge
            label="Journal Entry"
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
    let targetType = module;
    if (module === "SALES") targetType = "INVOICE";
    if (module === "BILLS") targetType = "BILL";
    if (module === "MANUAL_EXPENSE" || module === "OCR_RECEIPT") {
      targetType = "EXPENSE";
    }
    if (module === "JOURNAL_ENTRY") targetType = "JOURNAL_ENTRY";

    setSelectedSource({
      type: targetType,
      id,
      ref,
    });
  };

  const positionStatus = data?.kpis?.position_status;
  let bannerClasses =
    "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700";
  let titleClasses = "text-slate-600 dark:text-slate-400";
  let valueClasses = "text-slate-900 dark:text-white";
  let badgeClasses =
    "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
  let bannerLabel = "Zero VAT Position";
  let bannerDesc =
    "Tax obligations and credits are perfectly balanced or zero for this period.";

  if (positionStatus === "NET_VAT_PAYABLE") {
    bannerClasses =
      "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20";
    titleClasses = "text-rose-600 dark:text-rose-400";
    valueClasses = "text-rose-700 dark:text-rose-300";
    badgeClasses =
      "bg-rose-200 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300";
    bannerLabel = "Net VAT Payable (Liability)";
    bannerDesc =
      "Output tax exceeds input tax. You are liable to remit this balance to the tax authority.";
  } else if (positionStatus === "NET_VAT_CREDIT") {
    bannerClasses =
      "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
    titleClasses = "text-emerald-600 dark:text-emerald-400";
    valueClasses = "text-emerald-700 dark:text-emerald-300";
    badgeClasses =
      "bg-emerald-200 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300";
    bannerLabel = "Net VAT Credit (Asset)";
    bannerDesc =
      "Input tax exceeds output tax. This balance can be carried over as an asset to future periods.";
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* PAGE HEADER */}
      <PageHeader
        title="Tax & VAT Reports"
        subtitle="Statutory Output & Input Tax Aggregation"
        icon={Landmark}
      >
        <div className="hidden lg:block">
          <StatusToggle
            activeValue={datePreset}
            onToggle={handlePresetChange}
            ariaLabel="Select tax and VAT reporting period preset"
            options={DATE_PRESET_OPTIONS}
          />
        </div>

        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Reference or Entity..."
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

      {/* KPI DASHBOARD */}
      {data?.kpis && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:hidden">
            <StatCard
              title="Total Taxable Sales"
              value={`₱${formatCurrency(data.kpis.total_taxable_sales)}`}
              icon={TrendingUp}
              variant="info"
            />
            <StatCard
              title={`Total Output VAT (${data.kpis.system_vat_rate ?? 12}%)`}
              value={`₱${formatCurrency(data.kpis.total_output_vat)}`}
              icon={Calculator}
              variant="default"
            />
            <StatCard
              title="Total Taxable Purchases"
              value={`₱${formatCurrency(data.kpis.total_taxable_purchases)}`}
              icon={TrendingDown}
              variant="warning"
            />
            <StatCard
              title={`Total Input VAT (${data.kpis.system_vat_rate ?? 12}%)`}
              value={`₱${formatCurrency(data.kpis.total_input_vat)}`}
              icon={Scale}
              variant="default"
            />
          </div>

          {/* HERO POSITION BANNER */}
          <div
            className={`p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden transition-colors ${bannerClasses}`}
          >
            <div className="min-w-0">
              <p
                className={`text-[10px] font-black uppercase tracking-widest mb-1 ${titleClasses}`}
              >
                Net Fiscal VAT Position
              </p>
              <p
                className={`text-3xl sm:text-4xl font-black font-mono tabular-nums tracking-tight truncate ${valueClasses}`}
              >
                ₱{formatCurrency(data.kpis.net_vat_position)}
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end w-full md:w-auto">
              <span
                className={`inline-flex px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${badgeClasses}`}
              >
                {bannerLabel}
              </span>
              <p className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 mt-2 max-w-sm text-left md:text-right leading-relaxed">
                {bannerDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT BODY */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-[32px] shadow-xs overflow-hidden print:border-none print:shadow-none print:p-0">
        <div className="relative p-6 sm:p-8 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-700/50 text-center bg-slate-50/70 dark:bg-slate-900/50 print:bg-transparent print:border-b-2 print:border-slate-900">
          <div className="absolute right-8 top-8 hidden print:block">
            <Printer size={24} aria-hidden="true" className="text-slate-900" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
            Tax & VAT Statement
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
          {/* SECTION A: MODULE DISTRIBUTION */}
          <section className="mb-10">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 flex items-center gap-2 print:text-black">
              <PieChart
                size={16}
                aria-hidden="true"
                className="text-amber-500 dark:text-overdrive-yellow"
              />
              <span>VAT Summary by Source Module</span>
            </h3>

            {loading ? (
              <div
                role="status"
                aria-live="polite"
                className="flex justify-center py-10"
              >
                <Loader2
                  aria-hidden="true"
                  className="w-6 h-6 animate-spin text-amber-500"
                />
              </div>
            ) : !Array.isArray(data?.distributions?.by_module) ||
              data.distributions.by_module.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-700 rounded-xl print:text-black print:border-slate-300">
                No VAT-applicable transactions found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {data.distributions.by_module.map((mod) => (
                  <div
                    key={mod.source_module}
                    className="relative p-5 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40"
                  >
                    <div className="flex justify-between items-start gap-4 mb-4 border-b border-slate-200/80 dark:border-slate-700 pb-3">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase print:text-black truncate"
                          title={(mod.source_module || "").replace(/_/g, " ")}
                        >
                          {(mod.source_module || "").replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mt-0.5 tracking-widest uppercase">
                          {mod.transaction_count} Transactions
                        </span>
                      </div>
                      <StatusBadge
                        label={`${mod.vat_type} VAT`}
                        variant={mod.vat_type === "OUTPUT" ? "info" : "default"}
                      />
                    </div>

                    <div className="flex justify-between items-end gap-4 mt-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Taxable Base
                        </span>
                        <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 print:text-black mt-0.5">
                          ₱{formatCurrency(mod.total_taxable_base)}
                        </span>
                      </div>
                      <div className="flex flex-col text-right shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                          Total VAT
                        </span>
                        <span className="font-mono tabular-nums text-base sm:text-lg font-black text-slate-900 dark:text-white print:text-black mt-0.5">
                          ₱{formatCurrency(mod.total_vat)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION B: ITEMIZED TRANSACTION LEDGER */}
          <section>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-6 flex items-center gap-2 print:text-black print:mt-10">
              <List size={16} aria-hidden="true" />
              <span>Itemized VAT Ledger</span>
            </h3>

            <DataTable
              caption="Itemized Tax and VAT Transactions Ledger"
              headers={[
                "Date & Source",
                "Reference",
                "Counterparty",
                "Taxable Base (₱)",
                "VAT Amount (₱)",
                "Action",
              ]}
              data={data?.transactions || []}
              loading={loading}
              emptyTitle="No transactions found"
              emptySubtitle="No transactions match the selected filters."
              minWidth="min-w-[900px]"
              renderRow={(txn, idx) => (
                <tr
                  key={`${txn.source_module}-${txn.source_id}-${idx}`}
                  className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0 print:hover:bg-transparent print:break-inside-avoid"
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
                      className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[140px] print:text-slate-600"
                      title={txn.branch_name}
                    >
                      {txn.branch_name || "Enterprise Global"}
                    </p>
                  </td>

                  {/* Counterparty */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <p
                      className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[220px] print:text-black print:max-w-none print:whitespace-normal"
                      title={txn.counterparty_name}
                    >
                      {txn.counterparty_name}
                    </p>
                    <p
                      className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                        txn.vat_type === "OUTPUT"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {txn.vat_type} VAT
                    </p>
                  </td>

                  {/* Taxable Base */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                    <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-slate-600 dark:text-slate-300 print:text-black">
                      ₱{formatCurrency(txn.taxable_base)}
                    </span>
                  </td>

                  {/* VAT Amount */}
                  <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                    <span className="inline-flex text-xs sm:text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white print:text-black bg-slate-100 dark:bg-slate-900/70 border border-slate-200/70 dark:border-white/10 print:bg-transparent print:border-slate-300 px-2.5 py-1 rounded-md">
                      ₱{formatCurrency(txn.vat_amount)}
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
                      title={`View Source Document (${txn.reference_number || txn.counterparty_name})`}
                      aria-label={`View source document for ${txn.reference_number || txn.counterparty_name}`}
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
                  <option value="all">Enterprise Global</option>
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
                  <option value="SALES">Sales Invoices</option>
                  <option value="BILLS">Supplier Bills</option>
                  <option value="MANUAL_EXPENSE">Manual Expenses</option>
                  <option value="OCR_RECEIPT">OCR Receipts</option>
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

export default TaxVATReports;
