import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  History,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { chartOfAccountsService } from "../../../services/manager/chartOfAccounts.service";
import Pagination from "../../../components/shared/Pagination";
import StatusBadge from "../../../components/ui/StatusBadge";

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

  const getStatusVariant = (status) => {
    if (!status) return "default";
    const s = status.toUpperCase();
    if (
      s.includes("APPROVED") ||
      s.includes("RECEIVED") ||
      s.includes("PAID") ||
      s.includes("TRANSFER_IN")
    )
      return "success";
    if (s.includes("PENDING") || s.includes("DRAFT") || s.includes("PARTIALLY"))
      return "warning";
    if (s.includes("VOID") || s.includes("REJECTED") || s.includes("CANCELLED"))
      return "danger";
    return "default";
  };

  const formatAccountingNumber = (amount) => {
    const num = parseFloat(amount) || 0;
    const isNegative = num < 0;
    const formatted = Math.abs(num).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (isNegative) {
      return {
        text: `(₱${formatted})`,
        color: "text-red-500 dark:text-red-400",
      };
    }
    return {
      text: `₱${formatted}`,
      color: "text-slate-900 dark:text-white",
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* 1. Standardized Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* 2. Standardized Drawer Panel */}
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
            role="dialog"
            aria-modal="true"
          >
            {/* 3. Standardized Fixed Header */}
            <header className="flex justify-between items-center px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-500 shrink-0">
                  <History size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]">
                    {loading && !data
                      ? "Loading Ledger..."
                      : data?.account?.account_name}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                    Account Usage Ledger
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

            {/* 4. Standardized Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200 flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {loading && !data ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Compiling Ledger...
                  </p>
                </div>
              ) : data ? (
                <div className="space-y-6 sm:space-y-8">
                  {/* Account Profile Summary Card */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-3 text-slate-400">
                      <BookOpen size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Account Profile
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                        {data.account.account_code}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                        {data.account.account_type}
                      </span>
                    </div>
                  </section>

                  {/* Transaction Ledger Table */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <History size={14} className="text-amber-500" /> Linked
                        Transactions
                      </h3>
                    </div>

                    {data.transactions.length === 0 ? (
                      <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          No transactions found for this account.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left whitespace-nowrap min-w-[500px]">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700">
                              <th className="px-5 py-4">Ref & Date</th>
                              <th className="px-5 py-4">Transaction Type</th>
                              <th className="px-5 py-4">Status</th>
                              <th className="px-5 py-4 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {data.transactions.map((txn, idx) => {
                              const { text, color } = formatAccountingNumber(
                                txn.amount,
                              );

                              return (
                                <tr
                                  key={idx}
                                  className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group"
                                >
                                  <td className="px-5 py-4">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                      {txn.reference}
                                      <ArrowUpRight
                                        size={12}
                                        className="text-slate-400 group-hover:text-blue-500 transition-colors"
                                      />
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-500 mt-1">
                                      {new Date(
                                        txn.transaction_date,
                                      ).toLocaleDateString()}
                                    </p>
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-1 rounded-md">
                                      {txn.transaction_type}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4">
                                    <StatusBadge
                                      label={
                                        txn.status
                                          ? txn.status.replace(/_/g, " ")
                                          : "N/A"
                                      }
                                      variant={getStatusVariant(txn.status)}
                                    />
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    <span
                                      className={`text-sm font-black font-mono ${color}`}
                                    >
                                      {text}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Pagination Wrapper */}
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
        </div>
      )}
    </AnimatePresence>
  );
};

export default AccountUsageDrawer;
