import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  Building2,
  User,
  Printer,
  Loader2,
  Link,
  Wallet,
  Banknote,
  Landmark,
  Calendar,
  BadgeCheck,
} from "lucide-react";
import { paymentService } from "../../../services/staff/payment.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const PaymentDrawer = ({ isOpen, onClose, paymentId }) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && paymentId) {
      setLoading(true);
      setError("");
      paymentService
        .getPaymentDetails(paymentId)
        .then((res) => setPayment(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setPayment(null);
    }
  }, [isOpen, paymentId]);

  const formatCalendarDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split("T")[0].split("-");
    return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
  };

  const renderMethodBadge = (method) => {
    switch (method) {
      case "CASH":
        return <StatusBadge label="CASH" variant="default" icon={Banknote} />;
      case "GCASH":
        return <StatusBadge label="GCASH" variant="info" icon={Wallet} />;
      case "MAYA":
        return <StatusBadge label="MAYA" variant="success" icon={Wallet} />;
      case "BANK_TRANSFER":
        return <StatusBadge label="BANK" variant="info" icon={Landmark} />;
      default:
        return null;
    }
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
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <CreditCard size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {payment?.payment_number || "Loading..."}
                  </h2>

                  {payment && (
                    <div className="flex flex-col items-start gap-1.5 mt-1.5">
                      <StatusBadge
                        label={
                          payment.status === "VOID"
                            ? "VOIDED"
                            : "OFFICIAL RECEIPT"
                        }
                        variant={
                          payment.status === "VOID" ? "danger" : "success"
                        }
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <BadgeCheck size={12} className="text-amber-500" />
                        Recorded by:{" "}
                        <span className="text-slate-600 dark:text-slate-300">
                          {payment.created_by_name || "System"}
                        </span>
                      </span>
                    </div>
                  )}
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
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 opacity-70">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Retrieving Record...
                  </p>
                </div>
              )}
              {error && (
                <div className="p-4 text-center bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200">
                  {error}
                </div>
              )}

              {payment && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Meta Source & Client Link */}
                  <div className="grid grid-cols-2 gap-4 sm:gap-5">
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                      <User size={16} className="text-slate-400 mb-3" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Received From
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {payment.customer_name}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate font-medium">
                          <Building2 size={10} /> {payment.branch_name}
                        </p>
                      </div>
                    </section>

                    <section className="p-5 sm:p-6 bg-blue-50 dark:bg-blue-500/5 rounded-[20px] sm:rounded-[24px] border border-blue-100 dark:border-blue-500/20 shadow-sm flex flex-col justify-between">
                      <Link size={16} className="text-blue-400 mb-3" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">
                          Applied To
                        </p>
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-400 truncate">
                          {payment.invoice_number}
                        </p>
                        <p className="text-[10px] text-blue-600/70 dark:text-blue-500/70 mt-0.5 truncate font-medium">
                          Asset Liquidated
                        </p>
                      </div>
                    </section>
                  </div>

                  {/* Transaction Details */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                    <div className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between gap-5 sm:items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Collection Method
                        </p>
                        {renderMethodBadge(payment.payment_method)}
                      </div>
                      <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                      <div className="sm:text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center sm:justify-end gap-1.5">
                          <Calendar size={12} className="text-slate-400" />{" "}
                          Payment Date
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatCalendarDate(
                            payment.payment_date || payment.created_at,
                          )}
                        </p>
                      </div>
                    </div>
                    {payment.reference_number && (
                      <div className="px-5 py-4 sm:px-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Reference Number
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white font-mono tracking-wider">
                          {payment.reference_number}
                        </p>
                      </div>
                    )}
                  </section>

                  {/* Receipt Math */}
                  <section
                    className={`bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl opacity-95 ${
                      payment.status === "VOID"
                        ? "border border-rose-500/30"
                        : ""
                    }`}
                  >
                    <p
                      className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${
                        payment.status === "VOID"
                          ? "text-rose-500"
                          : "text-emerald-500"
                      } mb-4 border-b border-white/10 pb-3`}
                    >
                      {payment.status === "VOID"
                        ? "Voided Transaction"
                        : "Financial Liquidation"}
                    </p>
                    <div className="flex justify-between items-center text-sm font-medium text-slate-400 mb-4">
                      <span>Associated Invoice Total</span>
                      <span className="font-mono">
                        ₱
                        {parseFloat(payment.invoice_total).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <span
                        className={`text-xs sm:text-sm font-black uppercase tracking-widest ${
                          payment.status === "VOID"
                            ? "text-rose-400 line-through"
                            : "text-emerald-400"
                        }`}
                      >
                        Amount Received
                      </span>
                      <span
                        className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                          payment.status === "VOID"
                            ? "text-rose-500/50 line-through"
                            : "text-emerald-500"
                        }`}
                      >
                        ₱
                        {parseFloat(payment.amount_received).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </section>

                  {/* Notes */}
                  {payment.notes && (
                    <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">
                        Collection Notes
                      </p>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                        "{payment.notes}"
                      </p>
                    </section>
                  )}
                </div>
              )}
            </div>

            {/* Print Footer Stub */}
            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-3 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
              <button
                disabled={!payment || loading || payment.status === "VOID"}
                className="w-full py-3.5 sm:py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer size={16} /> Print Official Receipt
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentDrawer;
