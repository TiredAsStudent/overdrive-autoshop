import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Activity, FileText, AlertCircle } from "lucide-react";
import { serviceCatalogService } from "../../../services/manager/serviceCatalog.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const ServiceUsageDrawer = ({ isOpen, onClose, service }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && service?.id) {
      setLoading(true);
      setError("");
      serviceCatalogService
        .getServiceUsage(service.id)
        .then((res) => {
          if (isMounted) setHistory(res.data || []);
        })
        .catch((err) => {
          if (isMounted) {
            setError(
              err.message || "Unable to retrieve service billing history.",
            );
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setHistory([]);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, service]);

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

  const getInvoiceVariant = (status) => {
    if (status === "PAID") return "success";
    if (status === "UNPAID" || status === "PARTIALLY_PAID") return "warning";
    if (status === "OVERDUE" || status === "VOID") return "danger";
    return "default";
  };

  return (
    <AnimatePresence>
      {isOpen && service && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* 1. Standardized Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
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
            className="relative h-full h-dvh w-full sm:w-[500px] lg:w-[600px] bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
          >
            {/* 3. Standardized Fixed Header */}
            <header className="flex justify-between items-center px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0"
                >
                  <Activity size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]"
                  >
                    Service Utilization
                  </h2>
                  <p
                    className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate"
                    title={`${service.service_code} • ${service.service_name}`}
                  >
                    <span className="font-mono tabular-nums">
                      {service.service_code}
                    </span>{" "}
                    • {service.service_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Close service utilization drawer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {/* 4. Standardized Scrollable Body */}
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
                    Extracting Ledger...
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

              {!loading && !error && (
                <>
                  {/* STATUS/SUMMARY BANNER */}
                  <section className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">
                        Utilization Overview
                      </span>
                      <span className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                        {history.length} Transactions
                      </span>
                    </div>
                    <StatusBadge label="Historical Data" variant="info" />
                  </section>

                  {/* BILLING HISTORY CARD */}
                  <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                        Billing History Ledger
                      </h3>
                      <FileText
                        size={16}
                        aria-hidden="true"
                        className="text-amber-500 dark:text-overdrive-yellow"
                      />
                    </div>

                    {history.length === 0 ? (
                      <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          No transactions recorded yet.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-left whitespace-nowrap">
                            <caption className="sr-only">
                              Service billing history ledger
                            </caption>
                            <thead>
                              <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700">
                                <th scope="col" className="px-4 sm:px-5 py-3.5">
                                  Transaction Date
                                </th>
                                <th scope="col" className="px-4 sm:px-5 py-3.5">
                                  Invoice Ref
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 sm:px-5 py-3.5 text-right"
                                >
                                  Billed Value
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                              {history.map((record, index) => {
                                const qty = Number(record.quantity) || 1;
                                const unitPrice =
                                  parseFloat(record.recorded_selling_price) ||
                                  0;
                                const discount =
                                  parseFloat(record.discount_amount) || 0;
                                const billedValue = Math.max(
                                  0,
                                  qty * unitPrice - discount,
                                );

                                return (
                                  <tr
                                    key={
                                      record.id ||
                                      `${record.invoice_number}-${index}`
                                    }
                                    className="table-row-hover"
                                  >
                                    <td className="px-4 sm:px-5 py-3.5">
                                      <p className="text-xs font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                                        {formatDate(record.created_at)}
                                      </p>
                                      <p
                                        className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-0.5 tracking-wider truncate max-w-[140px]"
                                        title={
                                          record.customer_name || "Walk-in"
                                        }
                                      >
                                        {record.customer_name || "Walk-in"}
                                      </p>
                                    </td>
                                    <td className="px-4 sm:px-5 py-3.5">
                                      <p className="text-[10px] font-mono tabular-nums text-slate-900 dark:text-white font-black uppercase tracking-widest mb-1">
                                        {record.invoice_number}
                                      </p>
                                      <StatusBadge
                                        label={
                                          record.status
                                            ? record.status.replace(/_/g, " ")
                                            : "POSTED"
                                        }
                                        variant={getInvoiceVariant(
                                          record.status,
                                        )}
                                      />
                                    </td>
                                    <td className="px-4 sm:px-5 py-3.5 text-right">
                                      <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums">
                                        ₱{formatCurrency(billedValue)}
                                      </p>
                                      <p className="text-[9px] font-mono tabular-nums text-slate-500 dark:text-slate-400 tracking-widest uppercase mt-0.5">
                                        Qty: {qty}
                                      </p>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
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

export default ServiceUsageDrawer;
