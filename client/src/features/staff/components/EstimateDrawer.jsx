import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Calendar,
  Building2,
  User,
  Printer,
  Loader2,
  BadgeCheck,
  Clock,
  CheckCircle,
  FileCheck,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { estimateService } from "../../../services/staff/estimate.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const EstimateDrawer = ({ isOpen, onClose, estimateId }) => {
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && estimateId) {
      setLoading(true);
      setError("");
      estimateService
        .getEstimateDetails(estimateId)
        .then((res) => setEstimate(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setEstimate(null);
    }
  }, [isOpen, estimateId]);

  const getStatusVariant = (status) => {
    if (status === "PENDING_APPROVAL") return "warning";
    if (status === "APPROVED" || status === "CONVERTED") return "success";
    if (status === "REJECTED" || status === "EXPIRED") return "danger";
    return "default";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return Clock;
      case "APPROVED":
        return CheckCircle;
      case "CONVERTED":
        return FileCheck;
      case "REJECTED":
        return XCircle;
      case "EXPIRED":
        return AlertCircle;
      default:
        return FileText; // DRAFT
    }
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
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <FileText size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {estimate?.estimate_number || "Loading..."}
                  </h2>

                  {estimate && (
                    <div className="flex flex-col items-start gap-1.5 mt-1.5">
                      <StatusBadge
                        label={estimate.status.replace("_", " ")}
                        variant={getStatusVariant(estimate.status)}
                        icon={getStatusIcon(estimate.status)}
                      />

                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <BadgeCheck size={12} className="text-amber-500" />
                        Prepared by:{" "}
                        <span className="text-slate-600 dark:text-slate-300">
                          {estimate.created_by_name || "System"}
                        </span>
                      </span>
                    </div>
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
                <div className="flex flex-col items-center justify-center py-20 opacity-70">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Retrieving Document...
                  </p>
                </div>
              )}
              {error && (
                <div className="p-4 text-center bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200">
                  {error}
                </div>
              )}

              {estimate && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Meta Cards */}
                  <div className="grid grid-cols-2 gap-4 sm:gap-5">
                    <div className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                      <User size={16} className="text-slate-400 mb-3" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Customer
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {estimate.customer_name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                          {estimate.contact_number}
                        </p>
                      </div>
                    </div>
                    <div className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                      <Calendar size={16} className="text-slate-400 mb-3" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Valid Until
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {new Date(estimate.valid_until).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate font-medium">
                          <Building2 size={10} /> {estimate.branch_name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Itemized Breakdown
                      </h3>
                    </div>
                    <div className="p-5 sm:p-6 space-y-3">
                      {estimate.items.map((item) => {
                        const isService = item.line_type === "SERVICE";
                        const gross =
                          parseFloat(item.recorded_selling_price) *
                          item.quantity;
                        const net = gross - parseFloat(item.discount_amount);

                        return (
                          <div
                            key={item.id}
                            className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-[16px] sm:rounded-[20px] flex items-center justify-between transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800"
                          >
                            <div className="flex flex-col min-w-0 flex-1 pr-4">
                              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate uppercase italic">
                                {isService ? item.service_name : item.item_name}
                              </p>
                              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-widest mt-0.5">
                                {item.quantity}x @ ₱
                                {parseFloat(
                                  item.recorded_selling_price,
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                                {parseFloat(item.discount_amount) > 0 && (
                                  <span className="text-amber-500 ml-1.5">
                                    (Disc: -₱
                                    {parseFloat(
                                      item.discount_amount,
                                    ).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                    })}
                                    )
                                  </span>
                                )}
                              </p>
                            </div>
                            <span className="text-sm font-black text-slate-900 dark:text-white font-mono shrink-0">
                              ₱
                              {net.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl">
                    <div className="space-y-2 mb-5 text-sm font-medium text-slate-400">
                      <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>Subtotal (Gross)</span>
                        <span className="font-bold text-slate-200 font-mono">
                          ₱
                          {parseFloat(estimate.subtotal).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>

                      {parseFloat(estimate.total_discount) > 0 && (
                        <div className="flex justify-between items-center bg-amber-500/10 p-3 sm:p-4 rounded-xl text-amber-500">
                          <span className="font-bold">Total Discounts</span>
                          <span className="font-black font-mono">
                            - ₱
                            {parseFloat(estimate.total_discount).toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2 },
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span className="flex items-center gap-1.5">
                          VAT Amount
                        </span>
                        <span className="font-bold text-slate-200 font-mono">
                          ₱
                          {parseFloat(estimate.vat_amount).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 sm:pt-5 border-t border-slate-700/50">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight font-mono">
                        ₱
                        {parseFloat(estimate.grand_total).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {estimate.notes && (
                    <div className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">
                        Staff Notes
                      </p>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                        "{estimate.notes}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Print Footer Stub */}
            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                disabled={!estimate || loading}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer size={16} /> Print Document
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EstimateDrawer;
