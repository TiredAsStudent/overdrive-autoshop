import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Loader2,
  Boxes,
  Network,
  Edit2,
  Archive,
  RotateCcw,
  PackageX,
} from "lucide-react";
import { inventoryService } from "../../services/manager/inventory.service";
import MasterItemModal from "../../features/manager/components/MasterItemModal";
import StockDetailsModal from "../../features/manager/components/StockDetailsModal";
import ConfirmModal from "../../components/shared/ConfirmModal";
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
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "danger",
    onConfirm: () => {},
  });

  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch((err) => console.error("Failed to load branches for filter", err));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    categoryFilter,
    branchFilter,
    stockStatusFilter,
    showArchived,
  ]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const statusParam = showArchived ? "archived" : "active";
      const response = await inventoryService.getInventoryCatalog(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        categoryFilter,
        branchFilter,
        statusParam,
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
    loadItems();
  }, [
    currentPage,
    debouncedSearchQuery,
    categoryFilter,
    branchFilter,
    stockStatusFilter,
    showArchived,
  ]);

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedItem) {
        await inventoryService.updateMasterItem(selectedItem.id, formData);
        showToast(`${formData.item_name} updated successfully.`, "success");
      } else {
        await inventoryService.createMasterItem(formData);
        showToast(
          `${formData.item_name} distributed to enterprise successfully.`,
          "success",
        );
      }
      setIsModalOpen(false);
      loadItems();
    } catch (error) {
      throw error;
    }
  };

  const handleToggleStatus = (item) => {
    const action = item.is_active ? "Archive" : "Restore";
    const variant = item.is_active ? "danger" : "info";
    setConfirmConfig({
      isOpen: true,
      title: `${action} Master Item`,
      message: `Are you sure you want to ${action.toLowerCase()} ${item.item_name}?`,
      confirmText: `Yes, ${action}`,
      variant: variant,
      onConfirm: async () => {
        try {
          await inventoryService.toggleItemStatus(item.id, !item.is_active);
          showToast(
            `${item.item_name} ${item.is_active ? "archived" : "restored"} successfully.`,
            "success",
          );
          loadItems();
        } catch (error) {
          showToast(error.message, "error");
        }
      },
    });
  };

  const openDetails = (item) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
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
              Master Data & Ledger
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:max-w-[150px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchQuery !== debouncedSearchQuery ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search SKU/Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full sm:w-[130px] px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold focus:outline-none focus:border-amber-500 uppercase tracking-widest text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-[130px] px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold focus:outline-none focus:border-amber-500 uppercase tracking-widest text-slate-700 dark:text-slate-300"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </option>
            ))}
          </select>

          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="w-full sm:w-[130px] px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold focus:outline-none focus:border-amber-500 uppercase tracking-widest text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto">
            <button
              onClick={() => setShowArchived(false)}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!showArchived ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500"}`}
            >
              Active
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${showArchived ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500"}`}
            >
              Archived
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedItem(null);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus size={16} /> Register Item
          </button>
        </div>
      </div>

      <DataTable
        headers={[
          "Item Profile",
          "Identifier",
          "Base Financials",
          "Aggregated Stock",
          "Actions",
        ]}
        data={items}
        loading={loading}
        emptyTitle={`No ${showArchived ? "archived" : "active"} items found`}
        renderRow={(item) => (
          <tr
            key={item.id}
            className={`group transition-colors ${!item.is_active ? "bg-slate-50 dark:bg-slate-900/40 opacity-75 grayscale" : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"}`}
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="min-w-0 max-w-[200px] sm:max-w-[300px]">
                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic uppercase truncate">
                  {item.item_name}
                </p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                  {item.uom}
                </p>
              </div>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start">
                <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-300 tracking-[0.1em] uppercase">
                  {item.sku}
                </span>
                <span className="text-[7px] font-black uppercase tracking-widest text-amber-500 mt-1.5 hidden sm:block">
                  {item.category}
                </span>
              </div>
            </td>

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

            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start gap-1.5">
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
                </div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    item.global_stock_status === "In Stock"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : item.global_stock_status === "Low Stock"
                        ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500"
                        : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                  }`}
                >
                  {item.global_stock_status}
                </span>
              </div>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <button
                  onClick={() => openDetails(item)}
                  title="View Details & Ledger"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <Network size={14} /> View Details
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(item);
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleToggleStatus(item)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${item.is_active ? "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" : "text-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400"}`}
                >
                  {item.is_active ? (
                    <Archive size={16} />
                  ) : (
                    <RotateCcw size={16} />
                  )}
                </button>
              </div>
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedItem}
      />
      <StockDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        item={selectedItem}
      />
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
      />
    </div>
  );
};

export default StockManagement;
