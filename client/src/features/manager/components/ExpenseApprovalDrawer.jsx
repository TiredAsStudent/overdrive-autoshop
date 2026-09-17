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
  CheckCircle,
  XCircle,
  ScanText,
  ZoomIn,
  ImageOff,
  FileText,
  Paperclip,
  Download,
  BadgeCheck,
  Printer,
} from "lucide-react";
import { expenseApprovalService } from "../../../services/manager/expenseApproval.service";
import StatusBadge from "../../../components/ui/StatusBadge";
import api from "../../../services/api";

const ExpenseApprovalDrawer = ({ isOpen, onClose, expenseId }) => {
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [imageError, setImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (isOpen && expenseId) {
      setLoading(true);
      setError("");
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

  if (expense && expense.status === "PENDING_APPROVAL") return null;

  const getBadgeVariant = (status) => {
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "danger";
    return "default";
  };

  const getBadgeIcon = (status) => {
    if (status === "APPROVED") return CheckCircle;
    if (status === "REJECTED") return XCircle;
    return FileText;
  };

  const getAttachmentUrl = (path) => {
    if (!path) return null;
    let baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace("/api/v1", "")
      : import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
        "http://localhost:5000";

    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    return `${baseUrl}/${cleanPath}`;
  };

  const isPdf = (path) => path?.toLowerCase().endsWith(".pdf");

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
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
          />

          {/* Drawer Panel */}
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
          >
            {/* Header */}
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <ReceiptText size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {expense?.expense_number || "Loading..."}
                  </h2>
                  {expense && (
                    <div className="flex flex-col items-start gap-1.5 mt-1.5">
                      <StatusBadge
                        label={expense.status.replace("_", " ")}
                        variant={getBadgeVariant(expense.status)}
                        icon={getBadgeIcon(expense.status)}
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <BadgeCheck size={12} className="text-amber-500" />
                        Drafted by:{" "}
                        <span className="text-slate-600 dark:text-slate-300">
                          {expense.created_by_name || "System"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <X size={20} />
              </button>
            </header>

            {/* Scrollable Content */}
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

              {expense && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Metadata Linkages */}
                  <div className="grid grid-cols-2 gap-4 sm:gap-5">
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                      <Store size={16} className="text-slate-400 mb-3" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Category & Payee
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase">
                          {expense.category}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                          {expense.vendor_name || expense.description}
                        </p>
                      </div>
                    </section>
                    <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 rounded-[20px] sm:rounded-[24px] border border-amber-100 dark:border-amber-500/20 shadow-sm flex flex-col justify-between">
                      <Calendar size={16} className="text-amber-400 mb-3" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-1">
                          Expense Date
                        </p>
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-400 truncate">
                          {new Date(expense.expense_date).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70 flex items-center gap-1 font-medium truncate mt-0.5">
                          <Building2 size={10} /> {expense.branch_name}
                        </p>
                      </div>
                    </section>
                  </div>

                  {/* Operational Details */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Transaction Details
                      </h3>
                    </div>
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">
                          Payment Method
                        </span>
                        <span className="font-black text-slate-900 dark:text-white uppercase">
                          {expense.payment_method.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-700/50 pt-3">
                        <span className="text-slate-500 font-medium">
                          Reference No.
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {expense.reference_number || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-700/50 pt-3">
                        <span className="text-slate-500 font-medium">
                          Submitted By
                        </span>
                        <span className="font-bold flex items-center gap-1 text-slate-900 dark:text-white">
                          <User size={12} /> {expense.created_by_name}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Financials */}
                  <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl opacity-95">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 border-b border-white/10 pb-3">
                      Financial Commitment
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
                        <span>
                          VAT Allocation{" "}
                          {expense.is_vatable ? "(12%)" : "(Non-VAT)"}
                        </span>
                        <span className="font-bold text-slate-200 font-mono">
                          ₱
                          {parseFloat(expense.vat_amount).toLocaleString(
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
                        {parseFloat(expense.total_amount).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </section>

                  {/* Evidence Viewer */}
                  {expense.receipt_url && (
                    <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-1.5">
                          {expense.scan_id ? (
                            <>
                              <ScanText size={14} /> Scanned Receipt Evidence
                            </>
                          ) : (
                            <>
                              <Paperclip size={14} /> Documentary Proof
                            </>
                          )}
                        </p>
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
                                Image unavailable
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

                  {/* Staff Notes */}
                  {staffNotes && (
                    <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Staff Justification
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                        "{staffNotes}"
                      </p>
                    </section>
                  )}

                  {/* Manager Resolution Audit Area */}
                  <section
                    className={`p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col shadow-sm ${
                      expense.status === "APPROVED"
                        ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20"
                        : "bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20"
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                      Manager Resolution
                    </p>
                    <div>
                      <p
                        className={`text-xs font-black uppercase tracking-widest mb-1.5 ${
                          expense.status === "APPROVED"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {expense.status.replace("_", " ")} BY{" "}
                        {expense.resolved_by_name || expense.created_by_name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-widest">
                        On{" "}
                        {new Date(
                          expense.resolved_at || expense.updated_at,
                        ).toLocaleString()}
                      </p>
                      <div className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-4 rounded-[16px] border border-slate-100 dark:border-slate-800 shadow-sm leading-relaxed">
                        "{managerNotes || "No additional remarks provided."}"
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExpenseApprovalDrawer;
