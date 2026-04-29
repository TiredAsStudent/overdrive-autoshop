import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  Package,
  ArrowRightLeft,
  Info,
  X,
  Building2,
  AlertTriangle,
} from "lucide-react";

// ==========================================
// MOCK DATA & CONSTANTS
// ==========================================
const MOCK_USER = { assigned_branch: "Batino Branch" };

const StockRoom = ({ user = MOCK_USER }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [selectedGlobalItem, setSelectedGlobalItem] = useState(null);

  // Mock Data: Local Inventory
  const [inventory] = useState([
    {
      id: "p1",
      sku: "OIL-FS-001",
      name: "Fully Synthetic Oil",
      category: "Lubricants",
      unit: "Liter",
      qty: 45,
      reserved: 8,
      min: 20,
    },
    {
      id: "p2",
      sku: "FIL-G-99",
      name: "Genuine Oil Filter",
      category: "Filters",
      unit: "Piece",
      qty: 5,
      reserved: 2,
      min: 10,
    },
    {
      id: "p3",
      sku: "TIR-ML-18",
      name: 'Michelin Primacy 4 (18")',
      category: "Tires",
      unit: "Piece",
      qty: 12,
      reserved: 0,
      min: 4,
    },
    {
      id: "p4",
      sku: "BRK-PD-02",
      name: "Brake Pads (Ceramic)",
      category: "Brakes",
      unit: "Set",
      qty: 8,
      reserved: 4,
      min: 5,
    },
  ]);

  // Mock Data: Cross-Branch Inventory Database
  const globalInventory = {
    "FIL-G-99": [
      { branch: "Biñan Main", qty: 24, status: "Healthy" },
      { branch: "Batino Branch", qty: 5, status: "Critical" },
      { branch: "Cabuyao Branch", qty: 0, status: "Out of Stock" },
    ],
    // Default fallback for demo
    default: [
      { branch: "Biñan Main", qty: 15, status: "Healthy" },
      { branch: "Batino Branch", qty: 0, status: "Critical" },
      { branch: "Cabuyao Branch", qty: 8, status: "Healthy" },
    ],
  };

  const getRowStatus = (item) => {
    if (item.qty <= item.min) return "red"; // Low Stock
    if (item.reserved > 0) return "blue"; // Committed/Reserved
    return "green"; // Healthy
  };

  const openGlobalSearch = (item = null) => {
    setSelectedGlobalItem(item);
    setShowGlobalModal(true);
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 py-6 max-w-[1600px] mx-auto">
      {/* 1. HEADER & GLOBAL QUERY */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
            Stock Room
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search Part or SKU..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl outline-none focus:border-amber-500 text-sm font-bold dark:text-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. THE LOCAL SHELF VIEW (Data Table) */}
      <div className="bg-white dark:bg-slate-800 rounded-[40px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/40 border-b border-slate-100 dark:border-white/5">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  Asset Identification
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  Category
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">
                  Physical Count
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">
                  WIP Reserved
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">
                  Available Stock
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredInventory.map((item) => {
                const status = getRowStatus(item);
                const available = item.qty - item.reserved;

                return (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Part Details */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-2xl ${
                            status === "red"
                              ? "bg-red-50 dark:bg-red-500/10 text-red-500"
                              : status === "blue"
                                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-500"
                                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
                          }`}
                        >
                          {status === "red" ? (
                            <AlertTriangle size={24} />
                          ) : (
                            <Package size={24} />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-base">
                            {item.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {item.sku}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10">
                        {item.category}
                      </span>
                    </td>

                    {/* Physical Count */}
                    <td className="px-8 py-6 text-center">
                      <p
                        className={`text-xl font-black ${status === "red" ? "text-red-500" : "text-slate-700 dark:text-gray-300"}`}
                      >
                        {item.qty}{" "}
                        <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                          {item.unit}
                        </span>
                      </p>
                    </td>

                    {/* Reserved (The Blue Logic) */}
                    <td className="px-8 py-6 text-center">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          item.reserved > 0
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20"
                            : "text-slate-300"
                        }`}
                      >
                        {item.reserved > 0 && (
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                        )}
                        {item.reserved} Locked
                      </div>
                    </td>

                    {/* Available to Sell */}
                    <td className="px-8 py-6 text-center">
                      <p
                        className={`text-2xl font-black ${available <= 0 ? "text-red-500 opacity-50" : "text-slate-900 dark:text-white tracking-tighter"}`}
                      >
                        {available}
                      </p>
                    </td>

                    {/* Action */}
                    <td className="px-8 py-6 text-right">
                      {status === "red" ? (
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors border border-amber-200 dark:border-amber-500/20">
                          <ArrowRightLeft size={14} /> Request Transfer
                        </button>
                      ) : (
                        <button className="p-3 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-xl hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                          <Info size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. FOOTER LEGEND */}
      <div className="flex flex-wrap gap-8 px-6 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 w-fit">
        <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />{" "}
          Healthy Inventory
        </div>
        <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />{" "}
          Critical / Restock Needed
        </div>
        <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />{" "}
          WIP Committed (Cannot Sell)
        </div>
      </div>

      {/* ========================================== */}
      {/* ENTERPRISE QUERY MODAL (Cross-Branch View) */}
      {/* ========================================== */}
      <AnimatePresence>
        {showGlobalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGlobalModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-start bg-blue-50 dark:bg-blue-500/5">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Globe className="text-blue-500" /> Enterprise Query Result
                  </h2>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">
                    Searching Global PostgreSQL Database
                  </p>
                </div>
                <button
                  onClick={() => setShowGlobalModal(false)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {selectedGlobalItem && (
                  <div className="p-6 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                        Target Asset
                      </p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">
                        {selectedGlobalItem.name}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-slate-500">
                      {selectedGlobalItem.sku}
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                    <Building2 size={14} /> Branch Availability
                  </p>

                  {(
                    globalInventory[selectedGlobalItem?.sku] ||
                    globalInventory["default"]
                  ).map((branchInfo, idx) => (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border flex items-center justify-between ${
                        branchInfo.branch === user.assigned_branch
                          ? "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-50"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-400">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">
                            {branchInfo.branch}
                          </p>
                          <p
                            className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                              branchInfo.status === "Healthy"
                                ? "text-emerald-500"
                                : branchInfo.status === "Critical"
                                  ? "text-amber-500"
                                  : "text-red-500"
                            }`}
                          >
                            Status: {branchInfo.status}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-6">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                            Stock
                          </p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">
                            {branchInfo.qty}
                          </p>
                        </div>
                        {branchInfo.qty > 0 &&
                          branchInfo.branch !== user.assigned_branch && (
                            <button className="px-4 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                              Request
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockRoom;
