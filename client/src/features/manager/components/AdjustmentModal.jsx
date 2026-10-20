import React, { useState, useEffect, useId } from "react";
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
  ImageOff,
  FileText,
  Download,
} from "lucide-react";
import api from "../../../services/api";

const getEvidenceUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  let baseUrl = api.defaults.baseURL
    ? api.defaults.baseURL.replace("/api/v1", "")
    : import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
      "http://localhost:5000";

  if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);

  const normalizedPath = path.replace(/\\/g, "/");
  const uploadsIndex = normalizedPath.toLowerCase().indexOf("uploads/");
  const cleanPath =
    uploadsIndex !== -1
      ? normalizedPath.slice(uploadsIndex)
      : normalizedPath.startsWith("/")
        ? normalizedPath.slice(1)
        : normalizedPath;

  return `${baseUrl}/${cleanPath}`;
};

const isPdf = (path) => path?.toLowerCase().endsWith(".pdf");

const AdjustmentModal = ({ isOpen, onClose, onSubmit, request }) => {
  const [submittingAction, setSubmittingAction] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [managerRemarks, setManagerRemarks] = useState("");
  const [imageError, setImageError] = useState(false);

  const modalTitleId = useId();
  const managerRemarksInputId = useId();

  const isSubmitting = Boolean(submittingAction);

  useEffect(() => {
    if (isOpen && request) {
      setManagerRemarks(request.manager_remarks || "");
      setValidationError("");
      setSubmittingAction(null);
      setImageError(false);
    }
  }, [isOpen, request]);

  // Close modal on Escape key when not submitting
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const isVisible = Boolean(isOpen && request && request.status === "PENDING");
  const isDeduct = request?.adjustment_type === "DEDUCT";

  // Financial Impact Math
  const unitCost = parseFloat(request?.unit_cost) || 0;
  const currentStock = parseInt(request?.current_system_quantity, 10) || 0;
  const requestedQty = parseInt(request?.requested_quantity, 10) || 0;
  const financialImpact = (requestedQty * unitCost).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const resultingStock = isDeduct
    ? currentStock - requestedQty
    : currentStock + requestedQty;

  const handleAction = async (actionType) => {
    if (!request) return;
    setValidationError("");
    setSubmittingAction(actionType);
    try {
      await onSubmit(request.id, actionType, managerRemarks.trim());
    } catch (error) {
      setValidationError(
        error.message || `Failed to ${actionType.toLowerCase()} request.`,
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          onClick={() => !isSubmitting && onClose?.()}
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
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[92dvh] sm:max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <Scale size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    Adjustment Review
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Requested by {request.requester_first_name}{" "}
                    {request.requester_last_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close adjustment review modal"
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable Body Container */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {validationError && (
                <div role="alert" className="form-error-banner">
                  <AlertCircle
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Item Snapshot Section */}
              <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    aria-hidden="true"
                    className="p-3.5 bg-white dark:bg-slate-800 rounded-xl shadow-xs text-slate-400 border border-slate-200/60 dark:border-slate-700 shrink-0"
                  >
                    <Package size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono tabular-nums font-black uppercase text-amber-600 dark:text-overdrive-yellow tracking-widest mb-1 truncate">
                      {request.sku}
                    </p>
                    <p
                      className="text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[250px]"
                      title={request.item_name}
                    >
                      {request.item_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 truncate">
                      Branch: {request.branch_name}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right border-t border-slate-200 dark:border-slate-700/50 sm:border-0 pt-4 sm:pt-0 mt-1 sm:mt-0 shrink-0">
                  <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-1">
                    Base Cost
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                    ₱
                    {unitCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </section>

              {/* Variance & Reason Stack */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      Requested Variance
                    </p>
                    <div
                      className={`flex items-center gap-2 text-2xl font-mono tabular-nums font-black tracking-tight uppercase ${
                        isDeduct
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isDeduct ? (
                        <ArrowDownRight size={26} aria-hidden="true" />
                      ) : (
                        <ArrowUpRight size={26} aria-hidden="true" />
                      )}
                      <span>
                        {isDeduct ? "-" : "+"}
                        {requestedQty}
                      </span>
                      <span className="text-sm font-sans font-bold ml-1 opacity-75">
                        {request.uom}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2.5 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <span>System Stock:</span>
                      <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {currentStock} {request.uom}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
                      <span>Resulting Stock:</span>
                      <span
                        className={`font-mono tabular-nums text-sm ${
                          resultingStock < 0
                            ? "text-red-600 dark:text-red-400"
                            : ""
                        }`}
                      >
                        {resultingStock} {request.uom}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                    Reason Code
                  </p>
                  <div className="inline-flex w-fit px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-black tracking-widest uppercase text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                    {(request.reason || "").replace(/_/g, " ")}
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-5 mb-2">
                    Staff Remarks
                  </p>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex-1 leading-relaxed shadow-2xs">
                    {request.staff_remarks || "No remarks provided."}
                  </div>
                </section>
              </div>

              {/* PHOTO EVIDENCE VIEWER */}
              {request.evidence_url && (
                <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                  <div className="flex justify-between items-center mb-4 gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      Visual Evidence Attached
                    </p>
                    {isPdf(request.evidence_url) && (
                      <a
                        href={getEvidenceUrl(request.evidence_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 px-3 py-1.5 rounded-lg"
                      >
                        <Download size={12} aria-hidden="true" />
                        <span>Download PDF</span>
                      </a>
                    )}
                  </div>

                  {isPdf(request.evidence_url) ? (
                    <div className="w-full h-36 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <FileText
                        size={40}
                        aria-hidden="true"
                        className="text-red-500 mb-2"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        PDF Document Attached
                      </span>
                    </div>
                  ) : imageError ? (
                    <div className="w-full h-48 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                      <ImageOff
                        size={32}
                        aria-hidden="true"
                        className="text-slate-400 mb-3 opacity-50"
                      />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Image File Unavailable
                      </span>
                    </div>
                  ) : (
                    <a
                      href={getEvidenceUrl(request.evidence_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open attached discrepancy evidence image in a new tab"
                      className="block relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-zoom-in"
                    >
                      <img
                        src={getEvidenceUrl(request.evidence_url)}
                        alt={`Discrepancy evidence for ${request.item_name}`}
                        onError={() => setImageError(true)}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-opacity backdrop-blur-xs">
                          Click to enlarge
                        </span>
                      </div>
                    </a>
                  )}
                </section>
              )}

              {/* ESTIMATED FINANCIAL IMPACT */}
              <section
                className={`p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                  isDeduct
                    ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400"
                    : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    aria-hidden="true"
                    className={`p-3.5 rounded-2xl shrink-0 ${
                      isDeduct
                        ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                        : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    <Calculator size={22} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest opacity-90 mb-1">
                      Estimated Financial {isDeduct ? "Write-Off" : "Gain"}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-widest opacity-70">
                      Quantity × Unit Cost
                    </span>
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-black tracking-tight font-mono tabular-nums text-left sm:text-right">
                  ₱{financialImpact}
                </span>
              </section>

              {/* Manager Resolution Area */}
              <section>
                <label htmlFor={managerRemarksInputId} className="form-label">
                  Manager Resolution Remarks{" "}
                  <span className="text-slate-400 dark:text-slate-500 font-medium lowercase">
                    (Optional)
                  </span>
                </label>
                <textarea
                  id={managerRemarksInputId}
                  value={managerRemarks}
                  onChange={(e) => setManagerRemarks(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  placeholder="Provide optional remarks for approval or rejection..."
                  className="form-textarea resize-none font-medium leading-relaxed"
                />
              </section>
            </div>

            {/* Footer Action Buttons */}
            <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => handleAction("REJECT")}
                  disabled={isSubmitting}
                  aria-busy={submittingAction === "REJECT" || undefined}
                  className="flex-1 py-3.5 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500/50 hover:text-red-600 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingAction === "REJECT" ? (
                    <Loader2
                      size={16}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                  ) : (
                    <XCircle size={16} aria-hidden="true" />
                  )}
                  <span>Reject Request</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("APPROVE")}
                  disabled={isSubmitting}
                  aria-busy={submittingAction === "APPROVE" || undefined}
                  className="flex-1 py-3.5 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {submittingAction === "APPROVE" ? (
                    <Loader2
                      size={16}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle size={16} aria-hidden="true" />
                  )}
                  <span>Approve Request</span>
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
