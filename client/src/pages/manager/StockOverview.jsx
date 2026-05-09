import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Loader2,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  Tag,
} from "lucide-react";
import { inventoryService } from "../../services/manager/inventory.service";
import InventoryModal from "../../features/manager/components/InventoryModal";
import ConfirmModal from "../../components/shared/ConfirmModal";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount || 0,
  );
const CATEGORIES = [
  "All Categories",
  "Fluids",
  "Filters",
  "Brakes",
  "Underchassis",
  "Electrical",
  "Engine",
  "Accessories",
];

const StockOverview = () => {
  const [inventory, setInventory] = useState([]);
  const [branches, setBranches] = useState([]);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    item: null,
  });

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await inventoryService.getActiveBranches();
        setBranches(res.data || []);
      } catch (error) {
        console.error("Failed to load branches");
      }
    };
    fetchBranches();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getOverview(selectedBranch || null);
      setInventory(res.data || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [selectedBranch]);

  const handleSaveItem = async (data) => {
    if (editingItem) {
      await inventoryService.updateItem(editingItem.id, data);
    } else {
      await inventoryService.createItem(data);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    loadInventory();
  };

  const handleDeactivate = async () => {
    if (!confirmModal.item) return;
    try {
      await inventoryService.updateItem(confirmModal.item.id, {
        is_active: false,
      });
      loadInventory();
    } catch (error) {
      alert(error.message);
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Advanced Filtering
  const filteredItems = inventory.filter((i) => {
    const matchesSearch =
      i.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All Categories" || i.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalItems = inventory.length;
  const totalStockQty = inventory.reduce(
    (sum, item) => sum + Number(item.total_quantity ?? item.quantity ?? 0),
    0,
  );
  const totalAssetValue = inventory.reduce(
    (sum, item) =>
      sum + Number(item.total_asset_value ?? item.branch_asset_value ?? 0),
    0,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Package className="text-blue-600 dark:text-blue-500" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
              Stock Overview
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Global Asset & Parts Tracking
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Branch Filter */}
          <div className="relative w-full sm:w-48">
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer appearance-none"
            >
              <option value="">🌎 All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>

          {/* NEW: Category Filter */}
          <div className="relative w-full sm:w-40">
            <Tag
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer appearance-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-48">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search SKU or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none"
            />
          </div>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
          >
            <Plus size={16} /> Add Part
          </button>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ... (Keep existing 3 cards: Unique Parts, Physical Stock, Asset Value) ... */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
            <Package className="text-slate-500" size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Total Unique Parts
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalItems}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Package className="text-blue-500" size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">
              Total Physical Stock
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalStockQty}{" "}
              <span className="text-sm text-slate-400 font-medium">units</span>
            </p>
          </div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp
              className="text-emerald-600 dark:text-emerald-400"
              size={20}
            />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
              Inventory Asset Value
            </p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
              {formatCurrency(totalAssetValue)}
            </p>
          </div>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Scanning Shelves...
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-8 py-5">Part Details</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Financials</th>
                <th className="px-8 py-5 text-center">Current Stock</th>
                <th className="px-8 py-5 text-right">Asset Value</th>
                <th className="px-8 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredItems.map((item) => {
                const qty = Number(item.total_quantity ?? item.quantity ?? 0);
                const isConsolidated = selectedBranch === "";
                const isLowStock = !isConsolidated && item.is_low_stock;
                const isOutOfStock = qty <= 0;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {item.item_name}
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                          {item.sku}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="inline-flex px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[9px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-600">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col text-xs font-mono">
                        <span className="text-slate-500">
                          C: {formatCurrency(item.unit_cost)}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          S: {formatCurrency(item.selling_price)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs font-black ${isOutOfStock ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-500" : isLowStock ? "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-500" : "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-500"}`}
                      >
                        {isOutOfStock ? (
                          <AlertCircle size={14} />
                        ) : isLowStock ? (
                          <AlertTriangle size={14} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        {qty}{" "}
                        {!isConsolidated && (
                          <span className="text-[9px] uppercase tracking-wider opacity-70">
                            / {item.reorder_point} MIN
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right font-mono text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      {formatCurrency(
                        item.total_asset_value ?? item.branch_asset_value ?? 0,
                      )}
                    </td>
                    {/* NEW: Actions Column */}
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit Pricing"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmModal({ isOpen: true, item })
                          }
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Deactivate Part"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-8 py-12 text-center text-slate-400"
                  >
                    <Package size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-bold">
                      No inventory items found.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveItem}
        editData={editingItem}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, item: null })}
        onConfirm={handleDeactivate}
        title="Deactivate Part?"
        message={`This will remove ${confirmModal.item?.sku} from active circulation. Historical data will be preserved.`}
        confirmText="Deactivate"
        variant="danger"
      />
    </div>
  );
};

export default StockOverview;
