import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  Plus,
  X,
  Loader2,
  Edit2,
} from "lucide-react";
import inventoryService from "../../services/inventoryService";

const AdminStockOverview = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showInactive, setShowInactive] = useState(false); // NEW: Toggle to view deleted items
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Modal State
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const initialFormState = {
    item_code: "",
    item_name: "",
    category: "Lubricants",
    unit_cost: 0,
    reorder_level: 5,
    is_active: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch Data
  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getInventory();
      setInventory(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // --- DERIVED ANALYTICS ---
  const analytics = useMemo(() => {
    let totalValue = 0;
    let outOfStockAlerts = 0;
    let globalReserved = 0;
    let activeItemCount = 0;

    inventory.forEach((item) => {
      if (!item.is_active) return; // Ignore inactive items for analytics

      activeItemCount++;
      let itemTotalStock = 0;
      let hasLowStockBranch = false;

      item.branch_levels?.forEach((branch) => {
        itemTotalStock += branch.stock;
        globalReserved += branch.reserved;
        if (branch.stock <= item.reorder_level) hasLowStockBranch = true;
      });

      totalValue += itemTotalStock * parseFloat(item.unit_cost);
      if (hasLowStockBranch) outOfStockAlerts++;
    });

    return { totalValue, outOfStockAlerts, globalReserved, activeItemCount };
  }, [inventory]);

  // --- SEARCH & CATEGORY FILTER ---
  const filteredInventory = inventory.filter((item) => {
    // NEW: Respect the "Show Inactive" toggle
    if (!showInactive && !item.is_active) return false;

    const matchesSearch =
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "All" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Unique Categories for Dropdown
  const categories = [
    "All",
    "Lubricants",
    "Engine Parts",
    "Filters",
    "Brakes",
    "Suspension",
    "Electrical",
  ];

  // --- UI HELPERS ---
  const getStatusColor = (qty, min, reserved, isActive) => {
    if (!isActive)
      return "text-slate-400 bg-slate-100 border-slate-200 dark:bg-white/5 dark:border-white/10"; // Greyed out if inactive
    if (qty <= min) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (qty > 0 && reserved > qty * 0.3)
      return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  const formatMoney = (amount) =>
    `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  const getBranchData = (item, branchId) => {
    return (
      item.branch_levels?.find((b) => b.branch_id === branchId) || {
        stock: 0,
        reserved: 0,
      }
    );
  };

  // --- OPEN EDIT MODAL ---
  const openEditModal = (item) => {
    setEditId(item.id);
    setFormData({
      item_code: item.item_code,
      item_name: item.item_name,
      category: item.category || "Lubricants",
      unit_cost: item.unit_cost,
      reorder_level: item.reorder_level,
      is_active: item.is_active,
    });
    setIsEditing(true);
  };

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (isEditing) {
        await inventoryService.updateInventoryItem(editId, formData);
        setIsEditing(false);
      } else {
        await inventoryService.createInventoryItem(formData);
        setIsAdding(false);
      }
      setFormData(initialFormState);
      fetchInventory();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold flex justify-between items-center border border-red-200">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. TOP LEVEL ANALYTICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
            Total Active SKUs
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white italic">
            {analytics.activeItemCount.toLocaleString()}
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 text-red-500">
            Alerts: Critical Stock
          </p>
          <h3 className="text-2xl font-black text-red-500 italic">
            {analytics.outOfStockAlerts} Items
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 text-blue-500">
            Globally Reserved
          </p>
          <h3 className="text-2xl font-black text-blue-500 italic">
            {analytics.globalReserved.toLocaleString()} Units
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
            Inventory Value
          </p>
          <h3 className="text-2xl font-black text-emerald-500 italic">
            {formatMoney(analytics.totalValue)}
          </h3>
        </div>
      </div>

      {/* 2. MULTI-BRANCH TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-auto flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Global SKU or Part Name..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-amber-500 text-sm font-bold dark:text-white"
              />
            </div>

            <div className="relative w-full md:w-auto min-w-[150px]">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-amber-500 text-sm font-bold dark:text-white cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Filter
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* NEW: SHOW INACTIVE TOGGLE */}
            <div className="flex items-center gap-2 md:ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
              <span className="text-[10px] font-black uppercase text-slate-400">
                Show Inactive
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setFormData(initialFormState);
                setIsAdding(true);
              }}
              className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl font-bold flex items-center gap-2 text-sm transition-colors shadow-lg shadow-amber-500/20"
            >
              <Plus size={18} /> Add Master Item
            </button>
            <button className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors">
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4">Part Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center bg-blue-500/5">Main</th>
                <th className="px-6 py-4 text-center bg-amber-500/5">Second</th>
                <th className="px-6 py-4 text-center bg-purple-500/5">Third</th>
                <th className="px-6 py-4 text-right">Min. Lvl</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <Loader2
                      className="animate-spin text-amber-500 mx-auto"
                      size={32}
                    />
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="py-20 text-center text-slate-500 font-bold"
                  >
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr
                    key={item.id}
                    // Visual indicator for inactive items
                    className={`group transition-colors ${
                      !item.is_active
                        ? "bg-slate-50/50 dark:bg-white/[0.01] opacity-50 grayscale"
                        : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-black tracking-tight ${!item.is_active ? "text-slate-500" : "text-slate-900 dark:text-white"}`}
                        >
                          {item.item_name}
                        </p>
                        {/* Red Badge for Inactive Items */}
                        {!item.is_active && (
                          <span className="text-[8px] font-black uppercase bg-red-500 text-white px-2 py-0.5 rounded-sm">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {item.item_code}
                        </span>
                        <span className="text-[10px] text-slate-300 dark:text-slate-600">
                          |
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ₱{item.unit_cost}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
                        {item.category || "Uncategorized"}
                      </span>
                    </td>

                    {/* DYNAMIC BRANCH COLUMNS */}
                    {[1, 2, 3].map((branchId) => {
                      const data = getBranchData(item, branchId);
                      const statusClass = getStatusColor(
                        data.stock,
                        item.reorder_level,
                        data.reserved,
                        item.is_active,
                      );
                      return (
                        <td key={branchId} className="px-6 py-5 text-center">
                          <div
                            className={`inline-flex flex-col items-center justify-center min-w-[70px] py-2 rounded-2xl border transition-all ${statusClass}`}
                          >
                            <span className="text-sm font-black">
                              {data.stock}
                            </span>
                            {data.reserved > 0 && (
                              <span className="text-[9px] font-bold opacity-70 italic">
                                ({data.reserved} Res.)
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    <td className="px-6 py-5 text-right font-mono text-xs font-bold text-slate-400">
                      {item.reorder_level}
                    </td>

                    {/* EDIT ACTION BUTTON */}
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 transition-colors"
                        title="Edit Item Specs"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. LEGEND & SECURITY FOOTER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-4">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
            <div className="h-3 w-3 rounded bg-emerald-500/20 border border-emerald-500/40" />{" "}
            Healthy
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
            <div className="h-3 w-3 rounded bg-red-500/20 border border-red-500/40" />{" "}
            Critical/Low
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
            <div className="h-3 w-3 rounded bg-blue-500/20 border border-blue-500/40" />{" "}
            High Reservations
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-amber-500 rounded-2xl text-slate-900 shadow-lg shadow-amber-500/20">
          <AlertTriangle size={20} />
          <div>
            <p className="text-[10px] font-black uppercase leading-none">
              Automated Reorder Logic
            </p>
            <p className="text-[10px] font-bold opacity-80 mt-1 italic">
              Red indicators automatically flag items in the Weekly Admin
              Purchase Report.
            </p>
          </div>
        </div>
      </div>

      {/* 4. CREATE / EDIT ITEM MODAL */}
      <AnimatePresence>
        {(isAdding || isEditing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAdding(false);
                setIsEditing(false);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">
                  {isEditing ? "Edit Master Part" : "Register Master Part"}
                </h3>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setIsEditing(false);
                  }}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">
                    SKU / Item Code
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.item_code}
                    onChange={(e) =>
                      setFormData({ ...formData, item_code: e.target.value })
                    }
                    placeholder="e.g. OIL-5W30"
                    disabled={isEditing}
                    className={`w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-mono text-sm dark:text-white focus:border-amber-500 outline-none ${isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">
                    Item Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.item_name}
                    onChange={(e) =>
                      setFormData({ ...formData, item_name: e.target.value })
                    }
                    placeholder="e.g. Shell Helix 5W-30"
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold dark:text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white focus:border-amber-500 outline-none"
                    >
                      <option value="Lubricants">Lubricants</option>
                      <option value="Engine Parts">Engine Parts</option>
                      <option value="Filters">Filters</option>
                      <option value="Brakes">Brakes</option>
                      <option value="Suspension">Suspension</option>
                      <option value="Electrical">Electrical</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">
                      Reorder Threshold
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.reorder_level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reorder_level: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold dark:text-white focus:border-amber-500 outline-none text-center"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">
                    Unit Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      ₱
                    </span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unit_cost}
                      onChange={(e) =>
                        setFormData({ ...formData, unit_cost: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-4 py-3 font-mono dark:text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl mt-4">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white">
                        Item Status
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 italic">
                        Deactivating prevents staff from selling this item.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_active: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl uppercase text-sm transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : isEditing ? (
                    <Edit2 size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  {isEditing ? "Save Changes" : "Add to Master Catalogue"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminStockOverview;
