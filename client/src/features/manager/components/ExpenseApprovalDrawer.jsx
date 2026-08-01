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
  CheckCircle2,
  XCircle,
  MessageSquare,
  ScanText,
  ZoomIn,
  ImageOff,
} from "lucide-react";
import { expenseApprovalService } from "../../../services/manager/expenseApproval.service";
import { useApp } from "../../../context/AppContext";
import api from "../../../services/api";

const ExpenseApprovalDrawer = ({ isOpen, onClose, expenseId, onSuccess }) => {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
      case "APPROVED":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "REJECTED":
        return "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
      default:
        return "text-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20";
    }
  };

  const getBaseUrl = () => {
    if (api.defaults.baseURL) {
      return api.defaults.baseURL.replace("/api/v1", "");
    }
    return import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace("/api/v1", "")
      : "http://localhost:5000";
  };

  const staffNotes = expense?.notes
    ? expense.notes.split("\n\n[Manager")[0]
    : "";
  const managerNotes =
    expense?.status === "REJECTED"
      ? expense.rejection_remarks
      : expense?.notes?.includes("[Manager Approval Notes]:")
        ? expense.notes.split("[Manager Approval Notes]:")[1]?.trim()
        : "";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[600px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <ReceiptText size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {expense?.expense_number || "Loading..."}
                  </h2>
                  {expense && (
                    <span
                      className={`inline-flex px-2 py-0.5 mt-1 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusColor(
                        expense.status,
                      )}`}
                    >
                      {expense.status.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Retrieving Expense Document...
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200">
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
                <div className="space-y-8">
                  {/* Historical Remarks */}
                  {managerNotes && expense.status !== "PENDING_APPROVAL" && (
                    <div
                      className={`p-4 rounded-xl border flex items-start gap-3 ${
                        expense.status === "REJECTED"
                          ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-800 dark:text-rose-300"
                          : "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      }`}
                    >
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">
                          Managerial Feedback
                        </p>
                        <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap">
                          {managerNotes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Metadata Linkages */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <Store size={14} className="text-slate-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Category & Payee
                      </p>
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">
                        {expense.category}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">
                        {expense.vendor_name || expense.description}
                      </p>
                    </div>
                    <div className="flex-1 p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/20">
                      <Calendar size={14} className="text-amber-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-1">
                        Expense Date
                      </p>
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-400 truncate">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70 truncate mt-0.5 flex items-center gap-1">
                        <Building2 size={10} /> {expense.branch_name}
                      </p>
                    </div>
                  </div>

                  {/* Operational Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">
                        Transaction Details
                      </h3>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                        <div className="p-3 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">
                            Payment Method
                          </span>
                          <span className="font-black text-slate-900 dark:text-white uppercase">
                            {expense.payment_method.replace("_", " ")}
                          </span>
                        </div>
                        <div className="p-3 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">
                            Reference No.
                          </span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {expense.reference_number || "N/A"}
                          </span>
                        </div>
                        <div className="p-3 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">
                            Submitted By
                          </span>
                          <span className="font-bold flex items-center gap-1 text-slate-900 dark:text-white">
                            <User size={12} /> {expense.created_by_name}
                          </span>
                        </div>
                        {staffNotes && (
                          <div className="p-3 text-xs bg-slate-50 dark:bg-slate-800/50">
                            <span className="text-slate-500 font-medium block mb-1">
                              Staff Description:
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 italic">
                              "{staffNotes}"
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Lock */}
                  <div className="bg-slate-900 dark:bg-black rounded-2xl p-5 text-white shadow-xl opacity-95">
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-3 border-b border-white/10 pb-2">
                      Requested Financial Commitment
                    </p>
                    <div className="space-y-1.5 mb-4 text-sm font-medium text-slate-400">
                      <div className="flex justify-between">
                        <span>Net Expense (Subtotal)</span>
                        <span>
                          ₱
                          {parseFloat(expense.subtotal).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          VAT Allocation{" "}
                          {expense.is_vatable ? "(12%)" : "(Non-VAT)"}
                        </span>
                        <span>
                          ₱
                          {parseFloat(expense.vat_amount).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                      <span className="text-sm font-black uppercase tracking-widest text-slate-300">
                        Total Amount
                      </span>
                      <span className="text-2xl font-black text-amber-500">
                        ₱
                        {parseFloat(expense.total_amount).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Receipt Image Preview (If OCR'd) */}
                  {expense.receipt_url && (
                    <div>
                      <div className="flex items-center justify-between px-1 mb-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          <ScanText size={12} /> Attached Receipt / OCR Scan
                        </h3>
                        {!imageError && (
                          <button
                            onClick={() => setIsZoomed(!isZoomed)}
                            className="text-[10px] font-bold text-amber-500 flex items-center gap-1 hover:text-amber-600 transition-colors"
                          >
                            <ZoomIn size={12} /> {isZoomed ? "Shrink" : "Zoom"}
                          </button>
                        )}
                      </div>

                      <div
                        className={`relative group w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 transition-all duration-300 ${isZoomed ? "h-auto min-h-[500px]" : "h-64"}`}
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
                            src={`${getBaseUrl()}${expense.receipt_url}`}
                            alt="Expense Receipt"
                            onError={() => setImageError(true)}
                            className="w-full h-full object-contain rounded-lg shadow-sm"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Decision Area (Only visible if PENDING_APPROVAL) */}
                  {expense.status === "PENDING_APPROVAL" && (
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <MessageSquare size={14} /> Manager Remarks (Required
                        for Rejection)
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Provide feedback or justification..."
                        rows="3"
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none disabled:opacity-50"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Footer */}
            {expense?.status === "PENDING_APPROVAL" && !loading && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => handleDecision("REJECTED")}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision("APPROVED")}
                  disabled={isSubmitting}
                  className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Approve Expense
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExpenseApprovalDrawer;
