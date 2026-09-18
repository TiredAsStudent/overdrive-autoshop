import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ReceiptText,
  Clock,
  Store,
  Calculator,
  Printer,
  ShieldAlert,
  CheckCircle,
  XCircle,
  FileText,
  Building2,
  Loader2,
  ScanText,
  Paperclip,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { expenseService } from "../../../services/staff/expense.service";
import { catalogService } from "../../../services/staff/catalog.service";
import StatusBadge from "../../../components/ui/StatusBadge";
import api from "../../../services/api";

const ExpenseDrawer = ({ isOpen, onClose, expenseId }) => {
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vatRate, setVatRate] = useState(12);

  useEffect(() => {
    if (isOpen && expenseId) {
      setLoading(true);

      catalogService
        .getSettings()
        .then((res) => {
          const fetchedVat = parseFloat(res.data?.vat_percentage);
          if (!isNaN(fetchedVat)) setVatRate(fetchedVat);
        })
        .catch((err) => console.error("Failed to load settings:", err));

      expenseService
        .getExpenseDetails(expenseId)
        .then((res) => setExpense(res.data))
        .catch((err) => console.error("Failed to load expense:", err))
        .finally(() => setLoading(false));
    } else {
      setExpense(null);
    }
  }, [isOpen, expenseId]);

  const getStatusBadgeVariant = (status) => {
    if (status === "APPROVED") return "success";
    if (status === "PENDING_APPROVAL") return "warning";
    if (status === "REJECTED") return "danger";
    return "default";
  };

  const getStatusBadgeIcon = (status) => {
    if (status === "APPROVED") return CheckCircle;
    if (status === "PENDING_APPROVAL") return Clock;
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
    const normalizedPath = cleanPath.replace(/\\/g, "/");

    return `${baseUrl}/${normalizedPath}`;
  };

  const isPdf = (path) => {
    return path?.toLowerCase().endsWith(".pdf");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Standardized Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer z-40"
            aria-hidden="true"
          />

          {/* Standardized Drawer Panel */}
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
            className="relative w-full sm:w-[500px] lg:w-[600px] bg-slate-50 dark:bg-slate-900/95 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
          >
            {/* Standardized Fixed Header */}
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <ReceiptText size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {loading ? "Loading..." : expense?.expense_number}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                    {loading ? "..." : expense?.category}
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

            {/* Standardized Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-70">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Retrieving Record...
                  </p>
                </div>
              ) : expense ? (
                <>
                  {/* STATUS & DATE SECTION */}
                  <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Current Status
                      </span>
                      <StatusBadge
                        label={expense.status.replace("_", " ")}
                        variant={getStatusBadgeVariant(expense.status)}
                        icon={getStatusBadgeIcon(expense.status)}
                      />
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Date Recorded
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </p>
                    </div>
                  </section>

                  {/* REJECTION REMARKS CARD */}
                  {expense.status === "REJECTED" &&
                    expense.rejection_remarks && (
                      <section className="p-5 sm:p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-[20px] sm:rounded-[24px] flex items-start gap-3 shadow-sm">
                        <ShieldAlert
                          size={18}
                          className="text-rose-600 shrink-0 mt-0.5"
                        />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">
                            Manager Feedback
                          </p>
                          <p className="text-xs font-bold text-rose-900 dark:text-rose-200/80 leading-relaxed">
                            "{expense.rejection_remarks}"
                          </p>
                        </div>
                      </section>
                    )}

                  {/* PARTICULARS CARD */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-sm space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-2 flex items-center gap-2">
                      <FileText size={14} /> Particulars
                    </h3>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                      {expense.description}
                    </p>
                  </section>

                  {/* PAYEE INFORMATION CARD */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-sm space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-2 flex items-center gap-1.5">
                      <Store size={14} /> Payee Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Vendor / Entity
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {expense.vendor_name || "Unregistered Entity"}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate font-medium">
                          <Building2 size={10} /> {expense.branch_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Ref / Receipt #
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white uppercase truncate">
                          {expense.reference_number || "N/A"}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* FINANCIAL POSTING CARD */}
                  <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl opacity-95">
                    <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 border-b border-white/10 pb-3 flex items-center gap-1.5">
                      <Calculator size={14} /> Financial Posting
                    </h3>
                    <div className="space-y-3 mb-5 text-sm font-medium text-slate-400">
                      <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>Subtotal</span>
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
                          Input VAT (
                          {expense.is_vatable ? `${vatRate}%` : "Exempt"})
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
                    <div className="pt-4 sm:pt-5 border-t border-slate-700/50 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                          Grand Total
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                          Paid via {expense.payment_method.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight font-mono">
                        ₱
                        {parseFloat(expense.total_amount).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </section>

                  {/* INTERNAL NOTES CARD */}
                  {expense.notes && (
                    <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px]">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-1.5">
                        <FileText size={14} /> Internal Notes
                      </h3>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                        "{expense.notes}"
                      </p>
                    </section>
                  )}

                  {/* DOCUMENTARY / OCR EVIDENCE */}
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
                        {isPdf(expense.receipt_url) && (
                          <a
                            href={getAttachmentUrl(expense.receipt_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg"
                          >
                            <Download size={12} /> Download PDF
                          </a>
                        )}
                      </div>

                      {isPdf(expense.receipt_url) ? (
                        <div className="w-full h-40 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <FileText size={48} className="text-red-500 mb-3" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            PDF Document Attached
                          </span>
                          <span className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest">
                            Click download to view full document
                          </span>
                        </div>
                      ) : (
                        <a
                          href={getAttachmentUrl(expense.receipt_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block relative group overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 cursor-zoom-in"
                        >
                          <img
                            src={getAttachmentUrl(expense.receipt_url)}
                            alt="Documentary Evidence"
                            className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-opacity backdrop-blur-sm flex items-center gap-1.5">
                              <ImageIcon size={12} /> Click to Enlarge
                            </span>
                          </div>
                        </a>
                      )}
                    </section>
                  )}
                </>
              ) : null}
            </div>

            {/* Print Footer Stub */}
            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
              <button
                disabled={!expense || loading}
                className="w-full py-3.5 sm:py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
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

export default ExpenseDrawer;
