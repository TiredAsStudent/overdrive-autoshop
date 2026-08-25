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
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[600px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {payment?.payment_number || "Loading..."}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Official Payment Receipt
                    </p>
                    {payment?.status === "VOID" && (
                      <StatusBadge label="VOIDED" variant="danger" />
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Retrieving Record...
                  </p>
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200">
                  {error}
                </div>
              )}

              {payment && !loading && (
                <div className="space-y-8">
                  {/* Meta Profile & Link */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <User size={14} className="text-slate-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Received From
                      </p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {payment.customer_name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                        <Building2 size={10} /> {payment.branch_name}
                      </p>
                    </div>
                    <div className="flex-1 p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                      <Link size={14} className="text-blue-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-1">
                        Applied To
                      </p>
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-400 truncate">
                        {payment.invoice_number}
                      </p>
                      <p className="text-[10px] text-blue-600/70 dark:text-blue-500 truncate mt-0.5">
                        Asset Liquidated
                      </p>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Method
                        </p>
                        <div className="mt-1.5">
                          {renderMethodBadge(payment.payment_method)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Payment Date
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                          {formatCalendarDate(
                            payment.payment_date || payment.created_at,
                          )}
                        </p>
                      </div>
                    </div>
                    {payment.reference_number && (
                      <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Reference Number
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 font-mono tracking-wider">
                          {payment.reference_number}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Receipt Math */}
                  <div
                    className={`rounded-2xl p-5 shadow-xl ${payment.status === "VOID" ? "bg-rose-950/20 border border-rose-500/20" : "bg-slate-900 dark:bg-black"}`}
                  >
                    <div className="flex justify-between items-center text-sm font-medium text-slate-400 mb-4">
                      <span>Associated Invoice Total</span>
                      <span>
                        ₱
                        {parseFloat(payment.invoice_total).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <span
                        className={`text-sm font-black uppercase tracking-widest ${payment.status === "VOID" ? "text-rose-400 line-through" : "text-emerald-400"}`}
                      >
                        Amount Received
                      </span>
                      <span
                        className={`text-3xl font-black ${payment.status === "VOID" ? "text-rose-500/50 line-through" : "text-emerald-500"}`}
                      >
                        ₱
                        {parseFloat(payment.amount_received).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {payment.notes && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Collection Notes
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                        "{payment.notes}"
                      </p>
                    </div>
                  )}

                  <div className="text-center mt-8">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Recorded By: {payment.created_by_name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Print Footer Stub */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={!payment || loading || payment.status === "VOID"}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <Printer size={16} /> Print Official Receipt
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentDrawer;
