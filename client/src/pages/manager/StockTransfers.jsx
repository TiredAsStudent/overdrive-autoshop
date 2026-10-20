import React, { useState, useEffect, useCallback, useId } from "react";
import { ArrowRightLeft, Plus, Eye, Layers, ChevronDown } from "lucide-react";
import { stockTransferService } from "../../services/manager/stockTransfer.service";
import { inventoryService } from "../../services/manager/inventory.service";

// Components
import TransferModal from "../../features/manager/components/TransferModal";
import TransferDrawer from "../../features/manager/components/TransferDrawer";

// Universal UI Components
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import FilterButton from "../../components/ui/FilterButton";
import ActionButton from "../../components/ui/ActionButton";
import FilterModal from "../../components/shared/FilterModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";

// Hooks & Context
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const INVENTORY_CATEGORIES = [
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

const ITEMS_PER_PAGE = 10;

const StockTransfers = () => {
  const { showToast } = useApp();

  // Accessible Filter IDs
  const sourceBranchSelectId = useId();
  const destBranchSelectId = useId();
  const categorySelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();

  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [destFilter, setDestFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Drawers
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const activeFilterCount =
    (sourceFilter !== "all" ? 1 : 0) +
    (destFilter !== "all" ? 1 : 0) +
    (categoryFilter ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch((err) => console.error("Failed to load branches", err));
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleSourceFilterChange = (value) => {
    setSourceFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleDestFilterChange = (value) => {
    setDestFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleCategoryFilterChange = (value) => {
    setCategoryFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleDateFilterChange = (field, value) => {
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
    setSourceFilter("all");
    setDestFilter("all");
    setCategoryFilter("");
    setStartDate("");
    setEndDate("");
    if (currentPage !== 1) setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const loadTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await stockTransferService.getTransfers(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        sourceFilter,
        destFilter,
        categoryFilter || "all",
        startDate,
        endDate,
      );

      const fetchedTransfers = response.data?.transfers || [];
      const fetchedTotalPages = response.data?.pagination?.totalPages || 1;

      if (fetchedTransfers.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setTransfers(fetchedTransfers);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load stock transfer records.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    sourceFilter,
    destFilter,
    categoryFilter,
    startDate,
    endDate,
    showToast,
  ]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  const handleExecuteTransfer = async (formData) => {
    const res = await stockTransferService.executeTransfer(formData);
    showToast(res.message, "success");
    setIsTransferModalOpen(false);
    loadTransfers();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Stock Transfers"
        subtitle="Inter-Branch Logistics & Reallocation"
        icon={ArrowRightLeft}
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Ref or SKU..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <ActionButton
          onClick={() => setIsTransferModalOpen(true)}
          label="Initiate Transfer"
          icon={Plus}
        />
      </PageHeader>

      {/* DATA TABLE */}
      <DataTable
        caption="Inter-Branch Stock Transfers and Logistics Ledger"
        minWidth="min-w-[820px]"
        headers={[
          "Transfer Profile",
          "Logistics Vector",
          "Composition",
          "Asset Value",
          "Actions",
        ]}
        data={transfers}
        loading={loading}
        emptyTitle="No stock transfers found"
        emptySubtitle="Try adjusting your search or filter criteria, or initiate a new inter-branch stock transfer."
        renderRow={(req) => {
          const itemCount = parseInt(req.total_items, 10) || 0;
          const unitCount = parseInt(req.total_quantity, 10) || 0;

          return (
            <tr
              key={req.id}
              className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              {/* Transfer Profile */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-xs font-mono tabular-nums font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    {req.transfer_reference}
                  </span>
                  <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                    {formatDate(req.created_at)}
                  </span>
                </div>
              </td>

              {/* Logistics Vector */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                    Out: {req.source_branch_name}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    In: {req.destination_branch_name}
                  </span>
                </div>
              </td>

              {/* Composition */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-700/80 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600 text-[10px] font-mono tabular-nums font-black tracking-widest uppercase w-max">
                    <Layers size={12} aria-hidden="true" />
                    <span>
                      {itemCount} {itemCount === 1 ? "Item" : "Items"}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    Total Units: {unitCount.toLocaleString()}
                  </p>
                </div>
              </td>

              {/* Asset Value */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-mono tabular-nums font-black text-slate-900 dark:text-white tracking-tight">
                  ₱{formatCurrency(req.total_asset_value)}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTransfer(req);
                    setIsDrawerOpen(true);
                  }}
                  title={`View Manifest for ${req.transfer_reference}`}
                  aria-label={`View transfer manifest details for ${req.transfer_reference}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                >
                  <Eye size={14} aria-hidden="true" />
                  <span>Details</span>
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

      {/* UNIVERSAL FILTER MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor={sourceBranchSelectId} className="form-label">
              Origin Branch
            </label>
            <div className="relative">
              <select
                id={sourceBranchSelectId}
                value={sourceFilter}
                onChange={(e) => handleSourceFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Origins</option>
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
            <label htmlFor={destBranchSelectId} className="form-label">
              Target Branch
            </label>
            <div className="relative">
              <select
                id={destBranchSelectId}
                value={destFilter}
                onChange={(e) => handleDestFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Targets</option>
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
              Inventory Category
            </label>
            <div className="relative">
              <select
                id={categorySelectId}
                value={categoryFilter}
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="">All Categories</option>
                {INVENTORY_CATEGORIES.map((cat) => (
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

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
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
                  handleDateFilterChange("start", e.target.value)
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
                onChange={(e) => handleDateFilterChange("end", e.target.value)}
                className="form-input font-mono tabular-nums cursor-pointer"
              />
            </div>
          </div>
        </div>
      </FilterModal>

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSubmit={handleExecuteTransfer}
        branches={branches}
      />

      <TransferDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        transferId={selectedTransfer?.id}
      />
    </div>
  );
};

export default StockTransfers;
