import React, { useState, useMemo } from "react";
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  MapPin,
  Flag,
  Building,
  CheckCircle,
  ArrowRight,
  X,
  AlertCircle,
  Minus 
} from "lucide-react";

// --- MOCK DATA ENGINE ---
const MOCK_CATEGORIES = [
  "All",
  "Fluids",
  "Filters",
  "Brakes",
  "Electrical",
  "Suspension",
];

const MOCK_INVENTORY = [
  {
    id: "INV-001",
    sku: "OIL-SYN-4L",
    name: "Full Synthetic Motor Oil",
    category: "Fluids",
    uom: "Liter",
    physical: 24,
    committed: 4,
    available: 20,
    reorderPoint: 10,
    shelf: "Aisle A, Bin 12",
    price: 450,
    otherBranches: [
      { branch: "Biñan", qty: 50 },
      { branch: "Batino", qty: 10 },
    ],
  },
  {
    id: "INV-002",
    sku: "FLT-TYT-01",
    name: "Toyota Genuine Oil Filter",
    category: "Filters",
    uom: "Piece",
    physical: 8,
    committed: 5,
    available: 3,
    reorderPoint: 5,
    shelf: "Aisle B, Rack 2",
    price: 450,
    otherBranches: [
      { branch: "Biñan", qty: 2 },
      { branch: "Batino", qty: 0 },
    ],
  },
  {
    id: "INV-003",
    sku: "BRK-PAD-HC",
    name: "Ceramic Brake Pads (Sedan)",
    category: "Brakes",
    uom: "Set",
    physical: 0,
    committed: 0,
    available: 0,
    reorderPoint: 3,
    shelf: "Aisle C, Rack 1",
    price: 2500,
    otherBranches: [
      { branch: "Biñan", qty: 12 },
      { branch: "Batino", qty: 4 },
    ],
  },
  {
    id: "INV-004",
    sku: "BAT-3SMF",
    name: "Maintenance Free Battery 3SM",
    category: "Electrical",
    uom: "Piece",
    physical: 15,
    committed: 1,
    available: 14,
    reorderPoint: 5,
    shelf: "Aisle D, Floor",
    price: 6500,
    otherBranches: [
      { branch: "Biñan", qty: 8 },
      { branch: "Batino", qty: 10 },
    ],
  },
];

const StockInventory = () => {
  // --- STATE MANAGEMENT ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modals
  const [flagModalItem, setFlagModalItem] = useState(null);
  const [branchModalItem, setBranchModalItem] = useState(null);

  // Form State for Discrepancy
  const [actualCount, setActualCount] = useState("");
  const [flagReason, setFlagReason] = useState("");

  // --- LOGIC HANDLERS ---
  const filteredInventory = useMemo(() => {
    return MOCK_INVENTORY.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const metrics = useMemo(() => {
    const lowStock = MOCK_INVENTORY.filter(
      (i) => i.available > 0 && i.available <= i.reorderPoint,
    ).length;
    const outOfStock = MOCK_INVENTORY.filter((i) => i.available <= 0).length;
    const healthy = MOCK_INVENTORY.length - lowStock - outOfStock;
    return { lowStock, outOfStock, healthy, total: MOCK_INVENTORY.length };
  }, []);

  const handleFlagSubmit = (e) => {
    e.preventDefault();
    if (!actualCount || !flagReason)
      return alert("Please fill in all fields to submit a discrepancy report.");

    alert(
      `DISCREPANCY REPORTED\n\nItem: ${flagModalItem.sku}\nSystem Count: ${flagModalItem.physical}\nReported Count: ${actualCount}\nReason: ${flagReason}\n\nThis report has been sent to the Manager for Audit and Adjustment.`,
    );

    setFlagModalItem(null);
    setActualCount("");
    setFlagReason("");
  };

  // --- UI HELPERS ---
  const getStockStatus = (available, reorder) => {
    if (available <= 0)
      return {
        label: "Out of Stock",
        color: "text-rose-500",
        bg: "bg-rose-50 dark:bg-rose-500/10",
        border: "border-rose-200 dark:border-rose-500/30",
        icon: <AlertTriangle size={14} />,
      };
    if (available <= reorder)
      return {
        label: "Low Stock",
        color: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        border: "border-amber-200 dark:border-amber-500/30",
        icon: <AlertCircle size={14} />,
      };
    return {
      label: "In Stock",
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "border-emerald-200 dark:border-emerald-500/30",
      icon: <CheckCircle size={14} />,
    };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500 relative">
      {/* HEADER & METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 flex flex-col justify-center bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <Package className="text-indigo-500" size={28} />
            Stock Inventory
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Calamba Branch • Live Shelf Data
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Healthy Stock
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics.healthy}
            </p>
          </div>
          <CheckCircle className="text-emerald-400/50" size={32} />
        </div>
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
              Critical / Out
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {metrics.outOfStock + metrics.lowStock}
            </p>
          </div>
          <AlertTriangle className="text-rose-400/50" size={32} />
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search SKU or Part Name..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-sm font-bold focus:border-indigo-500 transition-colors uppercase"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative md:w-64">
          <Filter
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <select
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 appearance-none cursor-pointer focus:border-indigo-500 transition-colors"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {MOCK_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* INVENTORY LIST */}
      <div className="space-y-4">
        {filteredInventory.map((item) => {
          const status = getStockStatus(item.available, item.reorderPoint);
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 group hover:border-indigo-500/30 transition-all"
            >
              {/* Item ID & Location */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-[10px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                    {item.sku}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase leading-tight mb-2">
                  {item.name}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-indigo-400" />{" "}
                    {item.shelf}
                  </span>
                  <span>
                    UOM:{" "}
                    <span className="text-slate-900 dark:text-white uppercase">
                      {item.uom}
                    </span>
                  </span>
                </div>
              </div>

              {/* Physical vs Available Stock Engine */}
              <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                <div className="text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Physical Shelf
                  </p>
                  <p className="text-xl font-mono font-black text-slate-700 dark:text-slate-300">
                    {item.physical}
                  </p>
                </div>
                <div className="text-slate-300 dark:text-slate-700">
                  <Minus size={16} />
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">
                    Committed (WIP)
                  </p>
                  <p className="text-xl font-mono font-black text-amber-500">
                    {item.committed}
                  </p>
                </div>
                <div className="text-slate-300 dark:text-slate-700 font-black">
                  =
                </div>
                <div className="text-center min-w-[80px]">
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                    Available
                  </p>
                  <p className="text-3xl font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {item.available}
                  </p>
                </div>
              </div>

              {/* Actions & Status */}
              <div className="flex flex-col items-end gap-3 min-w-[180px]">
                <div
                  className={`px-3 py-1.5 rounded-lg border ${status.bg} ${status.border} ${status.color} flex items-center gap-2 text-[10px] font-black uppercase tracking-widest w-full justify-center`}
                >
                  {status.icon} {status.label}
                </div>

                <div className="flex w-full gap-2">
                  <button
                    onClick={() => setBranchModalItem(item)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 border border-slate-200 dark:border-white/10"
                  >
                    <Building size={12} /> Other Branches
                  </button>
                  <button
                    onClick={() => setFlagModalItem(item)}
                    className="py-2 px-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-rose-200 dark:border-rose-500/30"
                    title="Flag Discrepancy"
                  >
                    <Flag size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredInventory.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
            <Package
              size={40}
              className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
            />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
              No items found.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Try adjusting your search or category filter.
            </p>
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* MODAL: DISCREPANCY FLAGGER (Internal Control) */}
      {/* ======================================================================= */}
      {flagModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-white/10 animate-in zoom-in-95">
            <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-100 dark:border-rose-500/20 flex justify-between items-start">
              <div className="flex gap-3">
                <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
                  <Flag size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase italic">
                    Report Discrepancy
                  </h2>
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mt-1">
                    Audit Control • Notify Manager
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFlagModalItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFlagSubmit} className="p-6 space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Item to Flag
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                    {flagModalItem.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    System Physical Count
                  </p>
                  <p className="text-xl font-mono font-black text-slate-900 dark:text-white">
                    {flagModalItem.physical}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Actual Physical Count
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 focus:border-rose-500 rounded-xl outline-none text-lg font-mono font-black text-slate-900 dark:text-white transition-all"
                  value={actualCount}
                  onChange={(e) => setActualCount(e.target.value)}
                  placeholder="Enter what is actually on the shelf..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Reason / Note to Manager
                </label>
                <textarea
                  required
                  rows="3"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 focus:border-rose-500 rounded-xl outline-none text-xs font-bold text-slate-900 dark:text-white transition-all resize-none"
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="e.g., Found 2 broken bottles. / System says 5 but shelf is empty."
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setFlagModalItem(null)}
                  className="px-6 py-3 border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-500 transition-all flex items-center justify-center gap-2"
                >
                  Submit Audit Flag <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: CROSS-BRANCH VISIBILITY */}
      {/* ======================================================================= */}
      {branchModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10 animate-in zoom-in-95">
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase italic">
                  Cross-Branch Stock
                </h2>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">
                  {branchModalItem.sku}
                </p>
              </div>
              <button
                onClick={() => setBranchModalItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {branchModalItem.otherBranches.map((br, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-4 border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <Building size={16} className="text-slate-400" />
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase">
                      {br.branch}
                    </span>
                  </div>
                  {br.qty > 0 ? (
                    <span className="text-lg font-mono font-black text-emerald-500">
                      {br.qty}
                    </span>
                  ) : (
                    <span className="text-xs font-black text-rose-500 uppercase tracking-widest bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded">
                      Out
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={() => setBranchModalItem(null)}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockInventory;
