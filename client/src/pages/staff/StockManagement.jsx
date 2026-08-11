import React, { useState, useEffect } from "react";
import {
  Boxes,
  History,
  AlertTriangle,
  XCircle,
  ShieldCheck,
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

const StockManagement = () => {
  const { showToast } = useApp();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const activeFilterCount = categoryFilter !== "all" ? 1 : 0;

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, categoryFilter, stockStatusFilter]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventory(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        categoryFilter,
        stockStatusFilter,
      );
      setItems(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [currentPage, debouncedSearchQuery, categoryFilter, stockStatusFilter]);

  const openMovementDrawer = (id) => {
    setSelectedItemId(id);
    setIsDrawerOpen(true);
  };

  const resetFilters = () => {
    setCategoryFilter("all");
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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Stock Management"
        subtitle="Branch Inventory & Valuation"
        icon={Boxes}
      >
        <StatusToggle
          activeValue={stockStatusFilter}
          onToggle={setStockStatusFilter}
          options={[
            { label: "All Items", value: "all" },
            { label: "In Stock", value: "in_stock" },
            { label: "Low Stock", value: "low_stock" },
            { label: "Out of Stock", value: "out_of_stock" },
          ]}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search SKU or Name..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />
      </PageHeader>

      {/* DATA TABLE */}
      <DataTable
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
        emptySubtitle="Adjust filters or check your branch assignment connection."
        renderRow={(item) => {
          const quantity = parseInt(item.total_company_quantity) || 0;
          const reorderPoint = parseInt(item.total_company_reorder) || 0;
          const costValuation = quantity * parseFloat(item.unit_cost);

          return (
            <tr
              key={item.id}
              className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
            >
              {/* Item Profile */}
              <td className="px-4 sm:px-8 py-4 sm:py-5">
                <div className="flex flex-col items-start gap-1 max-w-[200px] sm:max-w-[300px]">
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic uppercase truncate w-full">
                    {item.item_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 tracking-[0.1em] uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                      {item.sku}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      {item.category} • {item.uom}
                    </span>
                  </div>
                </div>
              </td>

              {/* Financials (Stacked Base Cost & Selling Price) */}
              <td className="px-4 sm:px-8 py-4 sm:py-5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-10">
                      Cost:
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                      ₱
                      {parseFloat(item.unit_cost).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 w-10">
                      Sell:
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400">
                      ₱
                      {parseFloat(item.selling_price).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                </div>
              </td>

              {/* On-Hand Stock */}
              <td className="px-4 sm:px-8 py-4 sm:py-5">
                <div className="flex flex-col">
                  <span
                    className={`text-base font-black ${
                      quantity <= 0
                        ? "text-red-500"
                        : quantity <= reorderPoint
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }`}
                  >
                    {quantity}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                    Reorder at: {reorderPoint}
                  </span>
                </div>
              </td>

              {/* Valuation */}
              <td className="px-4 sm:px-8 py-4 sm:py-5">
                <span className="text-sm font-mono font-black text-slate-900 dark:text-white">
                  ₱
                  {costValuation.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </td>

              {/* Status */}
              <td className="px-4 sm:px-8 py-4 sm:py-5">
                <StatusBadge
                  label={item.global_stock_status}
                  variant={getStatusBadgeVariant(item.global_stock_status)}
                  icon={getStatusIcon(item.global_stock_status)}
                />
              </td>

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
                <div className="flex items-center justify-end gap-1 sm:gap-2">
                  <button
                    onClick={() => openMovementDrawer(item.id)}
                    title="View Movement Ledger"
                    className="p-1.5 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <History size={16} />
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
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Category Classification
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
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
