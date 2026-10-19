import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  Calendar,
  Building2,
  Loader2,
  Hash,
  Scale,
  FileText,
  Printer,
  BadgeCheck,
  Calculator,
  AlertCircle,
} from "lucide-react";
import { journalEntryService } from "../../../services/manager/journalEntry.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const JournalEntryDrawer = ({
  isOpen,
  onClose,
  journalId,
  readOnly = false,
}) => {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && journalId) {
      setLoading(true);
      setError("");
      journalEntryService
        .getJournalDetails(journalId)
        .then((res) => {
          if (isMounted) setEntry(res.data);
        })
        .catch((err) => {
          if (isMounted) {
            setError(
              err.message || "Unable to retrieve journal voucher details.",
            );
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setEntry(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, journalId]);

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = String(dateString).split("T")[0].split("-");
    if (year && month && day) {
      const localDate = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
      );
      if (!isNaN(localDate.getTime())) {
        return localDate.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });
      }
    }
    const fallback = new Date(dateString);
    return isNaN(fallback.getTime())
      ? String(dateString)
      : fallback.toLocaleDateString("en-US", {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer print:hidden"
          />

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
            className="relative h-full h-dvh w-full sm:w-[600px] lg:w-[750px] bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 print:w-full print:h-auto print:border-none print:shadow-none print:bg-white print:dark:bg-white print:text-black"
          >
            {/* Header */}
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs print:hidden gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <BookOpen size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]"
                  >
                    {loading
                      ? "Loading..."
                      : entry?.journal_number || "Journal Voucher"}
                  </h2>
                  {entry && (
                    <div className="flex flex-col items-start gap-1.5 mt-1.5">
                      <StatusBadge
                        label={entry.status}
                        variant={
                          entry.status === "POSTED" ? "success" : "warning"
                        }
                      />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <BadgeCheck
                          size={12}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                        />
                        <span>By:</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {entry.created_by_name || "System"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close journal voucher drawer"
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent print:p-0 print:overflow-visible">
              {/* PRINT HEADER ONLY (Hidden on screen) */}
              <div className="hidden print:block mb-8 text-center border-b-2 border-slate-900 pb-4">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  Journal Voucher
                </h1>
                <p className="text-sm font-mono tabular-nums font-bold text-slate-600 mt-1">
                  {entry?.journal_number}
                </p>
              </div>

              {loading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-80 print:hidden"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-8 h-8 animate-spin mb-3 text-amber-500"
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Retrieving Journal Voucher...
                  </p>
                </div>
              )}

              {error && !loading && (
                <div role="alert" className="form-error-banner print:hidden">
                  <AlertCircle
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <span>{error}</span>
                </div>
              )}

              {entry && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Meta Grid */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between print:border-none print:shadow-none print:p-0">
                      <Calendar
                        size={16}
                        aria-hidden="true"
                        className="text-amber-500 mb-3 print:hidden"
                      />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 print:text-black mb-1">
                          Journal Date
                        </p>
                        <p className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white print:text-black truncate">
                          {formatDate(entry.entry_date)}
                        </p>
                      </div>
                    </section>

                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between print:border-none print:shadow-none print:p-0">
                      <Hash
                        size={16}
                        aria-hidden="true"
                        className="text-blue-500 mb-3 print:hidden"
                      />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 print:text-black mb-1">
                          Reference No.
                        </p>
                        <p className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white uppercase print:text-black truncate">
                          {entry.reference_number || "N/A"}
                        </p>
                      </div>
                    </section>

                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col gap-3 xs:col-span-2 print:border-none print:shadow-none print:p-0 print:mt-4">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 print:text-black">
                          <FileText
                            size={14}
                            aria-hidden="true"
                            className="text-emerald-500 print:hidden"
                          />
                          <span>Description</span>
                        </div>
                        {entry.branch_name && (
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 px-2.5 py-1 rounded-lg print:bg-transparent print:border-none print:p-0 print:text-black">
                            <Building2
                              size={12}
                              aria-hidden="true"
                              className="print:hidden"
                            />
                            <span>{entry.branch_name}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic print:text-black">
                        "{entry.description}"
                      </p>
                    </section>
                  </div>

                  {/* Distribution Table */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden print:border print:border-slate-900 print:shadow-none print:mt-8">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 print:bg-slate-100 print:border-slate-900">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5 print:text-black">
                        <Scale
                          size={14}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow print:hidden"
                        />
                        <span>Accounting Distribution Matrix</span>
                      </h3>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar print:overflow-visible">
                      <table className="w-full text-left whitespace-nowrap min-w-[600px] print:min-w-full">
                        <caption className="sr-only">
                          Accounting distribution matrix for journal{" "}
                          {entry.journal_number}
                        </caption>
                        <thead>
                          <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700 print:bg-slate-100 print:text-black print:border-slate-900">
                            <th scope="col" className="px-5 py-4">
                              Account
                            </th>
                            <th scope="col" className="px-5 py-4">
                              Line Description
                            </th>
                            <th scope="col" className="px-5 py-4 text-right">
                              Debit
                            </th>
                            <th scope="col" className="px-5 py-4 text-right">
                              Credit
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 print:divide-slate-300">
                          {(entry.items || []).map((item) => (
                            <tr
                              key={item.id}
                              className="table-row-hover print:hover:bg-transparent"
                            >
                              <td className="px-5 py-4">
                                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase truncate flex items-center gap-2 print:text-black">
                                  <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-mono tabular-nums font-black text-slate-700 dark:text-slate-200 print:bg-transparent print:border print:border-slate-400 print:text-black">
                                    {item.account_code}
                                  </span>
                                  <span>{item.account_name}</span>
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <p
                                  className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic max-w-[200px] truncate print:text-black print:max-w-none print:whitespace-normal"
                                  title={item.line_description}
                                >
                                  {item.line_description || "-"}
                                </p>
                              </td>
                              <td className="px-5 py-4 text-right">
                                {item.entry_type === "DEBIT" && (
                                  <span className="text-sm font-black font-mono tabular-nums text-slate-800 dark:text-slate-200 print:text-black">
                                    ₱{formatCurrency(item.amount)}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                {item.entry_type === "CREDIT" && (
                                  <span className="text-sm font-black font-mono tabular-nums text-slate-800 dark:text-slate-200 print:text-black">
                                    ₱{formatCurrency(item.amount)}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Financial Posting Summary */}
                  <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-overdrive-yellow mb-4 border-b border-white/10 pb-3 flex items-center gap-1.5">
                      <Calculator size={14} aria-hidden="true" />
                      <span>Balanced Totals</span>
                    </p>
                    <div className="flex justify-between items-center text-sm font-medium text-slate-400 mb-3">
                      <span>Total Debits</span>
                      <span className="font-bold text-slate-200 font-mono tabular-nums">
                        ₱{formatCurrency(entry.total_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium text-slate-400 mb-4 pb-4 border-b border-white/10">
                      <span>Total Credits</span>
                      <span className="font-bold text-slate-200 font-mono tabular-nums">
                        ₱{formatCurrency(entry.total_amount)}
                      </span>
                    </div>
                  </section>

                  {/* AUDIT INFORMATION */}
                  <div className="border-t border-slate-200 dark:border-slate-700/50 pt-6 mt-4 print:hidden">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                      Audit Information
                    </p>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                          Date Created
                        </p>
                        <p className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-slate-300">
                          {formatDateTime(entry.created_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                          Last Updated
                        </p>
                        <p className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-slate-300">
                          {formatDateTime(entry.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PRINT FOOTER SIGNATURES (Hidden on screen) */}
                  <div className="hidden print:flex justify-between items-end mt-16 px-10">
                    <div className="text-center w-48">
                      <div className="border-b border-slate-900 h-8 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                        Prepared By
                      </p>
                      <p className="text-xs font-bold text-slate-900 mt-1">
                        {entry.created_by_name || "System"}
                      </p>
                    </div>
                    <div className="text-center w-48">
                      <div className="border-b border-slate-900 h-8 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                        Approved By
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!readOnly && entry && !loading && (
              <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-3 z-10 shadow-xs print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-3.5 sm:py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Printer size={16} aria-hidden="true" />
                  <span>Print Journal Entry</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default JournalEntryDrawer;
