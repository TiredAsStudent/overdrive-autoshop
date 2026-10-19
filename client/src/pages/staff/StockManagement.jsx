import React, { useState, useEffect, useCallback, useId } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Boxes,
  History,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { inventoryService } from "../../services/staff/inventory.service";
import StockMovementDrawer from "../../features/staff/components/StockMovementDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import PageHeader from "../../components/shared/PageHeader";
import FilterModal from "../../components/shared/FilterModal";

import SearchBar from "../../components/ui/SearchBar";
import StatusToggle from "../../components/ui/StatusToggle";
import FilterButton from "../../components/ui/FilterButton";
import StatusBadge from "../../components/ui/StatusBadge";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const CATEGORIES = [
  "all",
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

const STOCK_STATUS_OPTIONS = [
  { label: "All Items", value: "all" },
  { label: "In Stock", value: "in_stock" },
  { label: "Low Stock", value: "low_stock" },
  { label: "Out of Stock", value: "out_of_stock" },
];

const ITEMS_PER_PAGE = 10;

const StockManagement = () => {
  const { showToast } = useApp();
  const [searchParams] = useSearchParams();
  const categorySelectId = useId();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState(
    () => searchParams.get("stock_status") || "all",
  );
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const activeFilterCount = categoryFilter !== "all" ? 1 : 0;

  // Synchronize stockStatusFilter if URL query parameter changes
  useEffect(() => {
    const paramStatus = searchParams.get("stock_status") || "all";
    setStockStatusFilter((prev) => {
      if (prev !== paramStatus) {
        setCurrentPage(1);
        return paramStatus;
      }
      return prev;
    });
  }, [searchParams]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleStockStatusChange = (value) => {
    setStockStatusFilter(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventory(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        categoryFilter,
        stockStatusFilter,
      );

      const fetchedItems = response.data || [];
      const fetchedTotalPages = response.pagination?.totalPages || 1;

      if (fetchedItems.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setItems(fetchedItems);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load branch inventory items.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    categoryFilter,
    stockStatusFilter,
    showToast,
  ]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const openMovementDrawer = (id) => {
    setSelectedItemId(id);
    setIsDrawerOpen(true);
  };

  const resetFilters = () => {
    setCategoryFilter("all");
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    setIsFilterModalOpen(false);
  };

  const getStatusBadgeVariant = (status) => {
    if (status === "In Stock") return "success";
    if (status === "Low Stock") return "warning";
    return "danger";
  };

  const getStatusIcon = (status) => {
    if (status === "In Stock") return ShieldCheck;
    if (status === "Low Stock") return AlertTriangle;
    return XCircle;
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
        title="Stock Management"
        subtitle="Branch Inventory & Valuation"
        icon={Boxes}
      >
        <StatusToggle
          activeValue={stockStatusFilter}
          onToggle={handleStockStatusChange}
          ariaLabel="Filter inventory by stock status"
          options={STOCK_STATUS_OPTIONS}
        />

        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search SKU or Name..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />
      </PageHeader>

      {/* DATA TABLE */}
      <DataTable
        caption="Branch Inventory Stock and Asset Valuation Directory"
        minWidth="min-w-[860px]"
        headers={[
          "Item Profile",
          "Financials",
          "Branch Stock",
          "Asset Valuation",
          "Branch Status",
          "Actions",
        ]}
        data={items}
        loading={loading}
        emptyTitle="No branch inventory items found"
        emptySubtitle="Adjust your search or category filter, or verify your branch stock assignment."
        renderRow={(item) => {
          const quantity = parseInt(item.total_company_quantity, 10) || 0;
          const reorderPoint = parseInt(item.total_company_reorder, 10) || 0;
          const unitCost = parseFloat(item.unit_cost) || 0;
          const costValuation = quantity * unitCost;

          return (
            <tr
              key={item.id}
              className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              {/* Item Profile */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col items-start gap-1 max-w-[220px] sm:max-w-[300px]">
                  <p
                    className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic uppercase tracking-tight truncate w-full"
                    title={item.item_name}
                  >
                    {item.item_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono tabular-nums font-black text-slate-700 dark:text-slate-300 tracking-widest uppercase bg-slate-100 dark:bg-slate-900/70 px-2 py-0.5 rounded border border-slate-200/80 dark:border-white/10">
                      {item.sku}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">
                      {item.category} • {item.uom}
                    </span>
                  </div>
                </div>
              </td>

              {/* Financials (Stacked Base Cost & Selling Price) */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 w-10">
                      Cost:
                    </span>
                    <span className="text-xs font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                      ₱{formatCurrency(item.unit_cost)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 w-10">
                      Sell:
                    </span>
                    <span className="text-xs font-mono tabular-nums font-black text-emerald-700 dark:text-emerald-400">
                      ₱{formatCurrency(item.selling_price)}
                    </span>
                  </div>
                </div>
              </td>

              {/* On-Hand Stock */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col">
                  <span
                    className={`text-sm sm:text-base font-mono tabular-nums font-black ${
                      quantity <= 0
                        ? "text-rose-600 dark:text-rose-400"
                        : quantity <= reorderPoint
                          ? "text-amber-600 dark:text-overdrive-yellow"
                          : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {quantity}
                  </span>
                  <span className="text-[9px] font-mono tabular-nums font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">
                    Reorder at: {reorderPoint}
                  </span>
                </div>
              </td>

              {/* Valuation */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-mono tabular-nums font-black text-slate-900 dark:text-white">
                  ₱{formatCurrency(costValuation)}
                </span>
              </td>

              {/* Status */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <StatusBadge
                  label={item.global_stock_status || "Unknown"}
                  variant={getStatusBadgeVariant(item.global_stock_status)}
                  icon={getStatusIcon(item.global_stock_status)}
                />
              </td>

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => openMovementDrawer(item.id)}
                    title={`View Movement Ledger for ${item.sku}`}
                    aria-label={`View stock movement ledger for ${item.item_name}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <History size={16} aria-hidden="true" />
                  </button>
                </div>
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
            <label htmlFor={categorySelectId} className="form-label">
              Category Classification
            </label>
            <div className="relative">
              <select
                id={categorySelectId}
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
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
        </div>
      </FilterModal>

      {/* Movement Drawer */}
      <StockMovementDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        itemId={selectedItemId}
      />
    </div>
  );
};

export default StockManagement;
