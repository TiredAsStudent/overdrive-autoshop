import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Scale,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Calculator,
  CheckCircle,
  XCircle,
} from "lucide-react";

const AdjustmentModal = ({ isOpen, onClose, onSubmit, request }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [managerRemarks, setManagerRemarks] = useState("");

  useEffect(() => {
    if (isOpen && request) {
      setManagerRemarks(request.manager_remarks || "");
      setValidationError("");
      setIsSubmitting(false);
    }
  }, [isOpen, request]);

  if (!request) return null;

  const isPending = request.status === "PENDING";
  const isDeduct = request.adjustment_type === "DEDUCT";

  // Financial Impact Math
  const financialImpact = (
    request.requested_quantity * parseFloat(request.unit_cost)
  ).toLocaleString(undefined, { minimumFractionDigits: 2 });

  // Resulting Stock Math
  const currentStock = parseInt(request.current_system_quantity, 10) || 0;
  const requestedQty = parseInt(request.requested_quantity, 10) || 0;
  const resultingStock = isDeduct
    ? currentStock - requestedQty
    : currentStock + requestedQty;

  const handleAction = async (actionType) => {
    setValidationError("");
    setIsSubmitting(true);
    try {
      await onSubmit(request.id, actionType, managerRemarks);
      setIsSubmitting(false);
    } catch (error) {
      setValidationError(
        error.message || `Failed to ${actionType.toLowerCase()} request.`,
      );
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <Scale size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    Adjustment Review
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Requested by {request.requester_first_name}{" "}
                    {request.requester_last_name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Item Snapshot */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-400">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">
                      {request.sku}
                    </p>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                      {request.item_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Branch: {request.branch_name}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right bg-white dark:bg-slate-800 p-2 sm:p-0 sm:bg-transparent rounded-lg sm:rounded-none">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                    Base Cost
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    ₱
                    {parseFloat(request.unit_cost).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              {/* Variance & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Requested Variance
                  </p>
                  <div
                    className={`flex items-center gap-2 text-lg font-black tracking-widest uppercase ${isDeduct ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                  >
                    {isDeduct ? (
                      <ArrowDownRight size={20} />
                    ) : (
                      <ArrowUpRight size={20} />
                    )}
                    {request.requested_quantity} {request.uom}
                  </div>

                  {/* Resulting Stock UI */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>Current System Stock:</span>
                      <span>
                        {currentStock} {request.uom}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-1.5 mt-1.5">
                      <span>Resulting Stock:</span>
                      <span
                        className={resultingStock < 0 ? "text-red-500" : ""}
                      >
                        {resultingStock} {request.uom}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Reason Code
                  </p>
                  <p className="text-xs font-black text-slate-900 dark:text-white tracking-widest uppercase">
                    {request.reason.replace(/_/g, " ")}
                  </p>

                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-3 mb-1">
                    Staff Remarks
                  </p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 italic">
                    {request.staff_remarks || "No remarks provided."}
                  </p>
                </div>
              </div>

              {/* ESTIMATED FINANCIAL IMPACT */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${isDeduct ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400" : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${isDeduct ? "bg-red-100 dark:bg-red-500/20" : "bg-emerald-100 dark:bg-emerald-500/20"}`}
                  >
                    <Calculator size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest opacity-80">
                      Estimated Financial {isDeduct ? "Write-Off" : "Gain"}
                    </span>
                    <span className="block text-[10px] font-medium opacity-60">
                      Quantity × Unit Cost
                    </span>
                  </div>
                </div>
                <span className="text-lg font-black tracking-tight">
                  ₱{financialImpact}
                </span>
              </div>

              {/* Manager Resolution Area */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Manager Resolution Remarks {isPending ? "" : "(Read-Only)"}
                </label>
                <textarea
                  value={managerRemarks}
                  onChange={(e) => setManagerRemarks(e.target.value)}
                  disabled={!isPending}
                  rows="2"
                  placeholder={
                    isPending
                      ? "Optional remarks for approval or rejection..."
                      : "No remarks provided."
                  }
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Footer Action Buttons */}
            {isPending && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row gap-3 bg-slate-50/50 dark:bg-slate-900/20">
                <button
                  onClick={() => handleAction("REJECT")}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-500 text-slate-600 dark:text-slate-300 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <XCircle size={16} /> Reject Request
                </button>
                <button
                  onClick={() => handleAction("APPROVE")}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Approve & Update Ledger
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AdjustmentModal;
