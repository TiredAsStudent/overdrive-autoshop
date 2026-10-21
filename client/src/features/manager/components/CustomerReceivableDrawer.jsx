import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  History,
  CreditCard,
} from "lucide-react";
import { receivablesReportService } from "../../../services/manager/receivablesReport.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const formatDisplayDate = (dateString) => {
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
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }
  }
  const fallback = new Date(dateString);
  return isNaN(fallback.getTime())
    ? String(dateString)
    : fallback.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
};

const CustomerReceivableDrawer = ({ isOpen, onClose, customerId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && customerId) {
      setLoading(true);
      setError("");
      receivablesReportService
        .getCustomerDetails(customerId)
        .then((res) => {
          if (isMounted) setData(res.data);
        })
        .catch((err) => {
          if (isMounted) {
            setError(
              err.message || "Unable to retrieve customer receivable profile.",
            );
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setData(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, customerId]);

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

  const formatCurrency = (amount) => {
    return (parseFloat(amount) || 0).toLocaleString(undefined, {
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
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer z-40"
            aria-hidden="true"
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
                  className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <User size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]"
                    title={data?.customer?.full_name}
                  >
                    {loading
                      ? "Loading..."
                      : data?.customer?.full_name || "Customer Profile"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Accounts Receivable Profile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close customer receivable profile drawer"
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
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
                    Retrieving Ledger...
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

              {data && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Customer Contact Card */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs space-y-3.5">
                    <div className="flex items-center gap-3 text-slate-900 dark:text-white font-mono tabular-nums font-bold text-xs sm:text-sm">
                      <Phone
                        size={15}
                        aria-hidden="true"
                        className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                      />
                      <span>
                        {data.customer?.contact_number || "No contact number"}
                      </span>
                    </div>
                    {data.customer?.email && (
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium min-w-0">
                        <Mail
                          size={15}
                          aria-hidden="true"
                          className="text-slate-400 shrink-0"
                        />
                        <span className="truncate" title={data.customer.email}>
                          {data.customer.email}
                        </span>
                      </div>
                    )}
                  </section>

                  {/* Outstanding Invoices Section */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-amber-50/50 dark:bg-amber-500/5">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow flex items-center gap-2">
                        <AlertCircle size={14} aria-hidden="true" />
                        <span>Outstanding Balances</span>
                      </h3>
                    </div>
                    <div className="p-5 sm:p-6 max-h-[300px] overflow-y-auto custom-scrollbar space-y-3">
                      {!Array.isArray(data.outstanding_invoices) ||
                      data.outstanding_invoices.length === 0 ? (
                        <p className="text-[10px] text-center font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 py-4">
                          No outstanding invoices.
                        </p>
                      ) : (
                        data.outstanding_invoices.map((inv) => (
                          <div
                            key={inv.id}
                            className={`p-4 rounded-xl border flex flex-col gap-3 ${
                              inv.status === "OVERDUE"
                                ? "bg-red-50 dark:bg-red-500/5 border-red-200/80 dark:border-red-500/20"
                                : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-mono tabular-nums font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1 truncate">
                                  {inv.invoice_number}
                                </p>
                                <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                  Due: {formatDisplayDate(inv.due_date)}
                                </p>
                              </div>
                              <StatusBadge
                                label={(inv.status || "").replace(/_/g, " ")}
                                variant={getStatusVariant(inv.status)}
                              />
                            </div>
                            <div className="flex justify-between items-end gap-4 border-t border-slate-200/80 dark:border-slate-700/50 pt-2.5 mt-1">
                              <p className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                Total: ₱{formatCurrency(inv.grand_total)}
                                <br />
                                Paid: ₱{formatCurrency(inv.amount_paid)}
                              </p>
                              <div className="text-right shrink-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
                                  Remaining
                                </p>
                                <p
                                  className={`text-base font-black font-mono tabular-nums tracking-tight ${
                                    inv.status === "OVERDUE"
                                      ? "text-rose-600 dark:text-rose-400"
                                      : "text-amber-600 dark:text-amber-400"
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
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-blue-50/50 dark:bg-blue-500/5">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <History size={14} aria-hidden="true" />
                        <span>Collection History</span>
                      </h3>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left whitespace-nowrap min-w-[500px]">
                        <caption className="sr-only">
                          Customer Payment and Collection History
                        </caption>
                        <thead>
                          <tr className="bg-slate-50 dark:bg-black/20 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest border-b border-slate-200/80 dark:border-white/5">
                            <th scope="col" className="px-5 py-3.5">
                              Payment & Method
                            </th>
                            <th scope="col" className="px-5 py-3.5">
                              Invoice Target
                            </th>
                            <th scope="col" className="px-5 py-3.5 text-right">
                              Amount Received
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {!Array.isArray(data.payment_history) ||
                          data.payment_history.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-5 py-8 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
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
                                    : "table-row-hover"
                                }`}
                              >
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p
                                      className={`text-xs font-mono tabular-nums font-black uppercase tracking-widest ${
                                        pay.status === "VOID"
                                          ? "text-rose-500 line-through"
                                          : "text-slate-900 dark:text-white"
                                      }`}
                                    >
                                      {pay.payment_number}
                                    </p>
                                    {pay.status === "VOID" && (
                                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold uppercase">
                                        Void
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5 uppercase tracking-widest mt-0.5">
                                    <CreditCard
                                      size={10}
                                      aria-hidden="true"
                                      className="shrink-0"
                                    />
                                    <span>
                                      {(pay.payment_method || "").replace(
                                        /_/g,
                                        " ",
                                      )}
                                    </span>
                                    <span
                                      aria-hidden="true"
                                      className="text-slate-300 dark:text-slate-600"
                                    >
                                      •
                                    </span>
                                    <span className="font-mono tabular-nums">
                                      {formatDisplayDate(pay.payment_date)}
                                    </span>
                                    {pay.reference_number && (
                                      <>
                                        <span
                                          aria-hidden="true"
                                          className="text-slate-300 dark:text-slate-600"
                                        >
                                          •
                                        </span>
                                        <span
                                          className="text-amber-600 dark:text-overdrive-yellow font-mono tabular-nums tracking-wider truncate max-w-[120px]"
                                          title={pay.reference_number}
                                        >
                                          {pay.reference_number}
                                        </span>
                                      </>
                                    )}
                                  </p>
                                </td>
                                <td className="px-5 py-4">
                                  <span className="text-[10px] font-mono tabular-nums font-bold bg-slate-100 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-white/10 px-2.5 py-1 rounded-md">
                                    {pay.invoice_number}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span
                                    className={`text-xs sm:text-sm font-black font-mono tabular-nums ${
                                      pay.status === "VOID"
                                        ? "text-slate-400 dark:text-slate-500"
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
