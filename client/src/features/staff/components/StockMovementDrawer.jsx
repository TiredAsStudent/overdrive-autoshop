import React, { useState, useEffect, useId } from "react";
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
  AlertCircle,
} from "lucide-react";
import { inventoryService } from "../../../services/staff/inventory.service";
import StatusBadge from "../../../components/ui/StatusBadge";
import Pagination from "../../../components/shared/Pagination";
import { useApp } from "../../../context/AppContext";

const ITEMS_PER_PAGE = 10;

const StockMovementDrawer = ({ isOpen, onClose, itemId }) => {
  const { showToast } = useApp();
  const [details, setDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && itemId) {
      setLoading(true);
      setError("");
      setCurrentPage(1); // Reset to page 1 on fresh open

      Promise.all([
        inventoryService.getItemDetails(itemId),
        inventoryService.getMovementHistory(itemId, 1, ITEMS_PER_PAGE),
      ])
        .then(([detailsRes, historyRes]) => {
          if (!isMounted) return;
          setDetails(detailsRes.data);
          setHistory(historyRes.data || []);
          setTotalPages(historyRes.pagination?.totalPages || 1);
        })
        .catch((err) => {
          if (isMounted) {
            setError(
              err.message || "Unable to retrieve stock movement ledger.",
            );
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setDetails(null);
      setHistory([]);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, itemId]);

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

  const handlePageChange = async (newPage) => {
    setCurrentPage(newPage);
    setLoadingHistory(true);
    try {
      const res = await inventoryService.getMovementHistory(
        itemId,
        newPage,
        ITEMS_PER_PAGE,
      );
      setHistory(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      showToast(err.message || "Failed to load movement page.", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
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
            className="relative h-full h-dvh w-full sm:w-[520px] lg:w-[640px] bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
          >
            {/* Header */}
            <header className="flex justify-between items-center px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <Package size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]"
                  >
                    {details?.sku || "Loading Profile..."}
                  </h2>
                  {details && (
                    <p
                      className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate max-w-[240px] sm:max-w-[350px]"
                      title={details.item_name}
                    >
                      {details.item_name}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Close stock movement drawer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {/* Scrollable Body */}
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
                    Retrieving Ledger...
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

              {details && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Stock Snapshot Cards */}
                  <section className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-5">
                    <div className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between min-w-0">
                      <div className="flex items-center gap-2 mb-3 text-slate-500 dark:text-slate-400">
                        <Building2
                          size={16}
                          aria-hidden="true"
                          className="text-amber-600 dark:text-overdrive-yellow shrink-0"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">
                          Current On-Hand Stock
                        </span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white truncate">
                        {details.branch_stock?.quantity || 0}{" "}
                        <span className="text-xs sm:text-sm font-sans text-slate-500 dark:text-slate-400 font-bold ml-1 uppercase">
                          {details.uom}
                        </span>
                      </p>
                      <p className="text-[10px] font-mono tabular-nums text-amber-600 dark:text-overdrive-yellow font-bold mt-2 uppercase tracking-widest">
                        Reorder Point:{" "}
                        {details.branch_stock?.reorder_point || 0}
                      </p>
                    </div>

                    <div className="p-5 sm:p-6 bg-blue-50 dark:bg-blue-500/5 rounded-[20px] sm:rounded-[24px] border border-blue-200 dark:border-blue-500/20 shadow-xs flex flex-col justify-between min-w-0">
                      <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                        <Calculator
                          size={16}
                          aria-hidden="true"
                          className="shrink-0"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">
                          Total Cost Valuation
                        </span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-400 font-mono tabular-nums tracking-tight truncate">
                        ₱
                        {formatCurrency(
                          (details.branch_stock?.quantity || 0) *
                            (parseFloat(details.unit_cost) || 0),
                        )}
                      </p>
                      <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-bold mt-2 uppercase tracking-widest truncate">
                        Asset Balance Sheet Value
                      </p>
                    </div>
                  </section>

                  {/* Movement Ledger Table */}
                  <section
                    aria-busy={loadingHistory}
                    className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col relative overflow-hidden"
                  >
                    {loadingHistory && (
                      <div
                        role="status"
                        aria-live="polite"
                        className="absolute inset-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xs z-20 flex flex-col items-center justify-center"
                      >
                        <Loader2
                          aria-hidden="true"
                          className="h-6 w-6 text-amber-500 animate-spin"
                        />
                      </div>
                    )}

                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-5 flex items-center gap-2">
                      <History
                        size={16}
                        aria-hidden="true"
                        className="text-amber-500 dark:text-overdrive-yellow"
                      />
                      <span>Immutable Movement Ledger</span>
                    </h3>

                    {history.length === 0 ? (
                      <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          No movements recorded yet.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                          <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left whitespace-nowrap">
                              <caption className="sr-only">
                                Immutable stock movement history ledger
                              </caption>
                              <thead>
                                <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700">
                                  <th
                                    scope="col"
                                    className="px-4 sm:px-5 py-3.5"
                                  >
                                    Date & Auth
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 sm:px-5 py-3.5"
                                  >
                                    Transaction
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 sm:px-5 py-3.5 text-right"
                                  >
                                    Movement
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 sm:px-5 py-3.5 text-right"
                                  >
                                    Balance
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {history.map((record) => (
                                  <tr
                                    key={record.id}
                                    className="table-row-hover"
                                  >
                                    <td className="px-4 sm:px-5 py-3.5">
                                      <p className="text-xs font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                                        {formatDate(record.created_at)}
                                      </p>
                                      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-0.5 tracking-widest">
                                        By: {record.first_name || "System"}{" "}
                                        {record.last_name || ""}
                                      </p>
                                    </td>
                                    <td className="px-4 sm:px-5 py-3.5">
                                      <StatusBadge
                                        label={
                                          record.transaction_type
                                            ? record.transaction_type.replace(
                                                /_/g,
                                                " ",
                                              )
                                            : "ADJUSTMENT"
                                        }
                                        variant={getTransactionVariant(
                                          record.transaction_type,
                                        )}
                                      />
                                      <p className="text-[10px] font-mono tabular-nums text-blue-600 dark:text-blue-400 font-bold uppercase mt-1.5 tracking-widest">
                                        {record.transaction_reference}
                                      </p>
                                    </td>
                                    <td className="px-4 sm:px-5 py-3.5 text-right">
                                      {record.quantity_added > 0 && (
                                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-mono tabular-nums font-black justify-end">
                                          <ArrowUpRight
                                            size={13}
                                            aria-hidden="true"
                                          />
                                          <span>+{record.quantity_added}</span>
                                        </span>
                                      )}
                                      {record.quantity_deducted > 0 && (
                                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-mono tabular-nums font-black justify-end">
                                          <ArrowDownRight
                                            size={13}
                                            aria-hidden="true"
                                          />
                                          <span>
                                            -{record.quantity_deducted}
                                          </span>
                                        </span>
                                      )}
                                      {record.quantity_added === 0 &&
                                        record.quantity_deducted === 0 && (
                                          <span className="text-slate-400 text-xs font-mono tabular-nums font-black">
                                            0
                                          </span>
                                        )}
                                    </td>
                                    <td className="px-4 sm:px-5 py-3.5 text-right text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums">
                                      {record.remaining_quantity}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Standardized Reusable Pagination */}
                        <div className="mt-4">
                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                          />
                        </div>
                      </>
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
