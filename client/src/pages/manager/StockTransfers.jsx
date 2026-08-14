import React, { useState, useEffect } from "react";
import { ArrowRightLeft, Plus, Eye } from "lucide-react";
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

const StockTransfers = () => {
  const { showToast } = useApp();

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
  const ITEMS_PER_PAGE = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    sourceFilter,
    destFilter,
    categoryFilter,
    startDate,
    endDate,
  ]);

  const loadTransfers = async () => {
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
      setTransfers(response.data?.transfers || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, [
    currentPage,
    debouncedSearchQuery,
    sourceFilter,
    destFilter,
    categoryFilter,
    startDate,
    endDate,
  ]);

  const handleExecuteTransfer = async (formData) => {
    try {
      const res = await stockTransferService.executeTransfer(formData);
      showToast(res.message, "success");
      setIsTransferModalOpen(false);
      loadTransfers();
    } catch (error) {
      throw error;
    }
  };

  const resetFilters = () => {
    setSourceFilter("all");
    setDestFilter("all");
    setCategoryFilter("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Stock Transfers"
        subtitle="Inter-Branch Logistics & Reallocation"
        icon={ArrowRightLeft}
      >
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
        headers={[
          "Transfer Profile",
          "Item Snapshot",
          "Logistics Vector",
          "Quantity",
          "Asset Value",
          "Actions",
        ]}
        data={transfers}
        loading={loading}
        emptyTitle="No stock transfers found"
        renderRow={(req) => (
          <tr
            key={req.id}
            className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start gap-1">
                <span className="inline-flex px-2 py-1 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-black tracking-widest uppercase">
                  {req.transfer_reference}
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {new Date(req.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="min-w-0 max-w-[200px] sm:max-w-[250px]">
                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic uppercase truncate">
                  {req.item_name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">
                    {req.sku}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-[9px] font-medium text-slate-400">
                    {req.category}
                  </span>
                </div>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                  Out: {req.source_branch_name}
                </span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  In: {req.destination_branch_name}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-[10px] sm:text-xs font-black tracking-widest uppercase w-max">
                <ArrowRightLeft size={12} /> {req.quantity} {req.uom}
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="text-xs font-black text-slate-900 dark:text-white tracking-widest">
                ₱
                {(
                  req.quantity * parseFloat(req.recorded_unit_cost)
                ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <button
                onClick={() => {
                  setSelectedTransfer(req);
                  setIsDrawerOpen(true);
                }}
                title="View Details"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
              >
                <Eye size={14} /> Details
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

      {/* UNIVERSAL FILTER MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Origin Branch
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Origins</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Target Branch
            </label>
            <select
              value={destFilter}
              onChange={(e) => setDestFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Targets</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Inventory Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm"
            >
              <option value="">All Categories</option>
              {INVENTORY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300"
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
        transfer={selectedTransfer}
      />
    </div>
  );
};

export default StockTransfers;
