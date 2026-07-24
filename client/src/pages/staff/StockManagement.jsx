import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
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
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

// Kept identical to Manager for consistent filtering
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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

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

  const getStatusDisplay = (status) => {
    if (status === "In Stock") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest">
          <ShieldCheck size={12} /> In Stock
        </span>
      );
    }
    if (status === "Low Stock") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 text-[9px] font-black uppercase tracking-widest">
          <AlertTriangle size={12} /> Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-[9px] font-black uppercase tracking-widest">
        <XCircle size={12} /> Out of Stock
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Boxes className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Stock Management
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Branch Inventory & Valuation
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
            {[
              { id: "all", label: "All Items" },
              { id: "in_stock", label: "In Stock" },
              { id: "low_stock", label: "Low Stock" },
              { id: "out_of_stock", label: "Out of Stock" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStockStatusFilter(f.id)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${stockStatusFilter === f.id ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="relative w-full sm:max-w-[220px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchQuery !== debouncedSearchQuery ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search SKU or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        headers={[
          "Item Profile",
          "Unit Cost",
          "On-Hand Stock",
          "Asset Valuation",
          "Status",
          "Actions",
        ]}
        data={items}
        loading={loading}
        emptyTitle="No branch inventory items found"
        emptySubtitle="Adjust filters or check connection."
        renderRow={(item) => {
          // Because branchId was passed to backend, total_company_quantity represents specific branch stock
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
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 tracking-[0.1em] uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {item.sku}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      {item.category} • {item.uom}
                    </span>
                  </div>
                </div>
              </td>

              {/* Unit Cost */}
              <td className="px-4 sm:px-8 py-4 sm:py-5">
                <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                  ₱
                  {parseFloat(item.unit_cost).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </td>

              {/* On-Hand Stock */}
              <td className="px-4 sm:px-8 py-4 sm:py-5">
                <div className="flex flex-col">
                  <span
                    className={`text-base font-black ${quantity <= 0 ? "text-red-500" : quantity <= reorderPoint ? "text-amber-500" : "text-emerald-500"}`}
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
                {getStatusDisplay(item.global_stock_status)}
              </td>

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
                <button
                  onClick={() => openMovementDrawer(item.id)}
                  title="View Movement Ledger"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <History size={14} /> Ledger
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
