import React, { useState, useEffect } from "react";
import {
  Landmark,
  Download,
  Calendar,
  PieChart,
  List,
  Search,
  Eye,
  Loader2,
  Building2,
  TrendingDown,
  TrendingUp,
  Calculator,
  ScanText,
  FileText,
  AlertTriangle,
  Scale,
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

const TaxVATReports = () => {
  const { showToast } = useApp();
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
  const ITEMS_PER_PAGE = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    branchFilter,
    sourceModuleFilter,
    startDate,
    endDate,
  ]);

  const loadReport = async () => {
    if (!startDate || !endDate) return;
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

  const handleCustomDateChange = (field, value) => {
    setDatePreset("custom");
    if (field === "start") setStartDate(value);
    if (field === "end") setEndDate(value);
  };

  const resetFilters = () => {
    setBranchFilter("all");
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
            className="!text-purple-600 dark:!text-purple-400 !bg-purple-50 dark:!bg-purple-500/10 !border-purple-200 dark:!border-purple-500/20 print:!bg-transparent print:!border-slate-300 print:!text-black"
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
      default:
        return <span className="text-[9px] text-slate-400">{source}</span>;
    }
  };

  const handleDrillDown = (module, id, ref) => {
    let targetType = module;
    if (module === "SALES") targetType = "INVOICE";
    if (module === "BILLS") targetType = "BILL";
    if (module === "MANUAL_EXPENSE" || module === "OCR_RECEIPT")
      targetType = "EXPENSE";

    setSelectedSource({
      type: targetType,
      id: id,
      ref: ref,
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
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
          placeholder="Search Reference or Entity..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <div className="flex gap-2">
          <ActionButton
            label="Export CSV"
            icon={Download}
            onClick={() =>
              showToast("CSV export queued for reporting phase.", "info")
            }
            disabled={!data || loading}
          />
        </div>
      </PageHeader>

      {/* KPI DASHBOARD */}
      {data && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:hidden">
            <StatCard
              title="Total Taxable Sales"
              value={`₱${formatCurrency(data.kpis.total_taxable_sales)}`}
              icon={TrendingUp}
              variant="info"
            />
            <StatCard
              title={`Total Output VAT (${data.kpis.system_vat_rate}%)`}
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
              title={`Total Input VAT (${data.kpis.system_vat_rate}%)`}
              value={`₱${formatCurrency(data.kpis.total_input_vat)}`}
              icon={Scale}
              variant="default"
            />
          </div>

          {/* HERO POSITION BANNER */}
          <div
            className={`p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden transition-colors ${bannerClasses}`}
          >
            <div>
              <p
                className={`text-[10px] font-black uppercase tracking-widest mb-1 ${titleClasses}`}
              >
                Net Fiscal VAT Position
              </p>
              <h2
                className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${valueClasses}`}
              >
                ₱{formatCurrency(data.kpis.net_vat_position)}
              </h2>
            </div>
            <div className="flex flex-col items-start md:items-end w-full md:w-auto">
              <span
                className={`inline-flex px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${badgeClasses}`}
              >
                {bannerLabel}
              </span>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-left md:text-right">
                {bannerDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT BODY */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[24px] sm:rounded-[32px] shadow-sm overflow-hidden print:border-none print:shadow-none print:p-0">
        <div className="p-6 sm:p-8 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-800/50 text-center bg-slate-50 dark:bg-slate-900/50 print:bg-transparent print:border-b-2 print:border-slate-900">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
            Tax & VAT Statement
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
          {/* SECTION A: MODULE DISTRIBUTION */}
          <div className="mb-10">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 flex items-center gap-2 print:text-black">
              <PieChart size={16} className="text-amber-500" /> VAT Summary by
              Source Module
            </h3>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-amber-500" />
              </div>
            ) : !data || data.distributions.by_module.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-700 rounded-xl print:text-black print:border-slate-300">
                No VAT-applicable transactions found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {data.distributions.by_module.map((mod) => (
                  <div
                    key={mod.source_module}
                    className="relative p-5 border border-slate-100 dark:border-slate-700/50 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30"
                  >
                    <div className="flex justify-between items-start mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase print:text-black truncate pr-4">
                          {mod.source_module.replace("_", " ")}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-widest uppercase">
                          {mod.transaction_count} Transactions
                        </span>
                      </div>
                      <StatusBadge
                        label={`${mod.vat_type} VAT`}
                        variant={mod.vat_type === "OUTPUT" ? "info" : "default"}
                      />
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Taxable Base
                        </span>
                        <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300 print:text-black">
                          ₱{formatCurrency(mod.total_taxable_base)}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                          Total VAT
                        </span>
                        <span className="font-mono text-lg font-black text-slate-900 dark:text-white print:text-black">
                          ₱{formatCurrency(mod.total_vat)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION B: ITEMIZED TRANSACTION LEDGER */}
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-500 dark:text-amber-500 mb-6 flex items-center gap-2 print:text-black print:mt-10">
              <List size={16} /> Itemized VAT Ledger
            </h3>

            <DataTable
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
                  className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors print:hover:bg-transparent print:break-inside-avoid"
                >
                  <td className="px-4 sm:px-8 py-4">
                    <p className="text-xs font-bold text-slate-900 dark:text-white print:text-black">
                      {new Date(txn.transaction_date).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </p>
                    <div className="mt-1.5">
                      {getSourceBadge(txn.source_module)}
                    </div>
                  </td>

                  <td className="px-4 sm:px-8 py-4">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono tracking-widest uppercase print:text-black">
                      {txn.reference_number || "N/A"}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[120px] print:text-slate-600">
                      {txn.branch_name}
                    </p>
                  </td>

                  <td className="px-4 sm:px-8 py-4">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px] print:text-black print:max-w-none print:whitespace-normal">
                      {txn.counterparty_name}
                    </p>
                    <p
                      className={`text-[10px] font-black uppercase tracking-widest mt-1 ${txn.vat_type === "OUTPUT" ? "text-blue-500" : "text-slate-500"}`}
                    >
                      {txn.vat_type} VAT
                    </p>
                  </td>

                  <td className="px-4 sm:px-8 py-4 text-right">
                    <span className="text-sm font-medium font-mono text-slate-600 dark:text-slate-400 print:text-black">
                      {formatCurrency(txn.taxable_base)}
                    </span>
                  </td>

                  <td className="px-4 sm:px-8 py-4 text-right">
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-white print:text-black bg-slate-50 dark:bg-slate-900 print:bg-transparent print:border print:border-slate-300 px-2 py-1 rounded">
                      {formatCurrency(txn.vat_amount)}
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
        title="Report Parameters"
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
                <option value="all">Enterprise Global</option>
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
                <option value="SALES">Sales Invoices</option>
                <option value="BILLS">Supplier Bills</option>
                <option value="MANUAL_EXPENSE">Manual Expenses</option>
                <option value="OCR_RECEIPT">OCR Receipts</option>
              </select>
            </div>
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

      {/* Drill-Down Source Drawer */}
      <GeneralLedgerSourceDrawer
        isOpen={!!selectedSource}
        onClose={() => setSelectedSource(null)}
        source={selectedSource}
      />
    </div>
  );
};

export default TaxVATReports;
