import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X,
  Receipt,
  Calendar,
  Building2,
  User,
  Printer,
  Loader2,
  Link,
  CreditCard,
  History,
} from "lucide-react";
import { invoiceService } from "../../../services/staff/invoice.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const InvoiceDrawer = ({ isOpen, onClose, invoiceId }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && invoiceId) {
      setLoading(true);
      setError("");
      invoiceService
        .getInvoiceDetails(invoiceId)
        .then((res) => setInvoice(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setInvoice(null);
    }
  }, [isOpen, invoiceId]);

  const getStatusVariant = (status) => {
    switch (status) {
      case "PAID":
        return "success";
      case "PARTIALLY_PAID":
        return "warning";
      case "OVERDUE":
        return "danger";
      case "VOID":
      case "UNPAID":
      default:
        return "default";
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
            className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[600px] bg-slate-50 dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <Receipt size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {invoice?.invoice_number || "Loading..."}
                  </h2>
                  {invoice && (
                    <div className="mt-1">
                      <StatusBadge
                        label={invoice.status.replace("_", " ")}
                        variant={getStatusVariant(invoice.status)}
                        className={
                          invoice.status === "VOID"
                            ? "line-through opacity-70"
                            : ""
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-50/50 dark:bg-transparent">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Retrieving Ledger...
                  </p>
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200">
                  {error}
                </div>
              )}

              {invoice && !loading && (
                <div className="space-y-8">
                  {/* Meta Link Cards */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <User size={14} className="text-slate-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Billed To
                      </p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {invoice.customer_name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                        <Building2 size={10} /> {invoice.branch_name}
                      </p>
                    </div>
                    <div className="flex-1 p-5 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20 shadow-sm">
                      <Link size={14} className="text-blue-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-1">
                        Source Operation
                      </p>
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-400 truncate">
                        {invoice.sales_order_number}
                      </p>
                      <p className="text-[10px] text-blue-600/70 dark:text-blue-500 truncate mt-0.5">
                        Work Order Completed
                      </p>
                    </div>
                  </div>

                  {/* Due Date Indicator */}
                  <div className="flex items-center gap-3 p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[20px]">
                    <Calendar size={18} className="text-amber-500" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Payment Due Date
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Billing Table */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[24px] overflow-hidden shadow-sm">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Finalized Billing Statement
                      </h3>
                    </div>
                    <div className="p-5 space-y-3">
                      {invoice.items.map((item) => {
                        const isService = item.line_type === "SERVICE";
                        const net =
                          parseFloat(item.recorded_selling_price) *
                            item.quantity -
                          parseFloat(item.discount_amount);
                        return (
                          <div
                            key={item.id}
                            className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-[16px] flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                              <div className="flex flex-col min-w-0">
                                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate uppercase italic">
                                  {isService
                                    ? item.service_name
                                    : item.item_name}
                                </p>
                                <p className="text-[9px] font-bold text-slate-500 tracking-widest mt-0.5">
                                  {item.quantity}x @ ₱
                                  {parseFloat(
                                    item.recorded_selling_price,
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                  {parseFloat(item.discount_amount) > 0 && (
                                    <span className="text-amber-500 ml-1.5 font-bold">
                                      (Disc: -₱
                                      {parseFloat(
                                        item.discount_amount,
                                      ).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                      })}
                                      )
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                              ₱
                              {net.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Financial Locking Container */}
                  <div className="bg-slate-900 dark:bg-black rounded-[24px] p-5 sm:p-6 text-white shadow-xl opacity-95">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 border-b border-white/10 pb-3">
                      Receivable Lock
                    </p>
                    <div className="space-y-2 mb-5 text-sm font-medium text-slate-400">
                      <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>Subtotal</span>
                        <span className="font-bold text-slate-200 font-mono">
                          ₱
                          {parseFloat(invoice.subtotal).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>

                      {parseFloat(invoice.total_discount) > 0 && (
                        <div className="flex justify-between items-center bg-amber-500/10 p-3 sm:p-4 rounded-xl text-amber-500">
                          <span className="font-bold">Discounts Applied</span>
                          <span className="font-black font-mono">
                            - ₱
                            {parseFloat(invoice.total_discount).toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2 },
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>VAT (12%)</span>
                        <span className="font-bold text-slate-200 font-mono">
                          ₱
                          {parseFloat(invoice.vat_amount).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-y border-slate-800 mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl font-black text-white font-mono">
                        ₱
                        {parseFloat(invoice.grand_total).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium text-emerald-500 mb-3 bg-emerald-500/10 p-3 sm:p-4 rounded-xl">
                      <span>Total Amount Paid</span>
                      <span className="font-black font-mono">
                        - ₱
                        {parseFloat(invoice.amount_paid).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                      <span className="text-sm font-black uppercase tracking-widest text-rose-400">
                        Balance Due
                      </span>
                      <span className="text-2xl font-black text-rose-500 font-mono">
                        ₱
                        {(
                          parseFloat(invoice.grand_total) -
                          parseFloat(invoice.amount_paid)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {invoice.payments && invoice.payments.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[24px] overflow-hidden shadow-sm">
                      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2">
                        <History size={14} className="text-emerald-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Payment Ledger
                        </h3>
                      </div>
                      <div className="p-5 space-y-3">
                        {invoice.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className={`p-4 rounded-[16px] border flex items-center justify-between ${
                              payment.status === "VOID"
                                ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60"
                                : "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20"
                            }`}
                          >
                            <div>
                              <p
                                className={`text-xs font-black uppercase tracking-widest ${payment.status === "VOID" ? "text-slate-500 line-through" : "text-emerald-700 dark:text-emerald-400"}`}
                              >
                                {payment.payment_number}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                  {payment.payment_date}
                                </span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  {payment.payment_method.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className={`text-sm font-black font-mono ${payment.status === "VOID" ? "text-slate-500 line-through" : "text-emerald-600 dark:text-emerald-400"}`}
                              >
                                ₱
                                {parseFloat(
                                  payment.amount_received,
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                              {payment.status === "VOID" && (
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5">
                                  VOIDED
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {invoice.notes && (
                    <div className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">
                        Invoice Notes
                      </p>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                        "{invoice.notes}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 shrink-0 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
              <button
                disabled={!invoice || loading}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer size={16} /> Print Document
              </button>
              <button
                onClick={() =>
                  navigate("/staff/sales/payments", {
                    state: { invoiceId: invoice.id },
                  })
                }
                disabled={
                  !invoice ||
                  loading ||
                  invoice.status === "PAID" ||
                  invoice.status === "VOID"
                }
                className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                <CreditCard size={16} /> Record Payment
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InvoiceDrawer;
