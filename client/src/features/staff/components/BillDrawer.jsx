import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Receipt,
  CheckCircle,
  Clock,
  CalendarCheck,
  PackageCheck,
  Store,
  ShieldCheck,
  Calculator,
  Printer,
} from "lucide-react";
import { billService } from "../../../services/staff/bill.service";

const BillDrawer = ({ isOpen, onClose, billId }) => {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && billId) {
      setLoading(true);
      billService
        .getBillDetails(billId)
        .then((res) => setBill(res.data))
        .catch((err) => console.error("Failed to load bill:", err))
        .finally(() => setLoading(false));
    } else {
      setBill(null);
    }
  }, [isOpen, billId]);

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
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[550px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <Receipt size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate">
                    {loading ? "Loading..." : bill?.bill_number}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {loading
                      ? "..."
                      : `Invoice: ${bill?.vendor_invoice_number}`}
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
              ) : bill ? (
                <>
                  {/* Status & PO Link */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      {/* Receive Status */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase ${
                          bill.status === "RECEIVED"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                            : bill.status === "CLOSED"
                              ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20"
                              : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20"
                        }`}
                      >
                        {bill.status === "RECEIVED" && (
                          <CheckCircle size={12} />
                        )}
                        {bill.status === "PENDING_RECEIPT" && (
                          <Clock size={12} />
                        )}
                        {bill.status.replace("_", " ")}
                      </span>

                      {/* Payment Status */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase ${
                          bill.payment_status === "PAID"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                            : bill.payment_status === "PARTIALLY_PAID"
                              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                              : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                        }`}
                      >
                        {bill.payment_status?.replace("_", " ") || "UNPAID"}
                      </span>
                    </div>
                    <div className="text-right mt-2 sm:mt-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Source PO
                      </p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {bill.purchase_order_number}
                      </p>
                    </div>
                  </div>

                  {/* Vendor Info */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-slate-100 dark:border-slate-700 pb-2 mb-2 flex items-center gap-1.5">
                      <Store size={12} /> Supplier Entity
                    </h3>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                          {bill.vendor_name}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                          {bill.is_vat_registered ? (
                            <>
                              <ShieldCheck
                                size={12}
                                className="text-emerald-500"
                              />{" "}
                              VAT Registered
                            </>
                          ) : (
                            "Non-VAT Entity"
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Billing Date
                        </p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 justify-end">
                          <CalendarCheck size={12} />{" "}
                          {new Date(bill.bill_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1">
                      <PackageCheck size={12} /> Received Items
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                      {bill.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 last:border-0"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.item_name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {item.sku}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {item.quantity_received} {item.uom}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                              @ ₱
                              {parseFloat(
                                item.recorded_unit_cost,
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
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
                        {parseFloat(bill.subtotal).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    {parseFloat(bill.discount_amount) > 0 && (
                      <div className="flex justify-between text-xs font-medium text-red-600 dark:text-red-400">
                        <span>Discount Applied</span>
                        <span className="font-mono">
                          - ₱
                          {parseFloat(bill.discount_amount).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs font-medium text-amber-800 dark:text-amber-200/70">
                      <span>
                        VAT ({bill.is_vat_registered ? "12%" : "Exempt"})
                      </span>
                      <span className="font-mono">
                        ₱
                        {parseFloat(bill.vat_amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-amber-200 dark:border-amber-500/30 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-400">
                        Grand Total
                      </span>
                      <span className="text-base font-black font-mono text-amber-700 dark:text-amber-500">
                        ₱
                        {parseFloat(bill.grand_total).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </div>

                  {bill.notes && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-xs text-slate-600 dark:text-slate-400 italic border border-slate-100 dark:border-slate-800">
                      " {bill.notes} "
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Print Footer Stub */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={!bill || loading}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer size={16} /> Print Document
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BillDrawer;
