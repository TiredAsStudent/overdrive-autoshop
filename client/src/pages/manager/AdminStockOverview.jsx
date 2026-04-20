import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Columns,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import inventoryService from "../../services/inventoryService";

const AdminStockOverview = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showInactive, setShowInactive] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Column Visibility State
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const dropdownRef = useRef(null);

  // Modal States
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // --- DYNAMIC BRANCH DISCOVERY ---
  const uniqueBranches = useMemo(() => {
    const branchesMap = new Map();
    inventory.forEach((item) => {
      item.branch_levels?.forEach((b) => {
        if (!branchesMap.has(b.branch_id)) {
          branchesMap.set(b.branch_id, {
            id: b.branch_id,
            name: b.branch_name,
          });
        }
      });
    });
    return Array.from(branchesMap.values()).sort((a, b) => a.id - b.id);
  }, [inventory]);

  useEffect(() => {
    if (uniqueBranches.length > 0 && selectedBranches.length === 0) {
      setSelectedBranches(uniqueBranches.map((b) => b.id));
    }
  }, [uniqueBranches, selectedBranches.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowColumnMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleBranchColumn = (branchId) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId],
    );
  };

  // --- ENTERPRISE ANALYTICS ---
  const analytics = useMemo(() => {
    let totalValue = 0;
    let outOfStockAlerts = 0;
    let globalReserved = 0;
    let activeItemCount = 0;

    inventory.forEach((item) => {
      if (!item.is_active) return;
      activeItemCount++;
      totalValue += Number(item.total_asset_value || 0);
      globalReserved += Number(item.total_reserved_stock || 0);
      if (item.status === "LOW_STOCK") outOfStockAlerts++;
    });

    return { totalValue, outOfStockAlerts, globalReserved, activeItemCount };
  }, [inventory]);

  // --- FILTERING ---
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (!showInactive && !item.is_active) return false;
      const matchesSearch =
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "All" || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, showInactive, searchTerm, filterCategory]);

  // --- RESET PAGINATION ON FILTER CHANGE ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, showInactive, itemsPerPage]);

  // --- PAGINATION MATH & LOGIC ---
  const totalItems = filteredInventory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInventory = filteredInventory.slice(startIndex, endIndex);

  // Generates smart page numbers (e.g., 1 2 3 ... 10)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        end = maxVisiblePages;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisiblePages + 1;
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

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
  const getBranchStatusColor = (qty, min, reserved, isActive) => {
    if (!isActive)
      return "text-slate-400 bg-slate-100 border-slate-200 dark:bg-white/5 dark:border-white/10";
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

      {/* 2. TABLE COMMAND CENTER */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="relative w-full xl:w-auto flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search SKU or Part Name..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-amber-500 text-sm font-bold dark:text-white"
              />
            </div>

            <div className="relative w-full sm:w-auto min-w-[150px]">
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

            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
              <span className="text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">
                Show Inactive
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-start xl:justify-end">
            {/* COLUMN VISIBILITY DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="px-4 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-slate-300 font-bold flex items-center gap-2 text-sm transition-colors border border-slate-200 dark:border-white/10"
              >
                <Columns size={18} /> Columns
              </button>

              <AnimatePresence>
                {showColumnMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-xs font-black uppercase text-slate-500 tracking-wider">
                        Visible Branches
                      </p>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2">
                      {uniqueBranches.map((branch) => (
                        <label
                          key={branch.id}
                          className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={selectedBranches.includes(branch.id)}
                            onChange={() => toggleBranchColumn(branch.id)}
                          />

                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selectedBranches.includes(branch.id) ? "bg-amber-500 border-amber-500 text-slate-900" : "border-slate-300 dark:border-slate-600 bg-transparent"}`}
                          >
                            {selectedBranches.includes(branch.id) && (
                              <Check size={14} strokeWidth={3} />
                            )}
                          </div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 select-none">
                            {branch.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => {
                setFormData(initialFormState);
                setIsAdding(true);
              }}
              className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl font-bold flex items-center gap-2 text-sm transition-colors shadow-lg shadow-amber-500/20 whitespace-nowrap"
            >
              <Plus size={18} /> Add Master Item
            </button>
            <button className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors">
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* 3. MULTI-BRANCH TABLE WITH STICKY HEADERS */}
        <div className="overflow-x-auto relative w-full custom-scrollbar min-h-[400px]">
          <table className="w-full text-left min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4 sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-white/5 min-w-[320px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Part Description
                </th>
                <th className="px-6 py-4 min-w-[150px]">Category</th>

                {uniqueBranches
                  .filter((b) => selectedBranches.includes(b.id))
                  .map((branch) => (
                    <th
                      key={branch.id}
                      className="px-6 py-4 text-center bg-slate-100/50 dark:bg-white/5 min-w-[120px]"
                    >
                      {branch.name}
                    </th>
                  ))}
                <th className="px-6 py-4 text-right min-w-[100px]">Min. Lvl</th>
                <th className="px-6 py-4 text-center min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={selectedBranches.length + 4}
                    className="py-20 text-center"
                  >
                    <Loader2
                      className="animate-spin text-amber-500 mx-auto"
                      size={32}
                    />
                  </td>
                </tr>
              ) : paginatedInventory.length === 0 ? (
                <tr>
                  <td
                    colSpan={selectedBranches.length + 4}
                    className="py-20 text-center text-slate-500 font-bold"
                  >
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                paginatedInventory.map((item) => (
                  <tr
                    key={item.id}
                    className={`group transition-colors ${
                      !item.is_active
                        ? "bg-slate-50/50 dark:bg-slate-900/50 opacity-60 grayscale"
                        : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="px-6 py-4 sticky left-0 z-10 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-white/5 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-black tracking-tight leading-tight ${!item.is_active ? "text-slate-500" : "text-slate-900 dark:text-white"} line-clamp-2`}
                          >
                            {item.item_name}
                          </p>
                          {item.status === "LOW_STOCK" && item.is_active && (
                            <span className="shrink-0 text-[8px] font-black uppercase bg-red-500 text-white px-2 py-0.5 rounded-sm">
                              Low Stock
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            {item.item_code}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            ₱{item.unit_cost}
                          </span>
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">
                            |
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Value:{" "}
                            {formatMoney(Number(item.total_asset_value || 0))}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md whitespace-nowrap">
                        {item.category || "Uncategorized"}
                      </span>
                    </td>

                    {uniqueBranches
                      .filter((b) => selectedBranches.includes(b.id))
                      .map((branch) => {
                        const data = getBranchData(item, branch.id);
                        const statusClass = getBranchStatusColor(
                          data.stock,
                          item.reorder_level,
                          data.reserved,
                          item.is_active,
                        );
                        return (
                          <td key={branch.id} className="px-6 py-4 text-center">
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

                    <td className="px-6 py-4 text-right font-mono text-xs font-bold text-slate-400">
                      {item.reorder_level}
                    </td>

                    <td className="px-6 py-4 text-center">
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

        {/* 4. PREMIUM NUMBERED PAGINATION FOOTER */}
        {!isLoading && totalItems > 0 && (
          <div className="p-4 sm:px-6 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 rounded-b-3xl">
            {/* Left side: Rows & Results counter */}
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>
                Showing{" "}
                <span className="text-slate-900 dark:text-white">
                  {startIndex + 1}
                </span>{" "}
                -{" "}
                <span className="text-slate-900 dark:text-white">
                  {Math.min(endIndex, totalItems)}
                </span>{" "}
                of{" "}
                <span className="text-slate-900 dark:text-white">
                  {totalItems}
                </span>
              </span>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
              <div className="hidden sm:flex items-center gap-2">
                <span>Rows:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 outline-none focus:border-amber-500 cursor-pointer text-slate-900 dark:text-white transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Right side: Numbered Pill Controls */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center px-1 gap-1">
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[28px] h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      currentPage === page
                        ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20"
                        : "text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:shadow-sm"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. LEGEND & SECURITY FOOTER */}
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
      </div>

      {/* 6. IDENTITY CRUD MODAL */}
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
                    Unit Cost (Peso)
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
                        Deactivating prevents staff from scanning this item via
                        OCR.
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
