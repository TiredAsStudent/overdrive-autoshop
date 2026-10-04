import React, { useState, useEffect } from "react";
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
  Search,
  Eye,
  Calculator,
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

const InventoryReports = () => {
  const { showToast } = useApp();

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
  const ITEMS_PER_PAGE = 10;

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
      .catch((err) => console.error("Failed to fetch branches", err));
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    branchFilter,
    categoryFilter,
    stockStatusFilter,
    startDate,
    endDate,
  ]);

  // Load Report Data
  const loadReport = async () => {
    if (!startDate || !endDate) return;

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
    stockStatusFilter,
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
    setCategoryFilter("all");
    setStockStatusFilter("all");
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

  const getStatusBadgeOptions = (status) => {
    switch (status) {
      case "IN_STOCK":
        return { label: "In Stock", variant: "success", icon: CheckCircle2 };
      case "LOW_STOCK":
        return { label: "Low Stock", variant: "warning", icon: AlertTriangle };
      case "OUT_OF_STOCK":
        return { label: "Out of Stock", variant: "danger", icon: XCircle };
      default:
        return { label: status, variant: "default", icon: Package };
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
        title="Inventory Reports"
        subtitle="Stock Valuation, Movement Velocity & Asset Analytics"
        icon={Boxes}
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
          placeholder="Search Item Name or SKU..."
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
              showToast("Excel export queued for reporting phase.", "info")
            }
            disabled={!data || loading}
          />
        </div>
      </PageHeader>

      {/* EXECUTIVE KPI DASHBOARD (Hidden in Print) */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:hidden">
          <StatCard
            title="Total Inventory Asset Value"
            value={`₱${formatCurrency(data.kpis.total_asset_value)}`}
            icon={Calculator}
            variant="success"
          />
          <StatCard
            title="Total Stock Units On Hand"
            value={data.kpis.total_physical_units}
            icon={Boxes}
            variant="info"
          />
          <StatCard
            title="Active Tracked SKUs"
            value={data.kpis.total_tracked_items}
            icon={Package}
            variant="default"
          />
          <StatCard
            title="Reorder / Low Stock Alerts"
            value={data.kpis.low_stock_count}
            icon={AlertTriangle}
            variant={data.kpis.low_stock_count > 0 ? "danger" : "default"}
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
            Inventory Valuation & Audit Report
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
            {/* 1. Valuation by Branch (Snapshot) */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-500 mb-6 flex items-center gap-2 print:text-black">
                <Building2 size={16} /> Asset Valuation by Branch
              </h3>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-emerald-500" />
                </div>
              ) : !data || data.distributions.by_branch.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  No branch data available.
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
                            {b.total_units} Units across {b.active_skus} SKUs
                          </span>
                        </div>
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                          ₱{formatCurrency(b.asset_value)}
                        </span>
                      </div>
                      {renderProgressBar(
                        b.asset_value,
                        data.kpis.total_asset_value,
                        "bg-emerald-500",
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Stock Movement Velocity (Range-Bound) */}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-500 dark:text-blue-500 mb-6 flex items-center gap-2 print:text-black">
                <Activity size={16} /> Stock Movement Velocity
              </h3>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-blue-500" />
                </div>
              ) : !data ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  No movement data.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl border bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <ArrowDownRight
                        size={16}
                        className="text-emerald-500 shrink-0"
                      />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                        Stock Received (Bills)
                      </span>
                    </div>
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                      +{data.distributions.movements.stock_received} Units
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl border bg-rose-50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20">
                    <div className="flex items-center gap-3">
                      <ArrowUpRight
                        size={16}
                        className="text-rose-500 shrink-0"
                      />
                      <span className="text-xs font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400">
                        Stock Issued (Sales/Jobs)
                      </span>
                    </div>
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                      -{data.distributions.movements.stock_issued} Units
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 sm:p-4 rounded-xl border bg-amber-50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/20">
                    <div className="flex items-center gap-3">
                      <Calculator
                        size={16}
                        className="text-amber-500 shrink-0"
                      />
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                        Manual Adjustments (Net)
                      </span>
                    </div>
                    <span
                      className={`font-mono text-sm font-black print:text-black ${
                        data.distributions.movements.stock_adjustments_net > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : data.distributions.movements.stock_adjustments_net <
                              0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {data.distributions.movements.stock_adjustments_net > 0
                        ? "+"
                        : ""}
                      {data.distributions.movements.stock_adjustments_net} Units
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <ArrowRightLeft size={10} className="text-blue-500" />{" "}
                        Transferred In
                      </span>
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                        +{data.distributions.movements.stock_transferred_in}{" "}
                        Units
                      </span>
                    </div>
                    <div className="flex flex-col p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <ArrowRightLeft size={10} className="text-purple-500" />{" "}
                        Transferred Out
                      </span>
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-white print:text-black">
                        -{data.distributions.movements.stock_transferred_out}{" "}
                        Units
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ITEMIZED INVENTORY VALUATION LEDGER */}
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 flex items-center gap-2 print:text-black print:mt-10 border-t border-slate-200 dark:border-slate-700 pt-8">
              <Boxes size={16} className="text-amber-500" /> Itemized Valuation
              Ledger
            </h3>

            <DataTable
              headers={[
                "Item Profile",
                "Category / Branch",
                "Available Qty & UOM",
                "Unit Cost (₱)",
                "Total Valuation (₱)",
                "Status",
                "Action",
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
                    key={`${item.item_id}-${item.branch_name}`}
                    className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors print:hover:bg-transparent"
                  >
                    <td className="px-4 sm:px-8 py-4">
                      <div className="min-w-0 max-w-[200px] sm:max-w-[250px]">
                        <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic uppercase truncate print:text-black print:max-w-none print:whitespace-normal">
                          {item.item_name}
                        </p>
                        <span className="inline-flex mt-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-800 dark:text-slate-300 font-mono tracking-wider print:bg-transparent print:border print:border-slate-400 print:text-black">
                          {item.sku}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 sm:px-8 py-4">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1 truncate max-w-[150px]">
                        {item.category}
                      </p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase truncate max-w-[150px] print:text-black flex items-center gap-1.5 mt-1">
                        <Building2 size={12} className="shrink-0" />{" "}
                        {item.branch_name}
                      </p>
                    </td>

                    <td className="px-4 sm:px-8 py-4 text-center">
                      <span className="text-sm font-black text-slate-900 dark:text-white print:text-black">
                        {item.quantity}{" "}
                        <span className="text-[10px] opacity-70 ml-1">
                          {item.uom}
                        </span>
                      </span>
                    </td>

                    <td className="px-4 sm:px-8 py-4 text-right">
                      <span className="text-sm font-bold font-mono text-slate-600 dark:text-slate-400 print:text-black">
                        {formatCurrency(item.unit_cost)}
                      </span>
                    </td>

                    <td className="px-4 sm:px-8 py-4 text-right">
                      <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 print:text-black">
                        {formatCurrency(item.total_valuation)}
                      </span>
                    </td>

                    <td className="px-4 sm:px-8 py-4">
                      <StatusBadge
                        label={badgeOpts.label}
                        variant={badgeOpts.variant}
                        icon={badgeOpts.icon}
                      />
                    </td>

                    <td className="px-4 sm:px-8 py-4 text-right">
                      <button
                        onClick={() => openDetails(item)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer print:hidden"
                        title="Inspect Movement History"
                      >
                        <Eye size={16} />
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
              Item Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Stock Status (Snapshot)
            </label>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {STOCK_STATUSES.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Velocity Reporting Period
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
            <p className="text-[9px] text-slate-400 mt-2 font-medium">
              * Note: The date range only affects the "Stock Movement Velocity"
              metric. Valuations and ledger balances reflect current snapshot
              data.
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
