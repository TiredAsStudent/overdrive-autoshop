import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Network,
  Loader2,
  Building2,
  AlertTriangle,
  ShieldCheck,
  XCircle,
  History,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { inventoryService } from "../../../services/manager/inventory.service";

const StockDetailsModal = ({ isOpen, onClose, item }) => {
  const [activeTab, setActiveTab] = useState("breakdown");
  const [breakdown, setBreakdown] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !item) return;
      try {
        setLoading(true);
        setError("");
        if (activeTab === "breakdown") {
          const res = await inventoryService.getBranchBreakdown(item.id);
          setBreakdown(res.data || []);
        } else {
          const res = await inventoryService.getMovementHistory(item.id);
          setHistory(res.data || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, item, activeTab]);

  const getStatusDisplay = (status) => {
    if (status === "In Stock")
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
          <ShieldCheck size={12} /> In Stock
        </span>
      );
    if (status === "Low Stock")
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 text-[10px] font-black uppercase tracking-widest">
          <AlertTriangle size={12} /> Low Stock
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-[10px] font-black uppercase tracking-widest">
        <XCircle size={12} /> Out of Stock
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
                  <Package className="text-blue-500" size={24} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-md">
                    {item?.item_name}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    SKU: {item?.sku} • {item?.uom}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex px-6 sm:px-8 border-b border-slate-100 dark:border-slate-700/50">
              <button
                onClick={() => setActiveTab("breakdown")}
                className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${activeTab === "breakdown" ? "border-amber-500 text-amber-600 dark:text-amber-500" : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                <Network size={16} /> Branch Extraction
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${activeTab === "history" ? "border-amber-500 text-amber-600 dark:text-amber-500" : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                <History size={16} /> Movement Ledger
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 dark:bg-transparent min-h-[300px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-amber-500">
                  <Loader2 size={32} className="animate-spin mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Extracting Enterprise Data...
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500 font-medium text-sm">
                  {error}
                </div>
              ) : (
                <>
                  {/* TAB 1: BRANCH BREAKDOWN */}
                  {activeTab === "breakdown" && (
                    <div className="grid grid-cols-1 gap-3 animate-in fade-in">
                      {breakdown.length === 0 ? (
                        <p className="text-center text-slate-400 py-8 text-xs font-bold uppercase">
                          No active branches found.
                        </p>
                      ) : (
                        breakdown.map((branch) => (
                          <div
                            key={branch.branch_id}
                            className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                <Building2 size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                  {branch.branch_name}
                                </p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                  Code: {branch.branch_code} • Reorder at:{" "}
                                  {branch.reorder_point}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                  Physical Stock
                                </p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">
                                  {branch.quantity}
                                </p>
                              </div>
                              <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
                              <div className="flex-1 text-right">
                                {getStatusDisplay(branch.stock_status)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 2: MOVEMENT HISTORY (STOCK LEDGER) */}
                  {activeTab === "history" && (
                    <div className="animate-in fade-in">
                      {history.length === 0 ? (
                        <p className="text-center text-slate-400 py-8 text-xs font-bold uppercase">
                          No movement records found.
                        </p>
                      ) : (
                        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                                  <th className="px-4 py-3">Date & Time</th>
                                  <th className="px-4 py-3">Branch Location</th>
                                  <th className="px-4 py-3">Transaction</th>
                                  <th className="px-4 py-3 text-right">
                                    Movement
                                  </th>
                                  <th className="px-4 py-3 text-right">
                                    Balance
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {history.map((record) => (
                                  <tr
                                    key={record.id}
                                    className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                                  >
                                    <td className="px-4 py-3">
                                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                        {formatDate(record.created_at)}
                                      </p>
                                      <p className="text-[9px] text-slate-400 uppercase mt-0.5">
                                        By: {record.first_name || "System"}{" "}
                                        {record.last_name || ""}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                                      {record.branch_name}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                          [
                                            "BILL_RECEIVED",
                                            "TRANSFER_IN",
                                          ].includes(record.transaction_type)
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                            : [
                                                  "SALES_INVOICE",
                                                  "TRANSFER_OUT",
                                                ].includes(
                                                  record.transaction_type,
                                                )
                                              ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                        }`}
                                      >
                                        {record.transaction_type.replace(
                                          /_/g,
                                          " ",
                                        )}
                                      </span>
                                      <p className="text-[9px] text-blue-500 uppercase mt-1 tracking-widest">
                                        {record.transaction_reference}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      {record.quantity_added > 0 && (
                                        <span className="inline-flex items-center gap-1 text-emerald-500 text-[11px] font-black">
                                          <ArrowUpRight size={12} /> +
                                          {record.quantity_added}
                                        </span>
                                      )}
                                      {record.quantity_deducted > 0 && (
                                        <span className="inline-flex items-center gap-1 text-red-500 text-[11px] font-black">
                                          <ArrowDownRight size={12} /> -
                                          {record.quantity_deducted}
                                        </span>
                                      )}
                                      {record.quantity_added === 0 &&
                                        record.quantity_deducted === 0 && (
                                          <span className="text-slate-400 text-[11px] font-black">
                                            -
                                          </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-black text-slate-900 dark:text-white">
                                      {record.remaining_quantity}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StockDetailsModal;
