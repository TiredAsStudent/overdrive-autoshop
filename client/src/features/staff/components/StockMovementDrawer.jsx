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
  Printer,
  Building2,
} from "lucide-react";
import { inventoryService } from "../../../services/staff/inventory.service";

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

  const getTransactionColor = (type) => {
    if (["BILL_RECEIVED", "TRANSFER_IN"].includes(type)) {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
    }
    if (["SALES_INVOICE", "TRANSFER_OUT"].includes(type)) {
      return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
    }
    return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[600px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {details?.sku || "Loading..."}
                  </h2>
                  {details && (
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate max-w-[250px]">
                      {details.item_name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
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
                <div className="space-y-6">
                  {/* Stock Snapshot Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <Building2 size={14} className="text-slate-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Current On-Hand Stock
                      </p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {details.branch_stock?.quantity || 0}{" "}
                        <span className="text-xs text-slate-500 font-bold">
                          {details.uom}
                        </span>
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold mt-1">
                        Reorder at {details.branch_stock?.reorder_point || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                      <Calculator size={14} className="text-blue-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-1">
                        Total Cost Valuation
                      </p>
                      <p className="text-xl font-black text-blue-700 dark:text-blue-400">
                        ₱
                        {(
                          (details.branch_stock?.quantity || 0) *
                          parseFloat(details.unit_cost)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-[10px] text-blue-600/70 dark:text-blue-500 font-medium mt-1">
                        Asset Balance Sheet Value
                      </p>
                    </div>
                  </div>

                  {/* Movement Ledger Table */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                      <History size={14} /> Immutable Movement Ledger
                    </h3>

                    {history.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                          No movements recorded yet.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left whitespace-nowrap">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                                <th className="px-4 py-3">Date & Auth</th>
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
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${getTransactionColor(record.transaction_type)}`}
                                    >
                                      {record.transaction_type.replace(
                                        /_/g,
                                        " ",
                                      )}
                                    </span>
                                    <p className="text-[9px] text-blue-500 font-bold uppercase mt-1 tracking-widest">
                                      {record.transaction_reference}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 text-right">
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
                </div>
              )}
            </div>

            {/* Print Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => window.print()}
                disabled={!details || loading}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer size={16} /> Print Stock Ledger
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StockMovementDrawer;
