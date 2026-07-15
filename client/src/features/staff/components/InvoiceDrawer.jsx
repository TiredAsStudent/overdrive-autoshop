import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { invoiceService } from "../../../services/staff/invoice.service";

const InvoiceDrawer = ({ isOpen, onClose, invoiceId }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const getStatusColor = (status) => {
    switch (status) {
      case "UNPAID":
        return "text-slate-600 bg-slate-100 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20";
      case "PARTIALLY_PAID":
        return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
      case "PAID":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "OVERDUE":
        return "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
      default:
        return "text-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20";
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
                  <Receipt size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {invoice?.invoice_number || "Loading..."}
                  </h2>
                  {invoice && (
                    <span
                      className={`inline-flex px-2 py-0.5 mt-1 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusColor(invoice.status)}`}
                    >
                      {invoice.status.replace("_", " ")}
                    </span>
                  )}
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
                  {/* Meta Profile & Link */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
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
                    <div className="flex-1 p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20">
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

                  {/* Due Date */}
                  <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
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

                  {/* Render Lines */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                      Finalized Billing Statement
                    </h3>
                    <div className="space-y-3">
                      {invoice.items.map((item) => {
                        const isService = item.line_type === "SERVICE";
                        const net =
                          parseFloat(item.recorded_selling_price) *
                            item.quantity -
                          parseFloat(item.discount_amount);
                        return (
                          <div
                            key={item.id}
                            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                              <div className="flex flex-col min-w-0">
                                <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase italic">
                                  {isService
                                    ? item.service_name
                                    : item.item_name}
                                </p>
                                <p className="text-[9px] font-bold text-slate-500 tracking-widest mt-0.5">
                                  {item.quantity}x @ ₱
                                  {parseFloat(
                                    item.recorded_selling_price,
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white">
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

                  {/* Receivables Calculation */}
                  <div className="bg-slate-900 dark:bg-black rounded-2xl p-5 text-white shadow-xl">
                    <div className="space-y-1.5 mb-4 text-sm font-medium text-slate-400">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>
                          ₱
                          {parseFloat(invoice.subtotal).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT</span>
                        <span>
                          ₱
                          {parseFloat(invoice.vat_amount).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-y border-slate-800 mb-3">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-lg font-black text-white">
                        ₱
                        {parseFloat(invoice.grand_total).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium text-emerald-500 mb-3">
                      <span>Amount Paid</span>
                      <span>
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
                      <span className="text-2xl font-black text-rose-500">
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

                  {/* Notes */}
                  {invoice.notes && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Invoice Notes
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                        "{invoice.notes}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Print Footer Stub */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                disabled={!invoice || loading}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer size={16} /> Print Document
              </button>
              <button
                disabled={!invoice || loading || invoice.status === "PAID"}
                className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
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
