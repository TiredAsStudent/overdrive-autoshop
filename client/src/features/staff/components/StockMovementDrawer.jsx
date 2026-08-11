import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  Loader2,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Building2,
} from "lucide-react";
import { inventoryService } from "../../../services/staff/inventory.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const StockMovementDrawer = ({ isOpen, onClose, itemId }) => {
  const [details, setDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && itemId) {
      setLoading(true);
      setError("");

      Promise.all([
        inventoryService.getItemDetails(itemId),
        inventoryService.getMovementHistory(itemId),
      ])
        .then(([detailsRes, historyRes]) => {
          setDetails(detailsRes.data);
          setHistory(historyRes.data);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setDetails(null);
      setHistory([]);
    }
  }, [isOpen, itemId]);

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

  const getTransactionVariant = (type) => {
    if (["BILL_RECEIVED", "TRANSFER_IN"].includes(type)) return "success";
    if (["SALES_INVOICE", "TRANSFER_OUT"].includes(type)) return "danger";
    return "default";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* 1. Standardized Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* 2. Standardized Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            className="relative w-full sm:w-[500px] lg:w-[600px] bg-slate-50 dark:bg-slate-900/95 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
          >
            {/* 3. Standardized Fixed Header */}
            <header className="flex justify-between items-center px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <Package size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {details?.sku || "Loading Profile..."}
                  </h2>
                  {details && (
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate max-w-[250px] sm:max-w-[350px]">
                      {details.item_name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </header>

            {/* 4. Standardized Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Retrieving Ledger...
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200">
                  {error}
                </div>
              )}

              {details && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Stock Snapshot Cards */}
                  <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-3 text-slate-400">
                        <Building2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Current On-Hand Stock
                        </span>
                      </div>
                      <p className="text-3xl font-black text-slate-900 dark:text-white">
                        {details.branch_stock?.quantity || 0}{" "}
                        <span className="text-sm text-slate-500 font-bold ml-1 opacity-70">
                          {details.uom}
                        </span>
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold mt-2 uppercase tracking-widest">
                        Reorder Point:{" "}
                        {details.branch_stock?.reorder_point || 0}
                      </p>
                    </div>

                    <div className="p-5 sm:p-6 bg-blue-50 dark:bg-blue-500/5 rounded-[20px] sm:rounded-[24px] border border-blue-200 dark:border-blue-500/20 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-3 text-blue-500 dark:text-blue-400">
                        <Calculator size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Total Cost Valuation
                        </span>
                      </div>
                      <p className="text-3xl font-black text-blue-700 dark:text-blue-400 font-mono tracking-tight">
                        ₱
                        {(
                          (details.branch_stock?.quantity || 0) *
                          parseFloat(details.unit_cost)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-[10px] text-blue-600/70 dark:text-blue-500 font-bold mt-2 uppercase tracking-widest">
                        Asset Balance Sheet Value
                      </p>
                    </div>
                  </section>

                  {/* Movement Ledger Table */}
                  <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5 flex items-center gap-2">
                      <History size={16} className="text-amber-500" /> Immutable
                      Movement Ledger
                    </h3>

                    {history.length === 0 ? (
                      <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/30 rounded-[16px] border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          No movements recorded yet.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[16px] overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-left whitespace-nowrap">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700">
                                <th className="px-5 py-4">Date & Auth</th>
                                <th className="px-5 py-4">Transaction</th>
                                <th className="px-5 py-4 text-right">
                                  Movement
                                </th>
                                <th className="px-5 py-4 text-right">
                                  Balance
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                              {history.map((record) => (
                                <tr
                                  key={record.id}
                                  className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                                >
                                  <td className="px-5 py-4">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                      {formatDate(record.created_at)}
                                    </p>
                                    <p className="text-[9px] font-medium text-slate-400 uppercase mt-0.5 tracking-widest">
                                      By: {record.first_name || "System"}{" "}
                                      {record.last_name || ""}
                                    </p>
                                  </td>
                                  <td className="px-5 py-4">
                                    <StatusBadge
                                      label={record.transaction_type.replace(
                                        /_/g,
                                        " ",
                                      )}
                                      variant={getTransactionVariant(
                                        record.transaction_type,
                                      )}
                                    />
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mt-1.5 tracking-widest">
                                      {record.transaction_reference}
                                    </p>
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    {record.quantity_added > 0 && (
                                      <span className="inline-flex items-center gap-1 text-emerald-500 text-[11px] font-black justify-end">
                                        <ArrowUpRight size={12} /> +
                                        {record.quantity_added}
                                      </span>
                                    )}
                                    {record.quantity_deducted > 0 && (
                                      <span className="inline-flex items-center gap-1 text-red-500 text-[11px] font-black justify-end">
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
                                  <td className="px-5 py-4 text-right text-sm font-black text-slate-900 dark:text-white font-mono">
                                    {record.remaining_quantity}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StockMovementDrawer;
