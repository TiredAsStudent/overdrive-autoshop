import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ReceiptText,
  Clock,
  Store,
  Calculator,
  Printer,
  ShieldAlert,
} from "lucide-react";
import { expenseService } from "../../../services/staff/expense.service";

const ExpenseDrawer = ({ isOpen, onClose, expenseId }) => {
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && expenseId) {
      setLoading(true);
      expenseService
        .getExpenseDetails(expenseId)
        .then((res) => setExpense(res.data))
        .catch((err) => console.error("Failed to load expense:", err))
        .finally(() => setLoading(false));
    } else {
      setExpense(null);
    }
  }, [isOpen, expenseId]);

  if (!isOpen) return null;

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
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[500px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <ReceiptText size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate">
                    {loading ? "Loading..." : expense?.expense_number}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {loading ? "..." : expense?.category}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
              ) : expense ? (
                <>
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Current Status
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase border ${
                          expense.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                            : expense.status === "REJECTED"
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                              : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 border-amber-200 dark:border-amber-500/20"
                        }`}
                      >
                        {expense.status === "PENDING_APPROVAL" && (
                          <Clock size={12} />
                        )}
                        {expense.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Date Recorded
                      </p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Rejection Remarks Warning */}
                  {expense.status === "REJECTED" &&
                    expense.rejection_remarks && (
                      <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3">
                        <ShieldAlert
                          size={18}
                          className="text-rose-600 shrink-0 mt-0.5"
                        />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">
                            Manager Feedback
                          </p>
                          <p className="text-xs font-bold text-rose-900 dark:text-rose-200/80 leading-relaxed">
                            "{expense.rejection_remarks}"
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Description Box */}
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Particulars
                    </h3>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                      {expense.description}
                    </p>
                  </div>

                  {/* Vendor / Reference Info */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-1.5">
                      <Store size={12} /> Payee Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Vendor / Entity
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {expense.vendor_name || "Unregistered Entity"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Ref / Receipt #
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white uppercase truncate">
                          {expense.reference_number || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financials Summary */}
                  <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 flex items-center gap-1.5 mb-2">
                      <Calculator size={12} /> Financial Posting
                    </h3>
                    <div className="flex justify-between text-xs font-medium text-amber-800 dark:text-amber-200/70">
                      <span>Subtotal</span>
                      <span className="font-mono">
                        ₱
                        {parseFloat(expense.subtotal).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-amber-800 dark:text-amber-200/70">
                      <span>
                        Input VAT ({expense.is_vatable ? "12%" : "Exempt"})
                      </span>
                      <span className="font-mono">
                        ₱
                        {parseFloat(expense.vat_amount).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-amber-200 dark:border-amber-500/30 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-400">
                          Grand Total
                        </span>
                        <span className="text-[9px] font-bold text-amber-600/70 dark:text-amber-500/70 uppercase">
                          Paid via {expense.payment_method.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-lg font-black font-mono text-amber-700 dark:text-amber-500">
                        ₱
                        {parseFloat(expense.total_amount).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </div>

                  {expense.notes && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-xs text-slate-600 dark:text-slate-400 italic border border-slate-100 dark:border-slate-800">
                      " {expense.notes} "
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Print Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={!expense || loading}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer size={16} /> Print Voucher
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExpenseDrawer;
