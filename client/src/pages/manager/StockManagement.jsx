import React, { useState, useEffect, useCallback, useId } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Boxes,
  Network,
  Edit2,
  Archive,
  RotateCcw,
  PackageX,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { inventoryService } from "../../services/manager/inventory.service";
import MasterItemModal from "../../features/manager/components/MasterItemModal";
import StockDetailsModal from "../../features/manager/components/StockDetailsModal";
import ConfirmModal from "../../components/shared/ConfirmModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import PageHeader from "../../components/shared/PageHeader";
import FilterModal from "../../components/shared/FilterModal";

import SearchBar from "../../components/ui/SearchBar";
import FilterButton from "../../components/ui/FilterButton";
import StatusToggle from "../../components/ui/StatusToggle";
import ActionButton from "../../components/ui/ActionButton";
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

const STATUS_OPTIONS = [
  { label: "Active", value: false },
  { label: "Archived", value: true },
];

const ITEMS_PER_PAGE = 10;

const StockManagement = () => {
  const { showToast } = useApp();
  const [searchParams] = useSearchParams();

  // Accessible Filter Control IDs
  const branchSelectId = useId();
  const categorySelectId = useId();
  const statusSelectId = useId();

  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination (Initialized from URL Search Params if present)
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState(
    () => searchParams.get("branch") || "all",
  );
  const [stockStatusFilter, setStockStatusFilter] = useState(
    () => searchParams.get("stock_status") || "all",
  );
  const [showArchived, setShowArchived] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "danger",
    onConfirm: () => {},
  });

  const activeFilterCount =
    (categoryFilter !== "all" ? 1 : 0) +
    (branchFilter !== "all" ? 1 : 0) +
    (stockStatusFilter !== "all" ? 1 : 0);

  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch((err) => console.error("Failed to load branches for filter", err));
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleBranchChange = (value) => {
    setBranchFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleStockStatusChange = (value) => {
    setStockStatusFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleArchivedToggle = (value) => {
    setShowArchived(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const resetFilters = () => {
    setCategoryFilter("all");
    setBranchFilter("all");
    setStockStatusFilter("all");
    if (currentPage !== 1) setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const loadItems = useCallback(async () => {
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
        error.message || "Unable to load inventory stock catalog.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    categoryFilter,
    branchFilter,
    stockStatusFilter,
    showArchived,
    showToast,
  ]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleModalSubmit = async (formData) => {
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
  };

  const handleToggleStatus = (item) => {
    const action = item.is_active ? "Archive" : "Restore";
    const variant = item.is_active ? "danger" : "info";
    setConfirmConfig({
      isOpen: true,
      title: `${action} Master Item`,
      message: `Are you sure you want to ${action.toLowerCase()} ${item.item_name}?`,
      confirmText: `Yes, ${action}`,
      variant,
      onConfirm: async () => {
        try {
          await inventoryService.toggleItemStatus(item.id, !item.is_active);
          showToast(
            `${item.item_name} ${item.is_active ? "archived" : "restored"} successfully.`,
            "success",
          );
          loadItems();
        } catch (error) {
          showToast(
            error.message || "Failed to update master item status.",
            "error",
          );
        }
      },
    });
  };

  const openDetails = (item) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getStockStatusVariant = (status) => {
    if (status === "In Stock") return "success";
    if (status === "Low Stock") return "warning";
    return "danger";
  };

  const getStockStatusIcon = (status) => {
    if (status === "In Stock") return ShieldCheck;
    if (status === "Low Stock") return AlertTriangle;
    return XCircle;
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Stock Management"
        subtitle="Master Data & Ledger"
        icon={Boxes}
      >
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

        <StatusToggle
          activeValue={showArchived}
          onToggle={handleArchivedToggle}
          ariaLabel="Filter master items by active or archived status"
          options={STATUS_OPTIONS}
        />

        <ActionButton
          onClick={() => {
            setSelectedItem(null);
            setIsModalOpen(true);
          }}
          label="Register Item"
          icon={Plus}
        />
      </PageHeader>

      <DataTable
        caption="Enterprise Master Inventory and Stock Ledger"
        minWidth="min-w-[850px]"
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
        emptySubtitle="Try adjusting your search or filter criteria, or register a new master item."
        renderRow={(item) => {
          const totalQty = parseInt(item.total_company_quantity, 10) || 0;

          return (
            <tr
              key={item.id}
              className={`group border-b border-slate-100 dark:border-white/5 last:border-0 ${
                !item.is_active
                  ? "bg-slate-50/70 dark:bg-slate-900/40 opacity-75"
                  : "table-row-hover"
              }`}
            >
              {/* Item Profile */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="min-w-0 max-w-[200px] sm:max-w-[300px]">
                  <p
                    className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic uppercase truncate"
                    title={item.item_name}
                  >
                    {item.item_name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {item.uom}
                  </p>
                </div>
              </td>

              {/* Identifier */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col items-start">
                  <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-mono tabular-nums font-black tracking-widest uppercase">
                    {item.sku}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mt-1.5">
                    {item.category}
                  </span>
                </div>
              </td>

              {/* Base Financials */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <p>
                    Cost:{" "}
                    <span className="font-mono tabular-nums font-black text-slate-900 dark:text-white ml-1">
                      ₱{formatCurrency(item.unit_cost)}
                    </span>
                  </p>
                  <p>
                    SRP:{" "}
                    <span className="font-mono tabular-nums font-black text-emerald-600 dark:text-emerald-400 ml-1">
                      ₱{formatCurrency(item.selling_price)}
                    </span>
                  </p>
                </div>
              </td>

              {/* Aggregated Stock */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col items-start gap-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      aria-hidden="true"
                      className={`p-1.5 rounded-lg ${
                        totalQty > 0
                          ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {totalQty > 0 ? (
                        <Boxes size={16} />
                      ) : (
                        <PackageX size={16} />
                      )}
                    </div>
                    <span className="text-sm sm:text-base font-mono tabular-nums font-black text-slate-900 dark:text-white">
                      {totalQty}
                    </span>
                  </div>
                  <StatusBadge
                    label={item.global_stock_status}
                    variant={getStockStatusVariant(item.global_stock_status)}
                    icon={getStockStatusIcon(item.global_stock_status)}
                  />
                </div>
              </td>

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => openDetails(item)}
                    title={`View Details & Ledger for ${item.item_name}`}
                    aria-label={`View branch stock details and movement ledger for ${item.item_name}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                  >
                    <Network size={14} aria-hidden="true" />
                    <span>Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(item);
                      setIsModalOpen(true);
                    }}
                    title={`Edit ${item.item_name}`}
                    aria-label={`Edit master item ${item.item_name}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-amber-600 dark:hover:text-overdrive-yellow hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200/60 dark:hover:border-amber-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit2 size={16} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    title={
                      item.is_active
                        ? `Archive ${item.item_name}`
                        : `Restore ${item.item_name}`
                    }
                    aria-label={
                      item.is_active
                        ? `Archive master item ${item.item_name}`
                        : `Restore master item ${item.item_name}`
                    }
                    className={`p-2 sm:p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                      item.is_active
                        ? "text-slate-400 border-transparent hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200/60 dark:hover:border-rose-500/20"
                        : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200/60 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                    }`}
                  >
                    {item.is_active ? (
                      <Archive size={16} aria-hidden="true" />
                    ) : (
                      <RotateCcw size={16} aria-hidden="true" />
                    )}
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
            <label htmlFor={branchSelectId} className="form-label">
              Branch Location
            </label>
            <div className="relative">
              <select
                id={branchSelectId}
                value={branchFilter}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Branches</option>
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
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All Categories" : c}
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
            <label htmlFor={statusSelectId} className="form-label">
              Inventory Status
            </label>
            <div className="relative">
              <select
                id={statusSelectId}
                value={stockStatusFilter}
                onChange={(e) => handleStockStatusChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
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
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
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
