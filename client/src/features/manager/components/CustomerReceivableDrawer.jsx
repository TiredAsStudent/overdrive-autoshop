import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Loader2,
  FileText,
  AlertCircle,
  Phone,
  Mail,
  History,
  CreditCard,
} from "lucide-react";
import { receivablesReportService } from "../../../services/manager/receivablesReport.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const CustomerReceivableDrawer = ({ isOpen, onClose, customerId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && customerId) {
      setLoading(true);
      setError("");
      receivablesReportService
        .getCustomerDetails(customerId)
        .then((res) => setData(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, customerId]);

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getStatusVariant = (status) => {
    if (status === "PAID") return "success";
    if (status === "OVERDUE") return "danger";
    if (status === "UNPAID" || status === "PARTIALLY_PAID") return "warning";
    return "default";
  };

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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer z-40"
            aria-hidden="true"
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
            className="relative w-full sm:w-[500px] lg:w-[600px] bg-slate-50 dark:bg-slate-900/95 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 z-50"
          >
            {/* Header */}
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-4 min-w-0">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <User size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {loading ? "Loading..." : data?.customer?.full_name}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                    Accounts Receivable Profile
                  </p>
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
                    Retrieving Ledger...
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 text-center bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200">
                  {error}
                </div>
              )}

              {data && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Customer Contact Card */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 text-slate-900 dark:text-white font-bold text-sm">
                      <Phone size={14} className="text-amber-500 shrink-0" />
                      <span>{data.customer.contact_number}</span>
                    </div>
                    {data.customer.email && (
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium">
                        <Mail size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{data.customer.email}</span>
                      </div>
                    )}
                  </section>

                  {/* Outstanding Invoices Section */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-amber-50/50 dark:bg-amber-500/5">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 flex items-center gap-2">
                        <AlertCircle size={14} /> Outstanding Balances
                      </h3>
                    </div>
                    <div className="p-5 sm:p-6 max-h-[300px] overflow-y-auto custom-scrollbar space-y-3">
                      {data.outstanding_invoices.length === 0 ? (
                        <p className="text-[10px] text-center font-bold uppercase tracking-widest text-slate-400 py-4">
                          No outstanding invoices.
                        </p>
                      ) : (
                        data.outstanding_invoices.map((inv) => (
                          <div
                            key={inv.id}
                            className={`p-4 rounded-xl border flex flex-col gap-3 ${
                              inv.status === "OVERDUE"
                                ? "bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">
                                  {inv.invoice_number}
                                </p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                  Due:{" "}
                                  {new Date(inv.due_date).toLocaleDateString()}
                                </p>
                              </div>
                              <StatusBadge
                                label={inv.status.replace("_", " ")}
                                variant={getStatusVariant(inv.status)}
                              />
                            </div>
                            <div className="flex justify-between items-end border-t border-slate-200 dark:border-slate-700/50 pt-2 mt-1">
                              <p className="text-[10px] text-slate-500 font-medium">
                                Total: ₱{formatCurrency(inv.grand_total)}
                                <br />
                                Paid: ₱{formatCurrency(inv.amount_paid)}
                              </p>
                              <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                  Remaining
                                </p>
                                <p
                                  className={`text-base font-black font-mono tracking-tight ${
                                    inv.status === "OVERDUE"
                                      ? "text-red-600 dark:text-red-400"
                                      : "text-amber-600 dark:text-amber-500"
                                  }`}
                                >
                                  ₱{formatCurrency(inv.remaining_balance)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  {/* Payment History Section */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-blue-50/50 dark:bg-blue-500/5">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500 flex items-center gap-2">
                        <History size={14} /> Collection History
                      </h3>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left whitespace-nowrap min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-700">
                            <th className="px-5 py-4">Payment & Method</th>
                            <th className="px-5 py-4">Invoice Target</th>
                            <th className="px-5 py-4 text-right">
                              Amount Received
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {data.payment_history.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-5 py-8 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  No payments recorded.
                                </p>
                              </td>
                            </tr>
                          ) : (
                            data.payment_history.map((pay) => (
                              <tr
                                key={pay.id}
                                className={`transition-colors ${
                                  pay.status === "VOID"
                                    ? "bg-slate-50 dark:bg-slate-900/40 opacity-70"
                                    : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                                }`}
                              >
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p
                                      className={`text-xs font-black uppercase tracking-widest ${
                                        pay.status === "VOID"
                                          ? "text-rose-500 line-through"
                                          : "text-slate-900 dark:text-white"
                                      }`}
                                    >
                                      {pay.payment_number}
                                    </p>
                                    {pay.status === "VOID" && (
                                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 font-bold uppercase">
                                        Void
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-[9px] font-bold text-slate-500 flex flex-wrap items-center gap-1.5 uppercase tracking-widest mt-0.5">
                                    <CreditCard
                                      size={10}
                                      className="shrink-0"
                                    />
                                    <span>
                                      {pay.payment_method.replace("_", " ")}
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-600">
                                      •
                                    </span>
                                    <span>
                                      {new Date(
                                        pay.payment_date,
                                      ).toLocaleDateString()}
                                    </span>
                                    {pay.reference_number && (
                                      <>
                                        <span className="text-slate-300 dark:text-slate-600">
                                          •
                                        </span>
                                        <span
                                          className="text-amber-500 font-mono tracking-wider truncate max-w-[120px]"
                                          title={pay.reference_number}
                                        >
                                          {pay.reference_number}
                                        </span>
                                      </>
                                    )}
                                  </p>
                                </td>
                                <td className="px-5 py-4">
                                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                                    {pay.invoice_number}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span
                                    className={`text-sm font-black font-mono ${
                                      pay.status === "VOID"
                                        ? "text-slate-400"
                                        : "text-emerald-600 dark:text-emerald-400"
                                    }`}
                                  >
                                    ₱{formatCurrency(pay.amount_received)}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
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

export default CustomerReceivableDrawer;
