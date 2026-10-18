import React, { useState, useEffect, useId } from "react";
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
  ImageOff,
  AlertCircle,
} from "lucide-react";
import { expenseService } from "../../../services/staff/expense.service";
import { catalogService } from "../../../services/staff/catalog.service";
import StatusBadge from "../../../components/ui/StatusBadge";
import api from "../../../services/api";
import { useApp } from "../../../context/AppContext";
import { openPdfInNewTab } from "../../../utils/pdfViewer";

const ExpenseDrawer = ({ isOpen, onClose, expenseId }) => {
  const { showToast } = useApp();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const [vatRate, setVatRate] = useState(12);
  const [isPrinting, setIsPrinting] = useState(false);

  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && expenseId) {
      setLoading(true);
      setError("");
      setImageError(false);

      catalogService
        .getSettings()
        .then((res) => {
          if (!isMounted) return;
          const fetchedVat = parseFloat(res.data?.vat_percentage);
          if (!isNaN(fetchedVat)) setVatRate(fetchedVat);
        })
        .catch((err) => console.error("Failed to load settings:", err));

      expenseService
        .getExpenseDetails(expenseId)
        .then((res) => {
          if (isMounted) setExpense(res.data);
        })
        .catch((err) => {
          console.error("Failed to load expense:", err);
          if (isMounted) {
            setError(err.message || "Failed to load expense details.");
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

  // Close drawer on Escape key when not printing
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isPrinting) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPrinting, onClose]);

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

  const getAttachmentUrl = (filePath) => {
    if (!filePath) return null;
    const rawBaseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace("/api/v1", "")
      : import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
        "http://localhost:5000";

    const baseUrl = rawBaseUrl.replace(/\/$/, "");
    const normalized = filePath.replace(/\\/g, "/");
    const uploadsIdx = normalized.indexOf("uploads/");
    const cleanRelative =
      uploadsIdx !== -1
        ? normalized.slice(uploadsIdx)
        : normalized.replace(/^\//, "");

    return `${baseUrl}/${cleanRelative}`;
  };

  const isPdf = (path) => {
    return path?.toLowerCase().endsWith(".pdf");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await openPdfInNewTab(() => expenseService.downloadPdf(expenseId));
    } catch (err) {
      showToast(err.message || "Failed to generate expense PDF.", "error");
    } finally {
      setIsPrinting(false);
    }
  };

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
            onClick={() => !isPrinting && onClose?.()}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer z-40"
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
            className="relative h-full h-dvh w-full sm:w-[480px] md:w-[500px] lg:w-[600px] bg-slate-50 dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
          >
            {/* Standardized Fixed Header */}
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs">
              <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <ReceiptText size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]"
                  >
                    {loading ? "Loading..." : expense?.expense_number}
                  </h2>
                  <p
                    className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate"
                    title={expense?.category}
                  >
                    {loading ? "..." : expense?.category}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isPrinting}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                aria-label="Close expense details drawer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {/* Standardized Scrollable Body */}
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
                    Retrieving Record...
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
                <>
                  {/* STATUS & DATE SECTION */}
                  <section className="flex flex-col xs:flex-row xs:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Current Status
                      </span>
                      <StatusBadge
                        label={
                          expense.status
                            ? expense.status.replace(/_/g, " ")
                            : "DRAFT"
                        }
                        variant={getStatusBadgeVariant(expense.status)}
                        icon={getStatusBadgeIcon(expense.status)}
                      />
                    </div>
                    <div className="xs:text-right border-t xs:border-t-0 xs:border-l border-slate-100 dark:border-slate-700/50 pt-3 xs:pt-0 xs:pl-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                        Date Recorded
                      </p>
                      <p className="text-xs sm:text-sm font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                        {formatDate(expense.expense_date)}
                      </p>
                    </div>
                  </section>

                  {/* REJECTION REMARKS CARD */}
                  {expense.status === "REJECTED" &&
                    expense.rejection_remarks && (
                      <section className="p-5 sm:p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-[20px] sm:rounded-[24px] flex items-start gap-3 shadow-xs">
                        <ShieldAlert
                          size={18}
                          aria-hidden="true"
                          className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"
                        />
                        <div className="min-w-0">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-1">
                            Manager Feedback
                          </h3>
                          <p className="text-xs font-bold text-rose-900 dark:text-rose-200/90 leading-relaxed whitespace-pre-wrap break-words">
                            "{expense.rejection_remarks}"
                          </p>
                        </div>
                      </section>
                    )}

                  {/* PARTICULARS CARD */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-2 flex items-center gap-2">
                      <FileText
                        size={14}
                        aria-hidden="true"
                        className="text-amber-500 dark:text-overdrive-yellow"
                      />
                      <span>Particulars</span>
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed break-words">
                      {expense.description}
                    </p>
                  </section>

                  {/* PAYEE INFORMATION CARD */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-2 flex items-center gap-1.5">
                      <Store size={14} aria-hidden="true" />
                      <span>Payee Information</span>
                    </h3>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Vendor / Entity
                        </p>
                        <p
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate"
                          title={expense.vendor_name || "Unregistered Entity"}
                        >
                          {expense.vendor_name || "Unregistered Entity"}
                        </p>
                        <p
                          className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 truncate font-bold uppercase tracking-wider"
                          title={expense.branch_name}
                        >
                          <Building2
                            size={11}
                            aria-hidden="true"
                            className="shrink-0"
                          />
                          <span className="truncate">
                            {expense.branch_name}
                          </span>
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Ref / Receipt #
                        </p>
                        <p
                          className="text-xs sm:text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white uppercase truncate"
                          title={expense.reference_number || "N/A"}
                        >
                          {expense.reference_number || "N/A"}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* FINANCIAL POSTING CARD */}
                  <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800 dark:border-white/10">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-overdrive-yellow mb-4 border-b border-white/10 pb-3 flex items-center gap-1.5">
                      <Calculator size={14} aria-hidden="true" />
                      <span>Financial Posting</span>
                    </h3>
                    <div className="space-y-3 mb-5 text-xs sm:text-sm font-medium text-slate-400">
                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl gap-3">
                        <span>Subtotal</span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(expense.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl gap-3">
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <span>Input VAT</span>
                          {!expense.is_vatable ? (
                            <span className="text-[9px] sm:text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-bold uppercase">
                              (Exempt)
                            </span>
                          ) : (
                            <span className="text-[9px] sm:text-[10px] font-mono tabular-nums bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-bold">
                              ({vatRate}%)
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(expense.vat_amount)}
                        </span>
                      </div>
                    </div>
                    <div className="pt-4 sm:pt-5 border-t border-slate-700/60 flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2">
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                          Grand Total
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          Paid via{" "}
                          {expense.payment_method
                            ? expense.payment_method.replace(/_/g, " ")
                            : "CASH"}
                        </span>
                      </div>
                      <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-overdrive-yellow tracking-tight font-mono tabular-nums shrink-0">
                        ₱{formatCurrency(expense.total_amount)}
                      </span>
                    </div>
                  </section>

                  {/* INTERNAL NOTES CARD */}
                  {expense.notes && (
                    <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px]">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-overdrive-yellow mb-2 flex items-center gap-1.5">
                        <FileText size={14} aria-hidden="true" />
                        <span>Internal Notes</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/80 italic leading-relaxed whitespace-pre-wrap break-words">
                        "{expense.notes}"
                      </p>
                    </section>
                  )}

                  {/* DOCUMENTARY / OCR EVIDENCE */}
                  {expense.receipt_url && (
                    <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-3 gap-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          {expense.scan_id ? (
                            <>
                              <ScanText
                                size={14}
                                aria-hidden="true"
                                className="shrink-0"
                              />
                              <span>Scanned Receipt Evidence</span>
                            </>
                          ) : (
                            <>
                              <Paperclip
                                size={14}
                                aria-hidden="true"
                                className="shrink-0"
                              />
                              <span>Documentary Proof</span>
                            </>
                          )}
                        </h3>
                        {isPdf(expense.receipt_url) && (
                          <a
                            href={getAttachmentUrl(expense.receipt_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 px-3 py-1.5 rounded-lg shrink-0"
                          >
                            <Download size={12} aria-hidden="true" />
                            <span>Download</span>
                          </a>
                        )}
                      </div>

                      {isPdf(expense.receipt_url) ? (
                        <div className="w-full h-36 sm:h-40 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                          <FileText
                            size={36}
                            aria-hidden="true"
                            className="text-red-500 mb-2.5"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[85%]">
                            PDF Document Attached
                          </span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                            Click download to view full document
                          </span>
                        </div>
                      ) : imageError ? (
                        <div className="w-full h-48 sm:h-56 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-4">
                          <ImageOff
                            size={32}
                            aria-hidden="true"
                            className="text-slate-400 mb-3 opacity-50"
                          />
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Image File Unavailable
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 text-center max-w-[220px] mt-1">
                            The file may have been moved or deleted from the
                            server.
                          </span>
                        </div>
                      ) : (
                        <a
                          href={getAttachmentUrl(expense.receipt_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open attached expense receipt in a new tab"
                          className="block relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900 cursor-zoom-in"
                        >
                          <img
                            src={getAttachmentUrl(expense.receipt_url)}
                            alt={`Receipt evidence for ${expense.expense_number}`}
                            onError={() => setImageError(true)}
                            className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-focus-visible:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-opacity backdrop-blur-xs flex items-center gap-1.5">
                              <ImageIcon size={12} aria-hidden="true" />
                              <span>Click to Enlarge</span>
                            </span>
                          </div>
                        </a>
                      )}
                    </section>
                  )}
                </>
              )}
            </div>

            {/* Print Footer */}
            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs">
              <button
                type="button"
                onClick={handlePrint}
                disabled={!expense || loading || isPrinting}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPrinting ? (
                  <>
                    <Loader2
                      size={16}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Printer size={16} aria-hidden="true" />
                    <span>Print Document</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExpenseDrawer;
