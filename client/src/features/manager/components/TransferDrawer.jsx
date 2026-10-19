import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRightLeft,
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
  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && transferId) {
      setLoading(true);
      setError("");
      stockTransferService
        .getTransferDetails(transferId)
        .then((res) => {
          if (isMounted) setTransfer(res.data);
        })
        .catch((err) => {
          if (isMounted) {
            setError(err.message || "Unable to retrieve transfer manifest.");
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setTransfer(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, transferId]);

  // Close drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            className="relative h-full h-dvh w-full sm:w-[500px] lg:w-[650px] bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            <header className="flex justify-between items-center px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <ArrowRightLeft size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]"
                  >
                    {loading
                      ? "Loading..."
                      : transfer?.transfer_reference || "Transfer Manifest"}
                  </h2>
                  <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {transfer
                      ? `Executed on ${formatDate(transfer.created_at)}`
                      : "Bulk Transfer Manifest"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close transfer manifest drawer"
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {loading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-center justify-center py-20 opacity-80"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-8 h-8 animate-spin mb-3 text-amber-500"
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Retrieving Manifest...
                  </p>
                </div>
              )}

              {error && !loading && (
                <div role="alert" className="form-error-banner">
                  <AlertCircle
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <span>{error}</span>
                </div>
              )}

              {transfer && !loading && (
                <>
                  {/* STATUS BANNER */}
                  <section className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">
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
                    <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Logistics Vector
                        </p>
                        <MapPin
                          size={14}
                          aria-hidden="true"
                          className="text-slate-400"
                        />
                      </div>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            aria-hidden="true"
                            className="w-2 h-2 rounded-full bg-rose-500 shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              Extract From
                            </span>
                            <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                              {transfer.source_branch_name}
                            </span>
                          </div>
                        </div>
                        <div
                          aria-hidden="true"
                          className="w-0.5 h-4 bg-slate-200 dark:bg-slate-700 ml-1"
                        />
                        <div className="flex items-center gap-3">
                          <div
                            aria-hidden="true"
                            className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              Deposit To
                            </span>
                            <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                              {transfer.destination_branch_name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* ASSET VALUATION */}
                    <section className="bg-blue-50 dark:bg-blue-500/5 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-blue-200 dark:border-blue-500/20 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                            Total Asset Value
                          </p>
                          <Calculator
                            size={14}
                            aria-hidden="true"
                            className="text-blue-500"
                          />
                        </div>
                        <p className="text-xs font-bold text-blue-800/70 dark:text-blue-400/80 mb-4">
                          Cumulative unit cost valuation
                        </p>
                      </div>
                      <span className="text-2xl sm:text-3xl font-black tracking-tight font-mono tabular-nums text-blue-700 dark:text-blue-400 text-right truncate">
                        ₱{formatCurrency(transfer.total_asset_value)}
                      </span>
                    </section>
                  </div>

                  {/* ITEMIZED MANIFEST TABLE */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap justify-between items-center gap-3">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Layers
                          size={14}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow"
                        />
                        <span>Itemized Transferred Parts</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-mono tabular-nums font-black uppercase text-amber-700 dark:text-overdrive-yellow bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 px-2.5 py-1 rounded-md">
                          {transfer.total_items} Line Items
                        </span>
                        <span className="text-[10px] font-mono tabular-nums font-black uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 px-2.5 py-1 rounded-md">
                          {transfer.total_quantity} Units
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left whitespace-nowrap min-w-[500px]">
                        <caption className="sr-only">
                          Itemized transferred parts manifest
                        </caption>
                        <thead>
                          <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest border-b border-slate-200/80 dark:border-slate-700">
                            <th scope="col" className="px-5 py-4 w-[50%]">
                              Item Description
                            </th>
                            <th scope="col" className="px-5 py-4 text-center">
                              Qty
                            </th>
                            <th scope="col" className="px-5 py-4 text-right">
                              Unit Cost
                            </th>
                            <th scope="col" className="px-5 py-4 text-right">
                              Line Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {(transfer.items || []).map((item) => {
                            const qty = parseInt(item.quantity, 10) || 0;
                            const unitCost =
                              parseFloat(item.recorded_unit_cost) || 0;
                            const lineTotal = qty * unitCost;

                            return (
                              <tr key={item.id} className="table-row-hover">
                                <td className="px-5 py-4">
                                  <p className="text-[10px] font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow tracking-widest uppercase mb-0.5">
                                    {item.sku}
                                  </p>
                                  <p
                                    className="text-xs font-bold text-slate-900 dark:text-white uppercase truncate max-w-[250px]"
                                    title={item.item_name}
                                  >
                                    {item.item_name}
                                  </p>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className="text-xs font-mono tabular-nums font-black bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                                    {qty}{" "}
                                    <span className="text-[9px] font-sans uppercase tracking-widest opacity-70 ml-1">
                                      {item.uom}
                                    </span>
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span className="text-[11px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400">
                                    ₱{formatCurrency(unitCost)}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white">
                                    ₱{formatCurrency(lineTotal)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* REASON & AUDIT CARD */}
                  <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                      Logistics Reason / Notes
                    </p>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex-1 leading-relaxed mb-6">
                      "{transfer.reason}"
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-700/50 pt-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
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
      )}
    </AnimatePresence>
  );
};

export default TransferDrawer;
