import React, { useState, useEffect } from "react";
import { Plus, Search, Loader2, Boxes, Network, PackageX } from "lucide-react";
import { inventoryService } from "../../services/manager/inventory.service";
import MasterItemModal from "../../features/manager/components/MasterItemModal";
import StockBreakdownModal from "../../features/manager/components/StockBreakdownModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";

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

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, categoryFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventoryCatalog(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        categoryFilter,
        "active",
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
    loadItems();
  }, [currentPage, debouncedSearchQuery, categoryFilter]);

  const handleCreateSubmit = async (formData) => {
    try {
      await inventoryService.createMasterItem(formData);
      showToast(
        `${formData.item_name} distributed to enterprise successfully.`,
        "success",
      );
      setIsCreateModalOpen(false);
      loadItems();
    } catch (error) {
      throw error;
    }
  };

  const openBreakdown = (item) => {
    setSelectedItem(item);
    setIsBreakdownModalOpen(true);
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
              Master Parts & Real-Time Aggregation
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:max-w-[200px]">
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-[180px] px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:border-amber-500 uppercase tracking-wider"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-sm shadow-amber-500/20 cursor-pointer"
          >
            <Plus size={16} /> Register Item
          </button>
        </div>
      </div>

      {/* UNIVERSAL DATATABLE */}
      <DataTable
        headers={[
          "Item Profile",
          "Identifier",
          "Base Financials",
          "Global Stock",
          "Actions",
        ]}
        data={items}
        loading={loading}
        emptyTitle="No master items found"
        renderRow={(item) => (
          <tr
            key={item.id}
            className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
          >
            {/* 1. Item Profile */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="min-w-0 max-w-[200px] sm:max-w-[300px]">
                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic tracking-tight uppercase truncate">
                  {item.item_name}
                </p>
              </div>
            </td>

            {/* 2. Identifier (SKU & Cat) */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start">
                <div className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                  <span className="text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-300 tracking-[0.1em] uppercase">
                    {item.sku}
                  </span>
                </div>
                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-amber-500 mt-1.5 hidden sm:block">
                  {item.category}
                </span>
              </div>
            </td>

            {/* 3. Base Financials */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <p>
                  Cost:{" "}
                  <span className="text-slate-900 dark:text-white ml-1">
                    ₱
                    {parseFloat(item.unit_cost).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </p>
                <p>
                  SRP:{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                    ₱
                    {parseFloat(item.selling_price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </p>
              </div>
            </td>

            {/* 4. Global Stock Aggregate */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-md ${parseInt(item.total_company_quantity) > 0 ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600" : "bg-red-100 dark:bg-red-500/20 text-red-600"}`}
                >
                  {parseInt(item.total_company_quantity) > 0 ? (
                    <Boxes size={16} />
                  ) : (
                    <PackageX size={16} />
                  )}
                </div>
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {item.total_company_quantity}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Units
                </span>
              </div>
            </td>

            {/* 5. Actions (Strictly Read-Only Analysis) */}
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <button
                onClick={() => openBreakdown(item)}
                title="View Branch Distribution"
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
              >
                <Network size={14} /> Details
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

      <MasterItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />
      <StockBreakdownModal
        isOpen={isBreakdownModalOpen}
        onClose={() => setIsBreakdownModalOpen(false)}
        item={selectedItem}
      />
    </div>
  );
};

export default StockManagement;
