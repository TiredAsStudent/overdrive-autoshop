import React, { useState, useEffect, useId } from "react";
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
  ImageOff,
  FileText,
  Paperclip,
  Download,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";
import { expenseApprovalService } from "../../../services/manager/expenseApproval.service";
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

const ExpenseApprovalDrawer = ({ isOpen, onClose, expenseId }) => {
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && expenseId) {
      setLoading(true);
      setError("");
      setImageError(false);

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

  // Close drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
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
  const managerNotes =
    expense?.status === "REJECTED"
      ? expense.rejection_remarks
      : expense?.notes?.includes("[Manager Approval Notes]:")
        ? expense.notes.split("[Manager Approval Notes]:")[1]?.trim()
        : "";

  const shouldRenderDrawer =
    isOpen && (!expense || expense.status !== "PENDING_APPROVAL");

  return (
    <AnimatePresence>
      {shouldRenderDrawer && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            className="relative h-full h-dvh w-full sm:w-[500px] lg:w-[600px] bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 z-50"
          >
            {/* Header */}
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <ReceiptText size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]"
                  >
                    {loading
                      ? "Loading..."
                      : expense?.expense_number || "Expense Record"}
                  </h2>
                  {expense && (
                    <div className="flex flex-col items-start gap-1.5 mt-1.5">
                      <StatusBadge
                        label={(expense.status || "").replace(/_/g, " ")}
                        variant={getBadgeVariant(expense.status)}
                        icon={getBadgeIcon(expense.status)}
                      />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <BadgeCheck
                          size={12}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                        />
                        <span>Drafted by:</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {expense.created_by_name || "System"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Close expense details drawer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {loading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-center justify-center py-20 opacity-80"
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

              {expense && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Metadata Linkages */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-5">
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                      <Store
                        size={16}
                        aria-hidden="true"
                        className="text-slate-400 mb-3"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Category & Payee
                        </p>
                        <p
                          className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase"
                          title={expense.category}
                        >
                          {expense.category}
                        </p>
                        <p
                          className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5"
                          title={expense.vendor_name || expense.description}
                        >
                          {expense.vendor_name || expense.description}
                        </p>
                      </div>
                    </section>

                    <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 rounded-[20px] sm:rounded-[24px] border border-amber-200/80 dark:border-amber-500/20 shadow-xs flex flex-col justify-between">
                      <Calendar
                        size={16}
                        aria-hidden="true"
                        className="text-amber-500 mb-3"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-1">
                          Expense Date
                        </p>
                        <p className="text-sm font-mono tabular-nums font-bold text-amber-900 dark:text-amber-400 truncate">
                          {formatDate(expense.expense_date)}
                        </p>
                        <p className="text-[10px] text-amber-700/80 dark:text-amber-500/80 flex items-center gap-1 font-medium truncate mt-0.5">
                          <Building2
                            size={10}
                            aria-hidden="true"
                            className="shrink-0"
                          />
                          <span className="truncate">
                            {expense.branch_name}
                          </span>
                        </p>
                      </div>
                    </section>
                  </div>

                  {/* Operational Details */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Transaction Details
                      </h3>
                    </div>
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="flex justify-between items-center text-xs gap-4">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          Payment Method
                        </span>
                        <span className="font-black text-slate-900 dark:text-white uppercase">
                          {(expense.payment_method || "").replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-700/50 pt-3 gap-4">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          Reference No.
                        </span>
                        <span className="font-mono tabular-nums font-black text-slate-900 dark:text-white">
                          {expense.reference_number || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-700/50 pt-3 gap-4">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          Submitted By
                        </span>
                        <span className="font-bold flex items-center gap-1 text-slate-900 dark:text-white">
                          <User size={12} aria-hidden="true" />
                          <span>{expense.created_by_name}</span>
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Financials */}
                  <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-overdrive-yellow mb-4 border-b border-white/10 pb-3">
                      Financial Commitment
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
                    <div className="flex justify-between items-center pt-4 sm:pt-5 border-t border-slate-700/50">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-overdrive-yellow tracking-tight font-mono tabular-nums">
                        ₱{formatCurrency(expense.total_amount)}
                      </span>
                    </div>
                  </section>

                  {/* DOCUMENTARY PROOF VIEWER */}
                  {expense.receipt_url && (
                    <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                      <div className="flex justify-between items-center mb-4 gap-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
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
                        <div className="w-full h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
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
                        <div className="w-full h-48 sm:h-56 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
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
                            className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-opacity backdrop-blur-xs flex items-center gap-1.5">
                              Click to Enlarge
                            </span>
                          </div>
                        </a>
                      )}
                    </section>
                  )}

                  {/* Staff Notes */}
                  {staffNotes && (
                    <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                        Staff Justification
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                        "{staffNotes}"
                      </p>
                    </section>
                  )}

                  {/* Manager Resolution Audit Area */}
                  <section
                    className={`p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col shadow-xs ${
                      expense.status === "APPROVED"
                        ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20"
                        : "bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20"
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                      Manager Resolution
                    </p>
                    <div>
                      <p
                        className={`text-xs font-black uppercase tracking-widest mb-1.5 ${
                          expense.status === "APPROVED"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-700 dark:text-rose-400"
                        }`}
                      >
                        {(expense.status || "").replace(/_/g, " ")} BY{" "}
                        {expense.resolved_by_name || expense.created_by_name}
                      </p>
                      <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest">
                        On{" "}
                        {formatDateTime(
                          expense.resolved_at || expense.updated_at,
                        )}
                      </p>
                      <div className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs leading-relaxed">
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
