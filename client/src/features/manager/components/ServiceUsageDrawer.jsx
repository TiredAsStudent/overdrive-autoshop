import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Activity, FileText } from "lucide-react";
import { serviceCatalogService } from "../../../services/manager/serviceCatalog.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const ServiceUsageDrawer = ({ isOpen, onClose, service }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && service?.id) {
      setLoading(true);
      setError("");
      serviceCatalogService
        .getServiceUsage(service.id)
        .then((res) => setHistory(res.data || []))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setHistory([]);
    }
  }, [isOpen, service]);

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

  const getInvoiceVariant = (status) => {
    if (status === "PAID") return "success";
    if (status === "UNPAID" || status === "PARTIALLY_PAID") return "warning";
    if (status === "OVERDUE" || status === "VOID") return "danger";
    return "default";
  };

  if (!service) return null;

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
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-500 shrink-0">
                  <Activity size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]">
                    Service Utilization
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                    {service.service_code} • {service.service_name}
                  </p>
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
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Extracting Ledger...
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200">
                  {error}
                </div>
              )}

              {!loading && !error && (
                <>
                  {/* STATUS/SUMMARY BANNER */}
                  <section className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                        Utilization Overview
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                        {history.length} Transactions
                      </span>
                    </div>
                    <StatusBadge label="Historical Data" variant="info" />
                  </section>

                  {/* BILLING HISTORY CARD */}
                  <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Billing History Ledger
                      </p>
                      <FileText size={16} className="text-blue-500" />
                    </div>

                    {history.length === 0 ? (
                      <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[16px] border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          No transactions recorded yet.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[16px] overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-left whitespace-nowrap">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700">
                                <th className="px-5 py-4">Transaction Date</th>
                                <th className="px-5 py-4">Invoice Ref</th>
                                <th className="px-5 py-4 text-right">
                                  Billed Value
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                              {history.map((record, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                                >
                                  <td className="px-5 py-4">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                      {formatDate(record.created_at)}
                                    </p>
                                    <p className="text-[9px] font-medium text-slate-400 uppercase mt-0.5 tracking-widest truncate max-w-[120px]">
                                      {record.customer_name || "Walk-in"}
                                    </p>
                                  </td>
                                  <td className="px-5 py-4">
                                    <p className="text-[10px] text-slate-900 dark:text-white font-bold uppercase tracking-widest mb-1">
                                      {record.invoice_number}
                                    </p>
                                    <StatusBadge
                                      label={record.status.replace(/_/g, " ")}
                                      variant={getInvoiceVariant(record.status)}
                                    />
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                                      ₱
                                      {(
                                        record.quantity *
                                          parseFloat(
                                            record.recorded_selling_price,
                                          ) -
                                        parseFloat(record.discount_amount)
                                      ).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                      })}
                                    </p>
                                    <p className="text-[9px] text-slate-400 tracking-widest uppercase mt-0.5">
                                      Qty: {record.quantity}
                                    </p>
                                  </td>
                                </tr>
                              ))}
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
