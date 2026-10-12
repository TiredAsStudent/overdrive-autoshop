import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRightLeft,
  Package,
  MapPin,
  Calculator,
  Layers,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { stockTransferService } from "../../../services/manager/stockTransfer.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const TransferDrawer = ({ isOpen, onClose, transferId }) => {
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && transferId) {
      setLoading(true);
      setError("");
      stockTransferService
        .getTransferDetails(transferId)
        .then((res) => setTransfer(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setTransfer(null);
    }
  }, [isOpen, transferId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
        className="relative w-full sm:w-[500px] lg:w-[650px] bg-slate-50 dark:bg-slate-900/95 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
      >
        <header className="flex justify-between items-center px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
              <ArrowRightLeft size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]">
                {loading ? "Loading..." : transfer?.transfer_reference}
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                {transfer
                  ? `Executed on ${new Date(transfer.created_at).toLocaleDateString()}`
                  : "Bulk Transfer Manifest"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 opacity-70">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Retrieving Manifest...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200 text-center flex items-center justify-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {transfer && !loading && (
            <>
              {/* STATUS BANNER */}
              <section className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Execution Status
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                    COMPLETED
                  </span>
                </div>
                <StatusBadge label="Completed" variant="success" />
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* LOGISTICS VECTOR */}
                <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Logistics Vector
                    </p>
                    <MapPin size={14} className="text-slate-400" />
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Extract From
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {transfer.source_branch_name}
                        </span>
                      </div>
                    </div>
                    <div className="w-0.5 h-4 bg-slate-200 dark:bg-slate-700 ml-1"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Deposit To
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {transfer.destination_branch_name}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ASSET VALUATION */}
                <section className="bg-blue-50 dark:bg-blue-500/5 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-blue-200 dark:border-blue-500/20 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                        Total Asset Value
                      </p>
                      <Calculator size={14} className="text-blue-500" />
                    </div>
                    <p className="text-xs font-bold text-blue-800/70 dark:text-blue-400/80 mb-4">
                      Cumulative unit cost valuation
                    </p>
                  </div>
                  <span className="text-3xl sm:text-4xl font-black tracking-tight font-mono text-blue-700 dark:text-blue-400 text-right">
                    ₱
                    {parseFloat(transfer.total_asset_value).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 },
                    )}
                  </span>
                </section>
              </div>

              {/* ITEMIZED MANIFEST TABLE */}
              <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Layers size={14} /> Itemized Transferred Parts
                  </h3>
                  <div className="flex gap-4">
                    <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded">
                      {transfer.total_items} Line Items
                    </span>
                    <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">
                      {transfer.total_quantity} Units
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-700">
                        <th className="px-5 py-4 w-[50%]">Item Description</th>
                        <th className="px-5 py-4 text-center">Qty</th>
                        <th className="px-5 py-4 text-right">Unit Cost</th>
                        <th className="px-5 py-4 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {transfer.items.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-5 py-4">
                            <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase mb-0.5">
                              {item.sku}
                            </p>
                            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase truncate max-w-[250px]">
                              {item.item_name}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="text-xs font-black bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg">
                              {item.quantity}{" "}
                              <span className="text-[9px] uppercase tracking-widest opacity-60 ml-1">
                                {item.uom}
                              </span>
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-[10px] font-mono font-bold text-slate-500">
                              ₱
                              {parseFloat(
                                item.recorded_unit_cost,
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                              ₱
                              {(
                                item.quantity *
                                parseFloat(item.recorded_unit_cost)
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* REASON & AUDIT CARD */}
              <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  Logistics Reason / Notes
                </p>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900 p-5 rounded-[16px] border border-slate-100 dark:border-slate-800/50 flex-1 leading-relaxed mb-6">
                  "{transfer.reason}"
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700/50 pt-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Audit Trail Execution
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Executed by: {transfer.first_name} {transfer.last_name}
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TransferDrawer;
