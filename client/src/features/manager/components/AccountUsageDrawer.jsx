import React, { useState, useEffect, useCallback, useId } from "react";
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

const ITEMS_PER_PAGE = 10;

const AccountUsageDrawer = ({ isOpen, onClose, accountId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const drawerTitleId = useId();

  const fetchUsage = useCallback(
    async (page = 1) => {
      if (!accountId) return;
      setLoading(true);
      setError("");
      try {
        const res = await chartOfAccountsService.getAccountUsage(
          accountId,
          page,
          ITEMS_PER_PAGE,
        );
        setData(res.data);
      } catch (err) {
        setError(err.message || "Unable to retrieve account usage ledger.");
      } finally {
        setLoading(false);
      }
    },
    [accountId],
  );

  useEffect(() => {
    if (isOpen && accountId) {
      fetchUsage(1);
    } else {
      setData(null);
      setError("");
    }
  }, [isOpen, accountId, fetchUsage]);

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

  const getStatusVariant = (status) => {
    if (!status) return "default";
    const s = status.toUpperCase();
    if (
      s.includes("APPROVED") ||
      s.includes("RECEIVED") ||
      s.includes("PAID") ||
      s.includes("TRANSFER_IN") ||
      s.includes("POSTED")
    )
      return "success";
    if (s.includes("PENDING") || s.includes("DRAFT") || s.includes("PARTIALLY"))
      return "warning";
    if (s.includes("VOID") || s.includes("REJECTED") || s.includes("CANCELLED"))
      return "danger";
    return "default";
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
        color: "text-rose-600 dark:text-rose-400",
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
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
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
            className="relative h-full h-dvh w-full sm:w-[500px] lg:w-[600px] bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
          >
            {/* 3. Standardized Fixed Header */}
            <header className="flex justify-between items-center px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0"
                >
                  <History size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]"
                    title={data?.account?.account_name}
                  >
                    {loading && !data
                      ? "Loading Ledger..."
                      : data?.account?.account_name || "Account Usage"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Account Usage Ledger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Close account usage drawer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {/* 4. Standardized Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {error && (
                <div role="alert" className="form-error-banner">
                  <AlertCircle
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <span>{error}</span>
                </div>
              )}

              {loading && !data ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-80"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-8 h-8 animate-spin mb-4 text-amber-500"
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Compiling Ledger...
                  </p>
                </div>
              ) : data ? (
                <div className="space-y-6 sm:space-y-8">
                  {/* Account Profile Summary Card */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                          <BookOpen size={16} aria-hidden="true" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Account Profile
                          </span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight flex flex-wrap items-center gap-3">
                          <span>{data.account.account_code}</span>
                          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-sans">
                            {data.account.account_type}
                          </span>
                        </h3>
                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase mt-1 break-words">
                          {data.account.account_name}
                        </p>
                      </div>
                      <StatusBadge
                        label={data.account.is_active ? "Active" : "Inactive"}
                        variant={data.account.is_active ? "success" : "default"}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                      {data.account.parent_account_name && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                            Parent Account
                          </p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                            {data.account.parent_account_name}
                          </p>
                        </div>
                      )}
                      <div
                        className={
                          !data.account.parent_account_name
                            ? "sm:col-span-2"
                            : ""
                        }
                      >
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Description
                        </p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {data.account.description ||
                            "No description provided."}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Date Created
                        </p>
                        <p className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                          {formatDate(data.account.created_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Last Updated
                        </p>
                        <p className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                          {formatDate(data.account.updated_at)}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Transaction Ledger Table */}
                  <section
                    aria-busy={loading}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden relative"
                  >
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <History
                          size={14}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow"
                        />
                        <span>Linked Transactions</span>
                      </h3>
                      {loading && (
                        <Loader2
                          size={14}
                          aria-hidden="true"
                          className="text-amber-500 animate-spin"
                        />
                      )}
                    </div>

                    {!data.transactions || data.transactions.length === 0 ? (
                      <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/30">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          No transactions found for this account.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left whitespace-nowrap min-w-[500px]">
                          <caption className="sr-only">
                            Linked transactions for account{" "}
                            {data.account.account_code}
                          </caption>
                          <thead>
                            <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700">
                              <th scope="col" className="px-5 py-4">
                                Ref & Date
                              </th>
                              <th scope="col" className="px-5 py-4">
                                Transaction Type
                              </th>
                              <th scope="col" className="px-5 py-4">
                                Status
                              </th>
                              <th scope="col" className="px-5 py-4 text-right">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {data.transactions.map((txn, idx) => {
                              const { text, color } = formatAccountingNumber(
                                txn.amount,
                              );

                              return (
                                <tr
                                  key={txn.id || `${txn.reference}-${idx}`}
                                  className="table-row-hover group"
                                >
                                  <td className="px-5 py-4">
                                    <p className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                      <span>{txn.reference}</span>
                                      <ArrowUpRight
                                        size={12}
                                        aria-hidden="true"
                                        className="text-slate-400 group-hover:text-blue-500 transition-colors"
                                      />
                                    </p>
                                    <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mt-1">
                                      {formatDate(txn.transaction_date)}
                                    </p>
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20 px-2.5 py-1 rounded-md">
                                      {(txn.transaction_type || "").replace(
                                        /_/g,
                                        " ",
                                      )}
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
                                      className={`text-sm font-black font-mono tabular-nums ${color}`}
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
