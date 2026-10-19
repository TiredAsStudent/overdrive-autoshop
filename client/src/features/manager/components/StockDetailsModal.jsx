import React, { useState, useEffect, useId } from "react";
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
import StatusBadge from "../../../components/ui/StatusBadge";
import Pagination from "../../../components/shared/Pagination";

const ITEMS_PER_PAGE = 10;

const StockDetailsModal = ({ isOpen, onClose, item }) => {
  const modalTitleId = useId();
  const breakdownTabId = useId();
  const historyTabId = useId();
  const breakdownPanelId = useId();
  const historyPanelId = useId();

  const [activeTab, setActiveTab] = useState("breakdown");
  const [breakdown, setBreakdown] = useState([]);
  const [history, setHistory] = useState([]);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Close modal on Escape key
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

  // Reset states when opening the modal
  useEffect(() => {
    if (isOpen) {
      setActiveTab("breakdown");
      setCurrentPage(1);
      setError("");
    }
  }, [isOpen, item]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!isOpen || !item) return;
      try {
        setError("");
        if (activeTab === "breakdown") {
          setLoading(true);
          const res = await inventoryService.getBranchBreakdown(item.id);
          if (isMounted) setBreakdown(res.data || []);
        } else {
          setLoadingHistory(true);
          const res = await inventoryService.getMovementHistory(
            item.id,
            currentPage,
            ITEMS_PER_PAGE,
            "all",
          );
          if (isMounted) {
            setHistory(res.data || []);
            setTotalPages(res.pagination?.totalPages || 1);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.message || "Unable to extract enterprise stock ledger data.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingHistory(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, item, activeTab, currentPage]);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "history") {
      setCurrentPage(1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && item && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90dvh] sm:max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 shrink-0 border-b border-slate-100 dark:border-slate-700/50 gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl shrink-0"
                >
                  <Package
                    className="text-blue-600 dark:text-blue-400"
                    size={24}
                  />
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-md"
                    title={item.item_name}
                  >
                    {item.item_name}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    <span className="font-mono tabular-nums">
                      SKU: {item.sku}
                    </span>{" "}
                    • {item.uom}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close stock details modal"
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div
              role="tablist"
              aria-label="Stock details views"
              className="flex px-6 sm:px-8 border-b border-slate-100 dark:border-slate-700/50 shrink-0 overflow-x-auto custom-scrollbar"
            >
              <button
                id={breakdownTabId}
                type="button"
                role="tab"
                aria-selected={activeTab === "breakdown"}
                aria-controls={breakdownPanelId}
                onClick={() => handleTabChange("breakdown")}
                className={`px-4 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === "breakdown"
                    ? "border-amber-500 text-amber-600 dark:text-overdrive-yellow"
                    : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Network size={16} aria-hidden="true" />
                <span>Branch Extraction</span>
              </button>
              <button
                id={historyTabId}
                type="button"
                role="tab"
                aria-selected={activeTab === "history"}
                aria-controls={historyPanelId}
                onClick={() => handleTabChange("history")}
                className={`px-4 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === "history"
                    ? "border-amber-500 text-amber-600 dark:text-overdrive-yellow"
                    : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <History size={16} aria-hidden="true" />
                <span>Movement Ledger</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/70 dark:bg-transparent min-h-[300px]">
              {loading ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-center justify-center py-12 text-amber-500"
                >
                  <Loader2
                    size={32}
                    aria-hidden="true"
                    className="animate-spin mb-4"
                  />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Extracting Enterprise Data...
                  </p>
                </div>
              ) : error ? (
                <div role="alert" className="form-error-banner">
                  <AlertTriangle
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <span>{error}</span>
                </div>
              ) : (
                <>
                  {/* TAB 1: BRANCH BREAKDOWN */}
                  {activeTab === "breakdown" && (
                    <div
                      id={breakdownPanelId}
                      role="tabpanel"
                      aria-labelledby={breakdownTabId}
                      className="grid grid-cols-1 gap-3"
                    >
                      {breakdown.length === 0 ? (
                        <p className="text-center text-slate-400 dark:text-slate-500 py-8 text-xs font-bold uppercase tracking-widest">
                          No active branches found.
                        </p>
                      ) : (
                        breakdown.map((branch) => (
                          <div
                            key={branch.branch_id}
                            className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                aria-hidden="true"
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0"
                              >
                                <Building2 size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                                  {branch.branch_name}
                                </p>
                                <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                                  Code: {branch.branch_code} • Reorder at:{" "}
                                  {branch.reorder_point}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-5 sm:gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/50">
                              <div className="text-left sm:text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">
                                  Physical Stock
                                </p>
                                <p className="text-xl font-mono tabular-nums font-black text-slate-900 dark:text-white">
                                  {branch.quantity}
                                </p>
                              </div>
                              <div
                                aria-hidden="true"
                                className="h-10 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"
                              />
                              <div className="text-right">
                                <StatusBadge
                                  label={branch.stock_status}
                                  variant={
                                    branch.stock_status === "In Stock"
                                      ? "success"
                                      : branch.stock_status === "Low Stock"
                                        ? "warning"
                                        : "danger"
                                  }
                                  icon={
                                    branch.stock_status === "In Stock"
                                      ? ShieldCheck
                                      : branch.stock_status === "Low Stock"
                                        ? AlertTriangle
                                        : XCircle
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 2: MOVEMENT HISTORY (STOCK LEDGER) */}
                  {activeTab === "history" && (
                    <div
                      id={historyPanelId}
                      role="tabpanel"
                      aria-labelledby={historyTabId}
                      className="space-y-4"
                    >
                      {history.length === 0 && !loadingHistory ? (
                        <p className="text-center text-slate-400 dark:text-slate-500 py-8 text-xs font-bold uppercase tracking-widest">
                          No movement records found.
                        </p>
                      ) : (
                        <>
                          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden relative">
                            {loadingHistory && (
                              <div
                                role="status"
                                aria-live="polite"
                                className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs z-20 flex flex-col items-center justify-center"
                              >
                                <Loader2
                                  aria-hidden="true"
                                  className="h-6 w-6 text-amber-500 animate-spin"
                                />
                              </div>
                            )}

                            <div className="overflow-x-auto custom-scrollbar">
                              <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                                <caption className="sr-only">
                                  Stock Movement History Ledger
                                </caption>
                                <thead>
                                  <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest border-b border-slate-200/80 dark:border-white/5">
                                    <th scope="col" className="px-4 py-3.5">
                                      Date & Time
                                    </th>
                                    <th scope="col" className="px-4 py-3.5">
                                      Branch Location
                                    </th>
                                    <th scope="col" className="px-4 py-3.5">
                                      Transaction
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-4 py-3.5 text-right"
                                    >
                                      Movement
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-4 py-3.5 text-right"
                                    >
                                      Balance
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                  {history.map((record) => (
                                    <tr
                                      key={record.id}
                                      className="table-row-hover"
                                    >
                                      <td className="px-4 py-3.5">
                                        <p className="text-[11px] font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                                          {formatDate(record.created_at)}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-0.5 tracking-wider">
                                          By: {record.first_name || "System"}{" "}
                                          {record.last_name || ""}
                                        </p>
                                      </td>
                                      <td className="px-4 py-3.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                                        {record.branch_name}
                                      </td>
                                      <td className="px-4 py-3.5">
                                        <StatusBadge
                                          label={(
                                            record.transaction_type || "LEDGER"
                                          ).replace(/_/g, " ")}
                                          variant={
                                            [
                                              "BILL_RECEIVED",
                                              "TRANSFER_IN",
                                            ].includes(record.transaction_type)
                                              ? "success"
                                              : [
                                                    "SALES_INVOICE",
                                                    "TRANSFER_OUT",
                                                  ].includes(
                                                    record.transaction_type,
                                                  )
                                                ? "danger"
                                                : "default"
                                          }
                                          className="!py-0.5 !px-2"
                                        />
                                        <p className="text-[10px] font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400 uppercase mt-1.5 tracking-widest">
                                          {record.transaction_reference}
                                        </p>
                                      </td>
                                      <td className="px-4 py-3.5 text-right">
                                        {record.quantity_added > 0 && (
                                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-mono tabular-nums font-black">
                                            <ArrowUpRight
                                              size={12}
                                              aria-hidden="true"
                                            />
                                            +{record.quantity_added}
                                          </span>
                                        )}
                                        {record.quantity_deducted > 0 && (
                                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-mono tabular-nums font-black">
                                            <ArrowDownRight
                                              size={12}
                                              aria-hidden="true"
                                            />
                                            -{record.quantity_deducted}
                                          </span>
                                        )}
                                        {record.quantity_added === 0 &&
                                          record.quantity_deducted === 0 && (
                                            <span className="text-slate-400 text-xs font-mono tabular-nums font-black">
                                              -
                                            </span>
                                          )}
                                      </td>
                                      <td className="px-4 py-3.5 text-right text-sm font-mono tabular-nums font-black text-slate-900 dark:text-white">
                                        {record.remaining_quantity}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                          />
                        </>
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
