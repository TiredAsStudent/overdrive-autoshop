import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ClipboardList,
  Calendar,
  Building2,
  User,
  Printer,
  Loader2,
  Link,
} from "lucide-react";
import { salesOrderService } from "../../../services/staff/salesOrder.service";

const SalesOrderDrawer = ({ isOpen, onClose, salesOrderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && salesOrderId) {
      setLoading(true);
      setError("");
      salesOrderService
        .getSalesOrderDetails(salesOrderId)
        .then((res) => setOrder(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setOrder(null);
    }
  }, [isOpen, salesOrderId]);

  // Operational Status Styling Map
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING_SERVICE":
        return "text-slate-600 bg-slate-100 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20";
      case "IN_PROGRESS":
        return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
      case "COMPLETED":
      case "INVOICED":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "CANCELLED":
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
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {order?.sales_order_number || "Loading..."}
                  </h2>
                  {order && (
                    <span
                      className={`inline-flex px-2 py-0.5 mt-1 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}
                    >
                      {order.status.replace("_", " ")}
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
                    Retrieving Document...
                  </p>
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200">
                  {error}
                </div>
              )}

              {order && !loading && (
                <div className="space-y-8">
                  {/* Meta Source & Client Link */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <User size={14} className="text-slate-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Customer
                      </p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {order.customer_name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                        <Building2 size={10} /> {order.branch_name}
                      </p>
                    </div>
                    <div className="flex-1 p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                      <Link size={14} className="text-blue-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-1">
                        Source Document Link
                      </p>
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-400 truncate">
                        {order.estimate_number}
                      </p>
                      <p className="text-[10px] text-blue-600/70 dark:text-blue-500 truncate mt-0.5">
                        Financial Snapshot Frozen
                      </p>
                    </div>
                  </div>

                  {/* Target Completion Date */}
                  <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <Calendar size={18} className="text-amber-500" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Target Completion Date
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {order.estimated_completion_date
                          ? new Date(
                              order.estimated_completion_date,
                            ).toLocaleDateString()
                          : "Not Scheduled"}
                      </p>
                    </div>
                  </div>

                  {/* Line Items Table (Checklist Mode for Shop Floor) */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                      Approved Work Order Checklist
                    </h3>
                    <div className="space-y-3">
                      {order.items.map((item) => {
                        const isService = item.line_type === "SERVICE";
                        const net =
                          parseFloat(item.recorded_selling_price) *
                            item.quantity -
                          parseFloat(item.discount_amount);
                        return (
                          <div
                            key={item.id}
                            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                              <div
                                className={`w-2 h-2 rounded-full shrink-0 ${isService ? "bg-amber-400" : "bg-blue-400"}`}
                              />
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

                  {/* Totals Lock */}
                  <div className="bg-slate-900 dark:bg-black rounded-2xl p-5 text-white shadow-xl opacity-95">
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-3 border-b border-white/10 pb-2">
                      Locked Financials
                    </p>
                    <div className="space-y-1.5 mb-4 text-sm font-medium text-slate-400">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>
                          ₱
                          {parseFloat(order.subtotal).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT</span>
                        <span>
                          ₱
                          {parseFloat(order.vat_amount).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                      <span className="text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl font-black text-amber-500">
                        ₱
                        {parseFloat(order.grand_total).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-1">
                        Operational Notes
                      </p>
                      <p className="text-xs text-amber-900 dark:text-amber-200/80 italic">
                        "{order.notes}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Print Footer Stub */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={!order || loading}
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

export default SalesOrderDrawer;
