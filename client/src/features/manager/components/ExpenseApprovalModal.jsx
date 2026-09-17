import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ReceiptText,
  Calendar,
  Building2,
  User,
  Loader2,
  Store,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ScanText,
  ZoomIn,
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

const ExpenseApprovalModal = ({ isOpen, onClose, expenseId, onSuccess }) => {
  const { showToast } = useApp();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [imageError, setImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (isOpen && expenseId) {
      setLoading(true);
      setError("");
      setRemarks("");
      setValidationError("");
      setImageError(false);
      setIsZoomed(false);

      expenseApprovalService
        .getExpenseDetails(expenseId)
        .then((res) => setExpense(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setExpense(null);
    }
  }, [isOpen, expenseId]);

  if (expense && expense.status !== "PENDING_APPROVAL") return null;

  const handleDecision = async (decision) => {
    setValidationError("");
    if (decision === "REJECTED" && remarks.trim().length < 5) {
      setValidationError(
        "Rejection requires a detailed reason (min 5 characters).",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (decision === "APPROVED") {
        await expenseApprovalService.approveExpense(expense.id, remarks);
        showToast("Expense Approved successfully.", "success");
      } else {
        await expenseApprovalService.rejectExpense(expense.id, remarks);
        showToast("Expense Rejected.", "success");
      }
      onSuccess();
      onClose();
    } catch (err) {
      setValidationError(err.message);

      const errMsg = err.message.toLowerCase();
      if (errMsg.includes("conflict") || errMsg.includes("no longer pending")) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeVariant = (status) => {
    if (status === "PENDING_APPROVAL") return "warning";
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "danger";
    return "default";
  };

  const getAttachmentUrl = (path) => {
    if (!path) return null;
    let baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace("/api/v1", "")
      : import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
        "http://localhost:5000";

    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const normalizedPath = cleanPath.replace(/\\/g, "/");

    return `${baseUrl}/${normalizedPath}`;
  };

  const isPdf = (path) => path?.toLowerCase().endsWith(".pdf");
  const staffNotes = expense?.notes
    ? expense.notes.split("\n\n[Manager")[0]
    : "";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95vh]"
          >
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <ReceiptText size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate">
                    {expense?.expense_number || "Loading Expense..."}
                  </h2>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    {expense && (
                      <StatusBadge
                        label={expense.status.replace("_", " ")}
                        variant={getBadgeVariant(expense.status)}
                        icon={Clock}
                      />
                    )}
                    <span className="hidden sm:inline text-slate-300 dark:text-slate-600">
                      •
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate flex items-center gap-1">
                      <User size={12} /> Drafted by: {expense?.created_by_name}
                    </span>
                  </div>
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

            {/* MODAL BODY */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 sm:space-y-8">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-70">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Retrieving Document...
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200 text-center">
                  {error}
                </div>
              )}

              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {expense && !loading && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    {/* Category & Payee */}
                    <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20 flex flex-col justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                        <Store size={14} /> Category & Payee
                      </h3>
                      <div className="space-y-4">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                          {expense.category}
                        </p>
                        <div className="p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                            Target Vendor
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {expense.vendor_name || "Unregistered Entity"}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate mt-3 flex items-center gap-1.5 font-bold border-t border-slate-100 dark:border-slate-700/50 pt-3">
                            <Building2 size={12} /> {expense.branch_name}
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Operational Details */}
                    <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20 flex flex-col justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                        <FileText size={14} /> Transaction Details
                      </h3>
                      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            Expense Date
                          </p>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate mt-0.5">
                            {new Date(expense.expense_date).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            Payment Method
                          </p>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate mt-0.5">
                            {expense.payment_method.replace("_", " ")}
                          </p>
                        </div>
                        {expense.reference_number && (
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                              Reference No.
                            </p>
                            <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate mt-0.5 uppercase">
                              {expense.reference_number}
                            </p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Financial Lock */}
                  <div className="bg-slate-900 dark:bg-black rounded-[24px] p-5 sm:p-6 text-white shadow-xl flex flex-col justify-center">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 border-b border-white/10 pb-3">
                      Requested Financial Commitment
                    </p>
                    <div className="space-y-2 mb-5 text-sm font-medium text-slate-400">
                      <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>Net Expense (Subtotal)</span>
                        <span className="font-bold text-slate-200 font-mono">
                          ₱
                          {parseFloat(expense.subtotal).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>VAT Allocation</span>
                        <span className="font-bold text-slate-200 font-mono">
                          ₱
                          {parseFloat(expense.vat_amount).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 sm:pt-5 mt-2 border-t border-slate-700/50">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight font-mono">
                        ₱
                        {parseFloat(expense.total_amount).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Receipt Image / PDF Viewer */}
                  {expense.receipt_url && (
                    <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                          {expense.scan_id ? (
                            <>
                              <ScanText size={14} /> Scanned Receipt Evidence
                            </>
                          ) : (
                            <>
                              <Paperclip size={14} /> Documentary Proof
                            </>
                          )}
                        </h3>
                        {isPdf(expense.receipt_url) ? (
                          <a
                            href={getAttachmentUrl(expense.receipt_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg"
                          >
                            <Download size={12} /> Download PDF
                          </a>
                        ) : (
                          !imageError && (
                            <button
                              onClick={() => setIsZoomed(!isZoomed)}
                              className="text-[10px] font-bold text-amber-500 flex items-center gap-1 hover:text-amber-600 transition-colors cursor-pointer"
                            >
                              <ZoomIn size={12} />{" "}
                              {isZoomed ? "Shrink" : "Zoom"}
                            </button>
                          )
                        )}
                      </div>

                      {isPdf(expense.receipt_url) ? (
                        <div className="w-full h-40 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <FileText size={48} className="text-red-500 mb-3" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            PDF Document Attached
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`relative group w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 transition-all duration-300 ${
                            isZoomed ? "h-auto min-h-[500px]" : "h-64"
                          }`}
                        >
                          {imageError ? (
                            <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                              <ImageOff size={32} className="opacity-50" />
                              <p className="text-[10px] font-bold uppercase tracking-widest">
                                Image file unavailable
                              </p>
                            </div>
                          ) : (
                            <img
                              src={getAttachmentUrl(expense.receipt_url)}
                              alt="Expense Receipt"
                              onError={() => setImageError(true)}
                              className="w-full h-full object-contain rounded-lg shadow-sm"
                            />
                          )}
                        </div>
                      )}
                    </section>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                    {/* Staff Notes */}
                    {staffNotes ? (
                      <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2">
                          <ClipboardList size={14} /> Staff Justification
                        </h3>
                        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed whitespace-pre-wrap break-words">
                            "{staffNotes}"
                          </p>
                        </div>
                      </section>
                    ) : (
                      <div className="hidden lg:block"></div>
                    )}

                    {/* Manager Remarks Input */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-3">
                        <MessageSquare size={14} /> Manager Remarks
                        <span className="text-red-500 ml-1 lowercase">
                          (Required for Rejection)
                        </span>
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Provide feedback or justification..."
                        rows="4"
                        disabled={isSubmitting}
                        className="w-full h-full min-h-[100px] px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none disabled:opacity-50 shadow-sm transition-all"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* MODAL FOOTER */}
            {expense && !loading && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleDecision("REJECTED")}
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-500 text-slate-600 dark:text-slate-300 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle size={16} /> Reject Request
                  </button>
                  <button
                    onClick={() => handleDecision("APPROVED")}
                    disabled={isSubmitting}
                    className="flex-[1.5] py-3.5 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Approve Expense
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
