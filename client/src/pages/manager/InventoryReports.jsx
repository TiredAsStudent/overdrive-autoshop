import React, { useState, useEffect, useCallback, useId } from "react";
import {
  Boxes,
  Download,
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Printer,
  Package,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Eye,
  Calculator,
  ChevronDown,
} from "lucide-react";

// Services
import { inventoryReportService } from "../../services/manager/inventoryReport.service";
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

// Existing Drill-Down Modal
import StockDetailsModal from "../../features/manager/components/StockDetailsModal";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

// Static Lookups
const CATEGORIES = [
  "Fluids",
  "Filters",
  "Brakes",
  "Engine Parts",
  "Transmission",
  "Suspension",
  "Electrical",
  "Air Conditioning",
  "Tires",
  "Consumables",
];

const STOCK_STATUSES = [
  { id: "IN_STOCK", label: "In Stock" },
  { id: "LOW_STOCK", label: "Low Stock" },
  { id: "OUT_OF_STOCK", label: "Out of Stock" },
];

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

const InventoryReports = () => {
  const { showToast } = useApp();

  // Accessible Filter Modal Control IDs
  const branchSelectId = useId();
  const categorySelectId = useId();
  const stockStatusSelectId = useId();
  const periodSelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();

  const initialDates = getPresetDates("this_month");

  // Report State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [datePreset, setDatePreset] = useState("this_month");
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [branchFilter, setBranchFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Drill-Down States
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (stockStatusFilter !== "all" ? 1 : 0) +
    (datePreset !== "this_month" ? 1 : 0);

  // Initial Load: Branches
  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch((err) => {
        console.error("Failed to fetch branches", err);
        showToast("Failed to load branches.", "error");
      });
  }, [showToast]);

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
    setStockStatusFilter("all");
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

    if (startDate > endDate) {
      showToast("Start date cannot be after end date.", "warning");
      return;
    }

    try {
      setLoading(true);
      const res = await inventoryReportService.getInventoryReport(
        currentPage,
        ITEMS_PER_PAGE,
        {
          search: debouncedSearchQuery,
          branch: branchFilter,
          category: categoryFilter,
          stock_status: stockStatusFilter,
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
        error.message || "Unable to load Inventory Reports data.",
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
    stockStatusFilter,
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

  const getStatusBadgeOptions = (status) => {
    switch (status) {
      case "IN_STOCK":
        return { label: "In Stock", variant: "success", icon: CheckCircle2 };
      case "LOW_STOCK":
        return { label: "Low Stock", variant: "warning", icon: AlertTriangle };
      case "OUT_OF_STOCK":
        return { label: "Out of Stock", variant: "danger", icon: XCircle };
      default:
        return {
          label: (status || "Unknown").replace(/_/g, " "),
          variant: "default",
          icon: Package,
        };
    }
  };

  const openDetails = (item) => {
    // Transform ledger row to match what StockDetailsModal expects
    setSelectedItem({
      id: item.item_id,
      sku: item.sku,
      item_name: item.item_name,
      category: item.category,
      uom: item.uom,
    });
    setIsDetailsOpen(true);
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

  const adjustmentsNet =
    parseFloat(data?.distributions?.movements?.stock_adjustments_net) || 0;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* PAGE HEADER & CONTROLS */}
      <PageHeader
        title="Inventory Reports"
        subtitle="Stock Valuation, Movement Velocity & Asset Analytics"
        icon={Boxes}
      >
        <div className="hidden lg:block">
          <StatusToggle
            activeValue={datePreset}
            onToggle={handlePresetChange}
            ariaLabel="Select inventory movement velocity period preset"
            options={DATE_PRESET_OPTIONS}
          />
        </div>

        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Item Name or SKU..."
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
            showToast("Excel export queued for reporting phase.", "info")
          }
          disabled={!data || loading}
        />
      </PageHeader>

      {/* EXECUTIVE KPI DASHBOARD (Hidden in Print) */}
      {data?.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:hidden">
          <StatCard
            title="Total Inventory Asset Value"
            value={`₱${formatCurrency(data.kpis.total_asset_value)}`}
            icon={Calculator}
            variant="success"
          />
          <StatCard
            title="Total Stock Units On Hand"
            value={(data.kpis.total_physical_units || 0).toLocaleString()}
            icon={Boxes}
            variant="info"
          />
          <StatCard
            title="Active Tracked SKUs"
            value={(data.kpis.total_tracked_items || 0).toLocaleString()}
            icon={Package}
            variant="default"
          />
          <StatCard
            title="Reorder / Low Stock Alerts"
            value={(data.kpis.low_stock_count || 0).toLocaleString()}
            icon={AlertTriangle}
            variant={data.kpis.low_stock_count > 0 ? "danger" : "default"}
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
            Inventory Valuation & Audit Report
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
            {/* 1. Valuation by Branch (Snapshot) */}
            <section>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-6 flex items-center gap-2 print:text-black">
                <Building2 size={16} aria-hidden="true" />
                <span>Asset Valuation by Branch</span>
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
                  No branch data available.
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
                            {(b.total_units || 0).toLocaleString()} Units across{" "}
                            {(b.active_skus || 0).toLocaleString()} SKUs
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black shrink-0">
                          ₱{formatCurrency(b.asset_value)}
                        </span>
                      </div>
                      {renderProgressBar(
                        b.asset_value,
                        data.kpis?.total_asset_value || 0,
                        "bg-emerald-500",
                        `${b.branch_name} asset valuation share`,
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 2. Stock Movement Velocity (Range-Bound) */}
            <section>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-6 flex items-center gap-2 print:text-black">
                <Activity size={16} aria-hidden="true" />
                <span>Stock Movement Velocity</span>
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
              ) : !data ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                  No movement data.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center gap-4 p-3 sm:p-4 rounded-xl border bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200/80 dark:border-emerald-500/20">
                    <div className="flex items-center gap-3 min-w-0">
                      <ArrowDownRight
                        size={16}
                        aria-hidden="true"
                        className="text-emerald-600 dark:text-emerald-400 shrink-0"
                      />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 truncate">
                        Stock Received (Bills)
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black shrink-0">
                      +
                      {(
                        data.distributions?.movements?.stock_received || 0
                      ).toLocaleString()}{" "}
                      Units
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-4 p-3 sm:p-4 rounded-xl border bg-rose-50 dark:bg-rose-500/5 border-rose-200/80 dark:border-rose-500/20">
                    <div className="flex items-center gap-3 min-w-0">
                      <ArrowUpRight
                        size={16}
                        aria-hidden="true"
                        className="text-rose-600 dark:text-rose-400 shrink-0"
                      />
                      <span className="text-xs font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400 truncate">
                        Stock Issued (Sales/Jobs)
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black shrink-0">
                      -
                      {(
                        data.distributions?.movements?.stock_issued || 0
                      ).toLocaleString()}{" "}
                      Units
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-4 p-3 sm:p-4 rounded-xl border bg-amber-50 dark:bg-amber-500/5 border-amber-200/80 dark:border-amber-500/20">
                    <div className="flex items-center gap-3 min-w-0">
                      <Calculator
                        size={16}
                        aria-hidden="true"
                        className="text-amber-600 dark:text-amber-400 shrink-0"
                      />
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 truncate">
                        Manual Adjustments (Net)
                      </span>
                    </div>
                    <span
                      className={`font-mono tabular-nums text-xs sm:text-sm font-black shrink-0 print:text-black ${
                        adjustmentsNet > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : adjustmentsNet < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {adjustmentsNet > 0 ? "+" : ""}
                      {adjustmentsNet.toLocaleString()} Units
                    </span>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <div className="flex flex-col p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <ArrowRightLeft
                          size={12}
                          aria-hidden="true"
                          className="text-blue-500 shrink-0"
                        />
                        <span>Transferred In</span>
                      </span>
                      <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black">
                        +
                        {(
                          data.distributions?.movements?.stock_transferred_in ||
                          0
                        ).toLocaleString()}{" "}
                        Units
                      </span>
                    </div>
                    <div className="flex flex-col p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <ArrowRightLeft
                          size={12}
                          aria-hidden="true"
                          className="text-purple-500 shrink-0"
                        />
                        <span>Transferred Out</span>
                      </span>
                      <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-slate-900 dark:text-white print:text-black">
                        -
                        {(
                          data.distributions?.movements
                            ?.stock_transferred_out || 0
                        ).toLocaleString()}{" "}
                        Units
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ITEMIZED INVENTORY VALUATION LEDGER */}
          <section>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 flex items-center gap-2 print:text-black print:mt-10 border-t border-slate-200 dark:border-slate-700 pt-8">
              <Boxes
                size={16}
                aria-hidden="true"
                className="text-amber-500 dark:text-overdrive-yellow"
              />
              <span>Itemized Valuation Ledger</span>
            </h3>

            <DataTable
              caption="Itemized Inventory Valuation and Stock Status Ledger"
              headers={[
                "Item Details",
                "Category / Branch",
                "Available Qty & UOM",
                "Unit Cost (₱)",
                "Total Valuation (₱)",
                "Status",
                "Actions",
              ]}
              data={data?.ledger || []}
              loading={loading}
              emptyTitle="No inventory items found"
              emptySubtitle="Try adjusting the filters to broaden your search."
              minWidth="min-w-[1000px]"
              renderRow={(item, idx) => {
                const badgeOpts = getStatusBadgeOptions(item.stock_status);
                return (
                  <tr
                    key={`${item.item_id}-${item.branch_name || idx}`}
                    className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0 print:hover:bg-transparent"
                  >
                    {/* Item Details */}
                    <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                      <div className="min-w-0 max-w-[200px] sm:max-w-[250px]">
                        <p
                          className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic uppercase truncate print:text-black print:max-w-none print:whitespace-normal"
                          title={item.item_name}
                        >
                          {item.item_name}
                        </p>
                        <span className="inline-flex mt-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900/70 text-[10px] font-black text-slate-800 dark:text-slate-200 font-mono tabular-nums tracking-wider border border-slate-200/70 dark:border-white/10 print:bg-transparent print:border-slate-400 print:text-black">
                          {item.sku}
                        </span>
                      </div>
                    </td>

                    {/* Category / Branch */}
                    <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                      <p
                        className="text-[10px] font-bold text-amber-600 dark:text-overdrive-yellow uppercase tracking-widest truncate max-w-[160px]"
                        title={item.category}
                      >
                        {item.category}
                      </p>
                      <p
                        className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase truncate max-w-[160px] print:text-black flex items-center gap-1.5 mt-1"
                        title={item.branch_name}
                      >
                        <Building2
                          size={12}
                          aria-hidden="true"
                          className="shrink-0 text-slate-400"
                        />
                        <span className="truncate">{item.branch_name}</span>
                      </p>
                    </td>

                    {/* Available Qty & UOM */}
                    <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white print:text-black">
                        {(item.quantity || 0).toLocaleString()}{" "}
                        <span className="text-[10px] font-sans font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">
                          {item.uom}
                        </span>
                      </span>
                    </td>

                    {/* Unit Cost */}
                    <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-slate-600 dark:text-slate-300 print:text-black">
                        ₱{formatCurrency(item.unit_cost)}
                      </span>
                    </td>

                    {/* Total Valuation */}
                    <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 print:text-black">
                        ₱{formatCurrency(item.total_valuation)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                      <StatusBadge
                        label={badgeOpts.label}
                        variant={badgeOpts.variant}
                        icon={badgeOpts.icon}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openDetails(item)}
                        className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer print:hidden"
                        title={`View Details & Ledger (${item.item_name})`}
                        aria-label={`View stock details and movement ledger for ${item.item_name}`}
                      >
                        <Eye size={16} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              }}
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
            <label htmlFor={categorySelectId} className="form-label">
              Item Category
            </label>
            <div className="relative">
              <select
                id={categorySelectId}
                value={categoryFilter}
                onChange={handleFilterSelectChange(setCategoryFilter)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
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
            <label htmlFor={stockStatusSelectId} className="form-label">
              Stock Status (Snapshot)
            </label>
            <div className="relative">
              <select
                id={stockStatusSelectId}
                value={stockStatusFilter}
                onChange={handleFilterSelectChange(setStockStatusFilter)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {STOCK_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
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
              Velocity Reporting Period
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
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2.5 font-medium leading-relaxed">
              * Note: The date range only affects the &ldquo;Stock Movement
              Velocity&rdquo; metric. Valuations and ledger balances reflect
              current snapshot data.
            </p>
          </div>
        </div>
      </FilterModal>

      {/* Drill-Down Audit Drawer */}
      <StockDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        item={selectedItem}
      />
    </div>
  );
};

export default InventoryReports;
