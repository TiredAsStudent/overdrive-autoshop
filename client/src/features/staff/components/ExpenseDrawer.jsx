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
  CheckCircle,
  XCircle,
  FileText,
  Building2,
  Loader2,
} from "lucide-react";
import { expenseService } from "../../../services/staff/expense.service";
import { catalogService } from "../../../services/staff/catalog.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const ExpenseDrawer = ({ isOpen, onClose, expenseId }) => {
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vatRate, setVatRate] = useState(12);

  useEffect(() => {
    if (isOpen && expenseId) {
      setLoading(true);

      catalogService
        .getSettings()
        .then((res) => {
          const fetchedVat = parseFloat(res.data?.vat_percentage);
          if (!isNaN(fetchedVat)) setVatRate(fetchedVat);
        })
        .catch((err) => console.error("Failed to load settings:", err));

      expenseService
        .getExpenseDetails(expenseId)
        .then((res) => setExpense(res.data))
        .catch((err) => console.error("Failed to load expense:", err))
        .finally(() => setLoading(false));
    } else {
      setExpense(null);
    }
  }, [isOpen, expenseId]);

  const getStatusBadgeVariant = (status) => {
    if (status === "APPROVED") return "success";
    if (status === "PENDING_APPROVAL") return "warning";
    if (status === "REJECTED") return "danger";
    return "default";
  };

  const getStatusBadgeIcon = (status) => {
    if (status === "APPROVED") return CheckCircle;
    if (status === "PENDING_APPROVAL") return Clock;
    if (status === "REJECTED") return XCircle;
    return FileText;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer z-40"
          />
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
            className="relative w-full sm:w-[500px] lg:w-[600px] bg-slate-50 dark:bg-slate-900/95 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <ReceiptText size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate">
                    {loading ? "Loading..." : expense?.expense_number}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {loading ? "..." : expense?.category}
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

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-70">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Retrieving Record...
                  </p>
                </div>
              ) : expense ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Current Status
                      </span>
                      <StatusBadge
                        label={expense.status.replace("_", " ")}
                        variant={getStatusBadgeVariant(expense.status)}
                        icon={getStatusBadgeIcon(expense.status)}
                      />
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Date Recorded
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {expense.status === "REJECTED" &&
                    expense.rejection_remarks && (
                      <div className="p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-3 shadow-sm">
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

                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Particulars
                    </h3>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                      {expense.description}
                    </p>
                  </div>

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
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate font-medium">
                          <Building2 size={10} /> {expense.branch_name}
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

                  <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px] p-5 space-y-3">
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
                        Input VAT (
                        {expense.is_vatable ? `${vatRate}%` : "Exempt"})
                      </span>
                      <span className="font-mono">
                        ₱
                        {parseFloat(expense.vat_amount).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-amber-200 dark:border-amber-500/30 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-400">
                          Grand Total
                        </span>
                        <span className="text-[9px] font-bold text-amber-600/70 dark:text-amber-500/70 uppercase">
                          Paid via {expense.payment_method.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-xl sm:text-2xl font-black font-mono text-amber-700 dark:text-amber-500 tracking-tight">
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

            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                disabled={!expense || loading}
                className="w-full py-3.5 sm:py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer size={16} /> Print Document
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExpenseDrawer;
