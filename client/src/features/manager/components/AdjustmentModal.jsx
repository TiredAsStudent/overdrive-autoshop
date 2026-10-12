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

  if (!request || request.status !== "PENDING") return null;

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

  const getEvidenceUrl = (path) => {
    if (!path) return null;
    const baseUrl =
      import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
      "http://localhost:5000";
    return `${baseUrl}/${path}`;
  };

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500">
                  <Scale size={24} />
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
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Body Container */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Item Snapshot Section */}
              <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-400 shrink-0">
                    <Package size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1 truncate">
                      {request.sku}
                    </p>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[250px]">
                      {request.item_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Branch: {request.branch_name}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right border-t border-slate-200 dark:border-slate-700/50 sm:border-0 pt-4 sm:pt-0 mt-1 sm:mt-0 shrink-0">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                    Base Cost
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                    ₱
                    {parseFloat(request.unit_cost).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </section>

              {/* Variance & Reason Stack */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Requested Variance
                    </p>
                    <div
                      className={`flex items-center gap-2 text-2xl font-black tracking-tighter uppercase ${
                        isDeduct
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isDeduct ? (
                        <ArrowDownRight size={26} />
                      ) : (
                        <ArrowUpRight size={26} />
                      )}
                      {request.requested_quantity}{" "}
                      <span className="text-sm ml-1 opacity-70">
                        {request.uom}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2.5 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>System Stock:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {currentStock} {request.uom}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
                      <span>Resulting Stock:</span>
                      <span
                        className={`font-mono text-sm ${resultingStock < 0 ? "text-red-500" : ""}`}
                      >
                        {resultingStock} {request.uom}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Reason Code
                  </p>
                  <div className="inline-flex w-fit px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-black tracking-widest uppercase text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50">
                    {request.reason.replace(/_/g, " ")}
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-5 mb-2">
                    Staff Remarks
                  </p>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 flex-1 leading-relaxed shadow-sm">
                    {request.staff_remarks || "No remarks provided."}
                  </div>
                </section>
              </div>

              {/* PHOTO EVIDENCE VIEWER */}
              {request.evidence_url && (
                <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    Visual Evidence Attached
                  </p>
                  <a
                    href={getEvidenceUrl(request.evidence_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative group overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 cursor-zoom-in"
                  >
                    <img
                      src={getEvidenceUrl(request.evidence_url)}
                      alt="Discrepancy Evidence"
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-opacity backdrop-blur-sm">
                        Click to enlarge
                      </span>
                    </div>
                  </a>
                </section>
              )}

              {/* ESTIMATED FINANCIAL IMPACT */}
              <section
                className={`p-5 sm:p-6 rounded-[24px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                  isDeduct
                    ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400"
                    : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3.5 rounded-2xl shadow-inner ${
                      isDeduct
                        ? "bg-red-100 dark:bg-red-500/20 text-red-600"
                        : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600"
                    }`}
                  >
                    <Calculator size={22} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                      Estimated Financial {isDeduct ? "Write-Off" : "Gain"}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-widest opacity-50">
                      Quantity × Unit Cost
                    </span>
                  </div>
                </div>
                <span className="text-3xl font-black tracking-tight font-mono text-left sm:text-right">
                  ₱{financialImpact}
                </span>
              </section>

              {/* Manager Resolution Area */}
              <section>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Manager Resolution Remarks
                </label>
                <textarea
                  value={managerRemarks}
                  onChange={(e) => setManagerRemarks(e.target.value)}
                  disabled={isSubmitting}
                  rows="3"
                  placeholder="Provide optional remarks for approval or rejection..."
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none disabled:opacity-70 disabled:cursor-not-allowed leading-relaxed"
                />
              </section>
            </div>

            {/* Footer Action Buttons */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleAction("REJECT")}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-500 text-slate-600 dark:text-slate-300 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <XCircle size={16} /> Reject Request
                </button>
                <button
                  onClick={() => handleAction("APPROVE")}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Approve Request
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AdjustmentModal;
