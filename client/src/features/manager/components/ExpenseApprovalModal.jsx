import React, { useState, useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ReceiptText,
  Building2,
  User,
  Loader2,
  Store,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  ScanText,
  ImageOff,
  Clock,
  FileText,
  Paperclip,
  Download,
  ClipboardList,
} from "lucide-react";
import { expenseApprovalService } from "../../../services/manager/expenseApproval.service";
import { useApp } from "../../../context/AppContext";
import StatusBadge from "../../../components/ui/StatusBadge";
import api from "../../../services/api";

const getAttachmentUrl = (path) => {
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

const ExpenseApprovalModal = ({ isOpen, onClose, expenseId, onSuccess }) => {
  const { showToast } = useApp();

  // Accessible IDs
  const modalTitleId = useId();
  const remarksTextareaId = useId();

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(null);
  const [validationError, setValidationError] = useState("");

  const [imageError, setImageError] = useState(false);
  const conflictTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (conflictTimerRef.current) {
        clearTimeout(conflictTimerRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    let isMounted = true;
    if (conflictTimerRef.current) {
      clearTimeout(conflictTimerRef.current);
      conflictTimerRef.current = null;
    }

    if (isOpen && expenseId) {
      setLoading(true);
      setError("");
      setRemarks("");
      setValidationError("");
      setImageError(false);
      setSubmittingDecision(null);

      expenseApprovalService
        .getExpenseDetails(expenseId)
        .then((res) => {
          if (isMounted) setExpense(res.data);
        })
        .catch((err) => {
          if (isMounted) {
            setError(err.message || "Unable to retrieve expense document.");
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setExpense(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, expenseId]);

  const handleDecision = async (decision) => {
    if (!expense || isSubmitting) return;
    setValidationError("");

    const trimmedRemarks = remarks.trim();
    if (decision === "REJECTED" && trimmedRemarks.length < 5) {
      setValidationError(
        "Rejection requires a detailed reason (min 5 characters).",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmittingDecision(decision);
    try {
      if (decision === "APPROVED") {
        await expenseApprovalService.approveExpense(expense.id, trimmedRemarks);
        showToast("Expense Approved successfully.", "success");
      } else {
        await expenseApprovalService.rejectExpense(expense.id, trimmedRemarks);
        showToast("Expense Rejected.", "success");
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const message = err.message || "Failed to process expense decision.";
      setValidationError(message);

      const errMsg = message.toLowerCase();
      if (errMsg.includes("conflict") || errMsg.includes("no longer pending")) {
        conflictTimerRef.current = setTimeout(() => {
          onSuccess?.();
          onClose?.();
        }, 3000);
      }
    } finally {
      setIsSubmitting(false);
      setSubmittingDecision(null);
    }
  };

  const getBadgeVariant = (status) => {
    if (status === "PENDING_APPROVAL") return "warning";
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "danger";
    return "default";
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const staffNotes = expense?.notes
    ? expense.notes.split("\n\n[Manager")[0]
    : "";

  const shouldRenderModal =
    isOpen && (!expense || expense.status === "PENDING_APPROVAL");

  return (
    <AnimatePresence>
      {shouldRenderModal && (
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
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95dvh] sm:max-h-[92vh]"
          >
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <ReceiptText size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    {expense?.expense_number || "Loading Expense..."}
                  </h2>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    {expense && (
                      <StatusBadge
                        label={(expense.status || "").replace(/_/g, " ")}
                        variant={getBadgeVariant(expense.status)}
                        icon={Clock}
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className="hidden sm:inline text-slate-300 dark:text-slate-600"
                    >
                      •
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate flex items-center gap-1">
                      <User size={12} aria-hidden="true" />
                      <span>
                        Drafted by: {expense?.created_by_name || "System"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close expense approval modal"
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 sm:space-y-8">
              {loading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-80"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-8 h-8 animate-spin mb-3 text-amber-500"
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Retrieving Document...
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

              {expense && !loading && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    {/* Category & Payee */}
                    <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20 flex flex-col justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                        <Store size={14} aria-hidden="true" />
                        <span>Category & Payee</span>
                      </h3>
                      <div className="space-y-4">
                        <p
                          className="text-sm font-black text-slate-900 dark:text-white uppercase truncate"
                          title={expense.category}
                        >
                          {expense.category}
                        </p>
                        <div className="p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">
                            Target Vendor
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {expense.vendor_name || "Unregistered Entity"}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-3 flex items-center gap-1.5 font-bold border-t border-slate-100 dark:border-slate-700/50 pt-3">
                            <Building2
                              size={12}
                              aria-hidden="true"
                              className="shrink-0"
                            />
                            <span className="truncate">
                              {expense.branch_name}
                            </span>
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Operational Details */}
                    <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20 flex flex-col justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                        <FileText size={14} aria-hidden="true" />
                        <span>Transaction Details</span>
                      </h3>
                      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                        <div>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                            Expense Date
                          </p>
                          <p className="text-xs font-mono tabular-nums font-black text-slate-800 dark:text-slate-200 truncate mt-0.5">
                            {new Date(expense.expense_date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                            Payment Method
                          </p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate mt-0.5 uppercase">
                            {(expense.payment_method || "").replace(/_/g, " ")}
                          </p>
                        </div>
                        {expense.reference_number && (
                          <div>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                              Reference No.
                            </p>
                            <p className="text-xs font-mono tabular-nums font-black text-slate-800 dark:text-slate-200 truncate mt-0.5 uppercase">
                              {expense.reference_number}
                            </p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Financial Lock */}
                  <div className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800 flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-overdrive-yellow mb-4 border-b border-white/10 pb-3">
                      Requested Financial Commitment
                    </p>
                    <div className="space-y-2 mb-5 text-sm font-medium text-slate-400">
                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>Net Expense (Subtotal)</span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(expense.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>VAT Allocation</span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(expense.vat_amount)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 sm:pt-5 mt-2 border-t border-slate-700/50">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-overdrive-yellow tracking-tight font-mono tabular-nums">
                        ₱{formatCurrency(expense.total_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Receipt Image / PDF Viewer */}
                  {expense.receipt_url && (
                    <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                      <div className="flex justify-between items-center mb-4 gap-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          {expense.scan_id ? (
                            <>
                              <ScanText
                                size={14}
                                aria-hidden="true"
                                className="text-blue-500"
                              />
                              <span>Scanned Receipt Evidence</span>
                            </>
                          ) : (
                            <>
                              <Paperclip
                                size={14}
                                aria-hidden="true"
                                className="text-blue-500"
                              />
                              <span>Documentary Proof</span>
                            </>
                          )}
                        </p>
                        {isPdf(expense.receipt_url) && (
                          <a
                            href={getAttachmentUrl(expense.receipt_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 px-3 py-1.5 rounded-lg"
                          >
                            <Download size={12} aria-hidden="true" />
                            <span>Download PDF</span>
                          </a>
                        )}
                      </div>

                      {isPdf(expense.receipt_url) ? (
                        <div className="w-full h-40 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <FileText
                            size={48}
                            aria-hidden="true"
                            className="text-red-500 mb-3"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            PDF Document Attached
                          </span>
                        </div>
                      ) : imageError ? (
                        <div className="w-full h-48 sm:h-64 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
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
                          href={getAttachmentUrl(expense.receipt_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open attached expense receipt image in a new tab"
                          className="block relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-zoom-in"
                        >
                          <img
                            src={getAttachmentUrl(expense.receipt_url)}
                            alt={`Expense receipt for ${expense.expense_number}`}
                            onError={() => setImageError(true)}
                            className="w-full h-48 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
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

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                    {/* Staff Notes */}
                    {staffNotes ? (
                      <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-3 flex items-center gap-2">
                          <ClipboardList size={14} aria-hidden="true" />
                          <span>Staff Justification</span>
                        </h3>
                        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs">
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed whitespace-pre-wrap break-words">
                            "{staffNotes}"
                          </p>
                        </div>
                      </section>
                    ) : (
                      <div aria-hidden="true" className="hidden lg:block" />
                    )}

                    {/* Manager Remarks Input */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col">
                      <label
                        htmlFor={remarksTextareaId}
                        className="form-label flex flex-wrap items-center gap-2 mb-3"
                      >
                        <MessageSquare size={14} aria-hidden="true" />
                        <span>Manager Remarks</span>
                        <span className="text-red-500 lowercase">
                          (Required for Rejection)
                        </span>
                      </label>
                      <textarea
                        id={remarksTextareaId}
                        value={remarks}
                        onChange={(e) => {
                          setRemarks(e.target.value);
                          if (validationError) setValidationError("");
                        }}
                        placeholder="Provide feedback or justification..."
                        rows={4}
                        disabled={isSubmitting}
                        className="form-textarea flex-1 min-h-[100px] resize-none font-medium"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* MODAL FOOTER */}
            {expense && !loading && (
              <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => handleDecision("REJECTED")}
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-300 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {submittingDecision === "REJECTED" ? (
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
                    onClick={() => handleDecision("APPROVED")}
                    disabled={isSubmitting}
                    className="flex-[1.5] py-3.5 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingDecision === "APPROVED" ? (
                      <Loader2
                        size={16}
                        aria-hidden="true"
                        className="animate-spin"
                      />
                    ) : (
                      <CheckCircle size={16} aria-hidden="true" />
                    )}
                    <span>Approve Expense</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExpenseApprovalModal;
