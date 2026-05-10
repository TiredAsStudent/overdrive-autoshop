import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Loader2,
  BookOpen,
} from "lucide-react";
import ConfirmModal from "../../../components/shared/ConfirmModal";

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("blob:") || path.startsWith("http")) return path;
  const baseUrl =
    import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
    "http://localhost:5000";
  return `${baseUrl}${path}`;
};

// Helper for AI Confidence Highlighting
const getConfidenceColor = (score) => {
  if (!score)
    return "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50";
  if (score < 0.7)
    return "border-red-400 bg-red-50 dark:bg-red-500/10 ring-2 ring-red-400 ring-opacity-50";
  if (score < 0.85)
    return "border-amber-400 bg-amber-50 dark:bg-amber-500/10 ring-2 ring-amber-400 ring-opacity-50";
  return "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10";
};

const ExpenseApprovalModal = ({
  isOpen,
  onClose,
  expense,
  onApprove,
  onReject,
  suppliers = [],
  accounts = [],
}) => {
  const [formData, setFormData] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Filter only 'Expense' or 'Asset' accounts for the debit dropdown
  const validDebitAccounts = accounts.filter(
    (acc) => acc.account_type === "Expense" || acc.account_type === "Asset",
  );

  // Initialize form with AI data when modal opens
  useEffect(() => {
    if (isOpen && expense) {
      setFormData({
        supplier_id: expense.supplier_id || "",
        transaction_date: expense.transaction_date
          ? expense.transaction_date.split("T")[0]
          : "",
        base_amount: expense.base_amount || 0,
        vat_amount: expense.vat_amount || 0,
        total_amount: expense.total_amount || 0,
        expense_account_id: "5000", // Default string code for COGS
        payment_method: "AP", // Default to Accounts Payable
        items: expense.items || [],
      });
      setIsRejecting(false);
      setRejectionReason("");
    }
  }, [isOpen, expense]);

  if (!formData || !expense) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApproveTrigger = () => {
    // Open the secondary confirmation before executing the Atomic Transaction
    setIsConfirmOpen(true);
  };

  const executeApproval = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(expense.id, {
        ...formData,
        branch_id: parseInt(expense.branch_id, 10),
        supplier_id: formData.supplier_id
          ? parseInt(formData.supplier_id, 10)
          : null,
        base_amount: parseFloat(formData.base_amount),
        vat_amount: parseFloat(formData.vat_amount),
        total_amount: parseFloat(formData.total_amount),
      });
      onClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeRejection = async () => {
    if (!rejectionReason.trim())
      return alert("A rejection reason is mandatory.");
    setIsSubmitting(true);
    try {
      await onReject(expense.id, rejectionReason);
      onClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          key="approval-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-7xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col h-[95vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-black/20 shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
                  <FileText className="text-indigo-500" size={24} />
                  Maker-Checker Verification
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                  ID: {expense.id} • Submitted by {expense.staff_name}
                  {expense.ai_confidence_score && (
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] ${expense.ai_confidence_score > 0.85 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      AI Confidence:{" "}
                      {Math.round(expense.ai_confidence_score * 100)}%
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* SPLIT SCREEN BODY */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* LEFT PANE: The Evidence (Image) */}
              <div className="w-full lg:w-1/2 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 flex flex-col relative">
                <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  <ImageIcon size={14} className="text-white" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                    Original Document
                  </span>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                  <img
                    src={getImageUrl(expense.receipt_image_url)}
                    alt="Receipt Scan"
                    className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-slate-200 dark:border-white/10"
                  />
                </div>
              </div>

              {/* RIGHT PANE: The Data (Editable Form) */}
              <div className="w-full lg:w-1/2 overflow-y-auto p-6 bg-white dark:bg-slate-800 space-y-6">
                {/* AI Warning Banner */}
                {expense.ai_confidence_score < 0.85 && (
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-4 rounded-xl flex gap-3 items-start">
                    <AlertTriangle
                      className="text-amber-500 shrink-0 mt-0.5"
                      size={18}
                    />
                    <div>
                      <h4 className="text-sm font-black text-amber-700 dark:text-amber-500">
                        Human Verification Required
                      </h4>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                        Gemini AI flagged some fields with low confidence.
                        Please verify the highlighted inputs against the
                        original document.
                      </p>
                    </div>
                  </div>
                )}

                <form className="space-y-5 flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">
                  {/* NEW BLOCK: Accounting Routing */}
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-1.5 border-b border-indigo-200 dark:border-indigo-500/20 pb-2">
                      <BookOpen size={14} /> General Ledger Routing
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                          Debit (Expense Category)
                        </label>
                        <select
                          name="expense_account_id"
                          value={formData.expense_account_id}
                          onChange={handleChange}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {validDebitAccounts.map((acc) => (
                            <option key={acc.id} value={acc.account_code}>
                              {acc.account_code} - {acc.account_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                          Credit (Payment Source)
                        </label>
                        <select
                          name="payment_method"
                          value={formData.payment_method}
                          onChange={handleChange}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="AP">
                            Accounts Payable (Unpaid Debt)
                          </option>
                          <option value="CASH">
                            Cash on Hand (Fully Paid)
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Supplier Linkage */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Supplier / Vendor Match
                      </label>
                      <select
                        name="supplier_id"
                        value={formData.supplier_id}
                        onChange={handleChange}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">
                          -- Manual Entry / Payroll Logging --
                        </option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.supplier_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Transaction Date
                      </label>
                      <input
                        type="date"
                        name="transaction_date"
                        value={formData.transaction_date}
                        onChange={handleChange}
                        className={`w-full rounded-xl px-4 py-3 text-sm font-mono text-slate-900 dark:text-white outline-none transition-all ${getConfidenceColor(expense.ai_confidence_score)}`}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10 pb-2 mb-4">
                      Financial Extraction
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Base (₱)
                        </label>
                        <input
                          type="number"
                          name="base_amount"
                          step="0.01"
                          value={formData.base_amount}
                          onChange={handleChange}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">
                          Input VAT (₱)
                        </label>
                        <input
                          type="number"
                          name="vat_amount"
                          step="0.01"
                          value={formData.vat_amount}
                          onChange={handleChange}
                          className={`w-full rounded-lg px-3 py-2 text-sm font-mono text-slate-900 dark:text-white outline-none ${getConfidenceColor(expense.ai_confidence_score)}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">
                          Total (₱)
                        </label>
                        <input
                          type="number"
                          name="total_amount"
                          step="0.01"
                          value={formData.total_amount}
                          onChange={handleChange}
                          className={`w-full rounded-lg px-3 py-2 text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 outline-none ${getConfidenceColor(expense.ai_confidence_score)}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rejection State Toggle */}
                  <AnimatePresence>
                    {isRejecting && (
                      <motion.div
                        key="rejection-panel"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-200 dark:border-red-500/30 overflow-hidden"
                      >
                        <label className="block text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-2">
                          Reason for Rejection (Required)
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="e.g. Image is too blurry, please rescan."
                          className="w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/50 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500 resize-none h-24"
                        />
                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => setIsRejecting(false)}
                            className="px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={executeRejection}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-[10px] font-black uppercase bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                          >
                            {isSubmitting ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <XCircle size={14} />
                            )}{" "}
                            Confirm Rejection
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </div>

            {/* Footer Actions */}
            {!isRejecting && (
              <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-white/5 flex gap-3 shrink-0 bg-slate-50 dark:bg-black/20">
                <button
                  onClick={() => setIsRejecting(true)}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-600 dark:hover:border-red-500 text-slate-700 dark:text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle size={18} /> Reject to Staff
                </button>
                <button
                  onClick={handleApproveTrigger}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={18} /> Commit & Approve
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Atomic Transaction Confirmation Lock */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeApproval}
        title="Commit to General Ledger?"
        message="This action executes an Atomic Database Transaction. It will permanently post to the General Ledger, update the VAT Ledger, and recalculate Inventory Moving Averages simultaneously."
        confirmText="Execute Transaction"
        variant="info"
      />
    </AnimatePresence>
  );
};

export default ExpenseApprovalModal;
