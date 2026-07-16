import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingCart,
  Calendar,
  Building2,
  User,
  Printer,
  Loader2,
  Store,
  Package,
  Settings,
  AlertCircle,
} from "lucide-react";
import { purchaseOrderService } from "../../../services/staff/purchaseOrder.service";

const PurchaseOrderDrawer = ({ isOpen, onClose, poId }) => {
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && poId) {
      setLoading(true);
      setError("");
      purchaseOrderService
        .getPurchaseOrderDetails(poId)
        .then((res) => setPo(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setPo(null);
    }
  }, [isOpen, poId]);

  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "text-slate-600 bg-slate-100 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20";
      case "PENDING_APPROVAL":
        return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
      case "APPROVED":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "REJECTED":
      case "CANCELLED":
        return "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
      case "CLOSED":
        return "text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400 border-sky-200 dark:border-sky-500/20";
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
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {po?.purchase_order_number || "Loading..."}
                  </h2>
                  {po && (
                    <span
                      className={`inline-flex px-2 py-0.5 mt-1 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusColor(po.status)}`}
                    >
                      {po.status.replace("_", " ")}
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

              {po && !loading && (
                <div className="space-y-8">
                  {/* Rejection / Approval Remarks */}
                  {po.approval_remarks && (
                    <div
                      className={`p-4 rounded-xl border flex items-start gap-3 ${po.status === "REJECTED" ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-800 dark:text-rose-300" : "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300"}`}
                    >
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">
                          Managerial Feedback
                        </p>
                        <p className="text-xs font-bold leading-relaxed">
                          {po.approval_remarks}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Meta Linkages */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <Store size={14} className="text-slate-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Target Vendor
                      </p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {po.vendor_name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                        <Building2 size={10} /> {po.branch_name}
                      </p>
                    </div>
                    <div className="flex-1 p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/20">
                      <Calendar size={14} className="text-amber-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-1">
                        Delivery Target
                      </p>
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-400 truncate">
                        {new Date(
                          po.expected_delivery_date,
                        ).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70 truncate mt-0.5 flex items-center gap-1">
                        <User size={10} /> By: {po.created_by_name}
                      </p>
                    </div>
                  </div>

                  {/* Line Items Detail */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                      Procurement Roster
                    </h3>
                    <div className="space-y-3">
                      {po.items.map((item) => {
                        const isPart = item.line_type === "PART";
                        const net =
                          parseFloat(item.recorded_unit_cost) * item.quantity -
                          parseFloat(item.discount_amount);
                        return (
                          <div
                            key={item.id}
                            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                              <div
                                className={`p-1.5 rounded-md shrink-0 ${isPart ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20" : "bg-blue-100 text-blue-600 dark:bg-blue-500/20"}`}
                              >
                                {isPart ? (
                                  <Package size={14} />
                                ) : (
                                  <Settings size={14} />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase italic">
                                  {isPart
                                    ? `[${item.sku}] ${item.item_name}`
                                    : item.sublet_description}
                                </p>
                                <p className="text-[9px] font-bold text-slate-500 tracking-widest mt-0.5">
                                  {item.quantity}x @ ₱
                                  {parseFloat(
                                    item.recorded_unit_cost,
                                  ).toLocaleString()}{" "}
                                  {parseFloat(item.discount_amount) > 0 &&
                                    `(Less: ₱${item.discount_amount})`}
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

                  {/* Financials */}
                  <div className="bg-slate-900 dark:bg-black rounded-2xl p-5 text-white shadow-xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-3 border-b border-white/10 pb-2">
                      Financial Lock
                    </p>
                    <div className="space-y-1.5 mb-4 text-sm font-medium text-slate-400">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>
                          ₱
                          {parseFloat(po.subtotal).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT Allocation</span>
                        <span>
                          ₱
                          {parseFloat(po.vat_amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                      <span className="text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl font-black text-amber-500">
                        ₱
                        {parseFloat(po.grand_total).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {po.notes && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Logistics Notes
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                        "{po.notes}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Print Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={!po || loading}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer size={16} /> Print Procurement Document
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PurchaseOrderDrawer;
