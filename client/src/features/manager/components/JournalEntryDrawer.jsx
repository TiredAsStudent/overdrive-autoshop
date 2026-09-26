import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  Calendar,
  Building2,
  User,
  Loader2,
  Hash,
  Scale,
  FileText,
  Printer,
} from "lucide-react";
import { journalEntryService } from "../../../services/manager/journalEntry.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const JournalEntryDrawer = ({ isOpen, onClose, journalId }) => {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && journalId) {
      setLoading(true);
      setError("");
      journalEntryService
        .getJournalDetails(journalId)
        .then((res) => setEntry(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setEntry(null);
    }
  }, [isOpen, journalId]);

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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer print:hidden"
          />

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
            className="relative w-full sm:w-[600px] lg:w-[750px] bg-slate-50 dark:bg-slate-900/95 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 print:w-full print:border-none print:shadow-none print:bg-white print:dark:bg-white print:text-black"
          >
            {/* Header */}
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] print:hidden">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <BookOpen size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate">
                    {loading ? "Loading..." : entry?.journal_number}
                  </h2>
                  {entry && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusBadge
                        label={entry.status}
                        variant={
                          entry.status === "POSTED" ? "success" : "warning"
                        }
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <User size={12} className="text-amber-500" />
                        By:{" "}
                        <span className="text-slate-600 dark:text-slate-300">
                          {entry.created_by_name || "System"}
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

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent print:p-0 print:overflow-visible">
              {/* PRINT HEADER ONLY (Hidden on screen) */}
              <div className="hidden print:block mb-8 text-center border-b-2 border-slate-900 pb-4">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  Journal Voucher
                </h1>
                <p className="text-sm font-bold text-slate-600 mt-1">
                  {entry?.journal_number}
                </p>
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-70 print:hidden">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Retrieving Journal Voucher...
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200 text-center print:hidden">
                  {error}
                </div>
              )}

              {entry && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Meta Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3 print:border-none print:shadow-none print:p-0">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 print:text-black">
                        <Calendar
                          size={14}
                          className="text-amber-500 print:hidden"
                        />{" "}
                        Journal Date
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white print:text-black">
                        {new Date(entry.entry_date).toLocaleDateString()}
                      </p>
                    </section>
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3 print:border-none print:shadow-none print:p-0">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 print:text-black">
                        <Hash
                          size={14}
                          className="text-blue-500 print:hidden"
                        />{" "}
                        Reference No.
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white uppercase print:text-black">
                        {entry.reference_number || "N/A"}
                      </p>
                    </section>
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3 sm:col-span-2 print:border-none print:shadow-none print:p-0 print:mt-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 print:text-black">
                          <FileText
                            size={14}
                            className="text-emerald-500 print:hidden"
                          />{" "}
                          Description
                        </div>
                        {entry.branch_name && (
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg print:bg-transparent print:p-0 print:text-black">
                            <Building2 size={12} className="print:hidden" />{" "}
                            {entry.branch_name}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic print:text-black">
                        "{entry.description}"
                      </p>
                    </section>
                  </div>

                  {/* Distribution Table */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm flex flex-col overflow-hidden print:border print:border-slate-900 print:shadow-none print:mt-8">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 print:bg-slate-100 print:border-slate-900">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 print:text-black">
                        <Scale
                          size={14}
                          className="text-amber-500 print:hidden"
                        />{" "}
                        Accounting Distribution Matrix
                      </h3>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar print:overflow-visible">
                      <table className="w-full text-left whitespace-nowrap min-w-[600px] print:min-w-full">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700 print:bg-slate-100 print:text-black print:border-slate-900">
                            <th className="px-5 py-4">Account</th>
                            <th className="px-5 py-4">Line Description</th>
                            <th className="px-5 py-4 text-right">Debit</th>
                            <th className="px-5 py-4 text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 print:divide-slate-300">
                          {entry.items?.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors print:hover:bg-transparent"
                            >
                              <td className="px-5 py-4">
                                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase truncate flex items-center gap-2 print:text-black">
                                  <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-slate-600 dark:text-slate-300 print:bg-transparent print:border print:border-slate-400 print:text-black">
                                    {item.account_code}
                                  </span>
                                  {item.account_name}
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <p className="text-[10px] font-medium text-slate-500 italic max-w-[200px] truncate print:text-black print:max-w-none print:whitespace-normal">
                                  {item.line_description || "-"}
                                </p>
                              </td>
                              <td className="px-5 py-4 text-right">
                                {item.entry_type === "DEBIT" && (
                                  <span className="text-sm font-black font-mono text-slate-700 dark:text-slate-300 print:text-black">
                                    {parseFloat(item.amount).toLocaleString(
                                      undefined,
                                      { minimumFractionDigits: 2 },
                                    )}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                {item.entry_type === "CREDIT" && (
                                  <span className="text-sm font-black font-mono text-slate-700 dark:text-slate-300 print:text-black">
                                    {parseFloat(item.amount).toLocaleString(
                                      undefined,
                                      { minimumFractionDigits: 2 },
                                    )}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-900/50 print:bg-white print:border-t-2 print:border-slate-900">
                          <tr>
                            <td
                              colSpan="2"
                              className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500 print:text-black"
                            >
                              Balanced Totals
                            </td>
                            <td className="px-5 py-4 text-right border-t-2 border-slate-200 dark:border-slate-600 print:border-slate-900">
                              <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-500 print:text-black">
                                ₱
                                {parseFloat(entry.total_amount).toLocaleString(
                                  undefined,
                                  { minimumFractionDigits: 2 },
                                )}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right border-t-2 border-slate-200 dark:border-slate-600 print:border-slate-900">
                              <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-500 print:text-black">
                                ₱
                                {parseFloat(entry.total_amount).toLocaleString(
                                  undefined,
                                  { minimumFractionDigits: 2 },
                                )}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </section>

                  {/* AUDIT INFORMATION */}
                  <div className="border-t border-slate-200 dark:border-slate-700/50 pt-6 mt-4 print:hidden">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                      Audit Information
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                          Date Created
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-300">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                          Last Updated
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-300">
                          {new Date(entry.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PRINT FOOTER SIGNATURES (Hidden on screen) */}
                  <div className="hidden print:flex justify-between items-end mt-16 px-10">
                    <div className="text-center w-48">
                      <div className="border-b border-slate-900 h-8 mb-2"></div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                        Prepared By
                      </p>
                      <p className="text-xs font-bold text-slate-900 mt-1">
                        {entry.created_by_name || "System"}
                      </p>
                    </div>
                    <div className="text-center w-48">
                      <div className="border-b border-slate-900 h-8 mb-2"></div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                        Approved By
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-3 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                disabled={!entry || loading}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer size={16} /> Print Journal Voucher
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default JournalEntryDrawer;
