import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  History,
  FileText,
  ArrowUpRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { chartOfAccountsService } from "../../../services/manager/chartOfAccounts.service";
import Pagination from "../../../components/shared/Pagination";

const AccountUsageDrawer = ({ isOpen, onClose, accountId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (isOpen && accountId) {
      fetchUsage(1);
    } else {
      setData(null);
      setCurrentPage(1);
    }
  }, [isOpen, accountId]);

  const fetchUsage = async (page) => {
    setLoading(true);
    setError("");
    try {
      const res = await chartOfAccountsService.getAccountUsage(
        accountId,
        page,
        ITEMS_PER_PAGE,
      );
      setData(res.data);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status)
      return "text-slate-600 bg-slate-100 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20";
    if (
      status.includes("APPROVED") ||
      status.includes("RECEIVED") ||
      status.includes("PAID")
    )
      return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    if (status.includes("PENDING") || status.includes("DRAFT"))
      return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    return "text-slate-600 bg-slate-100 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[550px] bg-slate-50 dark:bg-slate-900 shadow-2xl z-[80] flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-500">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[250px]">
                    {loading && !data
                      ? "Loading..."
                      : data?.account?.account_name}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Account Usage Ledger
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-500/10 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200 flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {loading && !data ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Compiling Ledger...
                  </p>
                </div>
              ) : data ? (
                <div className="space-y-4">
                  {/* Summary Card */}
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Account Profile
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {data.account.account_code}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                        {data.account.account_type}
                      </span>
                    </div>
                  </div>

                  {/* Transaction List */}
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1 pt-4 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                    <FileText size={14} className="text-amber-500" /> Linked
                    Transactions
                  </h3>

                  {data.transactions.length === 0 ? (
                    <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        No transactions found for this account.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.transactions.map((txn, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center group"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                {txn.transaction_type}
                              </span>
                              <span className="text-xs font-black text-slate-900 dark:text-white uppercase truncate flex items-center gap-1">
                                {txn.reference}{" "}
                                <ArrowUpRight
                                  size={12}
                                  className="text-slate-400 group-hover:text-blue-500 transition-colors"
                                />
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500">
                              {new Date(
                                txn.transaction_date,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                              ₱
                              {parseFloat(txn.amount).toLocaleString(
                                undefined,
                                { minimumFractionDigits: 2 },
                              )}
                            </span>
                            <span
                              className={`mt-1 inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getStatusColor(txn.status)}`}
                            >
                              {txn.status
                                ? txn.status.replace("_", " ")
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {data.pagination && data.pagination.totalPages > 1 && (
                    <div className="pt-2">
                      <Pagination
                        currentPage={data.pagination.currentPage}
                        totalPages={data.pagination.totalPages}
                        onPageChange={fetchUsage}
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AccountUsageDrawer;
