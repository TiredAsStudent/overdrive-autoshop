import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingCart,
  Calendar,
  Building2,
  User,
  Loader2,
  Store,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { poApprovalService } from "../../../services/manager/poApproval.service";
import { useApp } from "../../../context/AppContext";

const PurchaseOrderApprovalDrawer = ({ isOpen, onClose, poId, onSuccess }) => {
  const { showToast } = useApp();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (isOpen && poId) {
      setLoading(true);
      setError("");
      setRemarks("");
      setValidationError("");
      poApprovalService
        .getPODetails(poId)
        .then((res) => setPo(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setPo(null);
    }
  }, [isOpen, poId]);

  const handleDecision = async (decision) => {
    setValidationError("");
    if (decision === "REJECTED" && remarks.trim().length < 5) {
      setValidationError(
        "Rejection requires a detailed reason (min 5 characters).",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (decision === "APPROVED") {
        await poApprovalService.approvePO(po.id, remarks);
        showToast("Purchase Order Approved successfully.", "success");
      } else {
        await poApprovalService.rejectPO(po.id, remarks);
        showToast("Purchase Order Rejected.", "success");
      }
      onSuccess(); // Refresh the list
      onClose(); // Close Drawer
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
      case "APPROVED":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "REJECTED":
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
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-500">
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
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
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

              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-sm font-bold">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {po && !loading && (
                <div className="space-y-8">
                  {/* Historical Remarks (If already processed) */}
                  {po.approval_remarks && po.status !== "PENDING_APPROVAL" && (
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
                    <div className="flex-1 p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                      <Calendar size={14} className="text-indigo-400 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-500 mb-1">
                        Delivery Target
                      </p>
                      <p className="text-xs font-bold text-indigo-900 dark:text-indigo-400 truncate">
                        {new Date(
                          po.expected_delivery_date,
                        ).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-indigo-600/70 dark:text-indigo-500/70 truncate mt-0.5 flex items-center gap-1">
                        <User size={10} /> By: {po.created_by_name}
                      </p>
                    </div>
                  </div>

                  {/* Line Items Detail */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                      Requested Parts
                    </h3>
                    <div className="space-y-3">
                      {po.items.map((item) => {
                        const net =
                          parseFloat(item.recorded_unit_cost) * item.quantity -
                          parseFloat(item.discount_amount);
                        return (
                          <div
                            key={item.id}
                            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                              <div className="p-1.5 rounded-md shrink-0 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                <Package size={14} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase italic">
                                  [{item.sku}] {item.item_name}
                                </p>
                                <p className="text-[9px] font-bold text-slate-500 tracking-widest mt-0.5">
                                  {item.quantity}x @ ₱
                                  {parseFloat(
                                    item.recorded_unit_cost,
                                  ).toLocaleString()}
                                  {parseFloat(item.discount_amount) > 0 &&
                                    ` (Less: ₱${item.discount_amount})`}
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
                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-3 border-b border-white/10 pb-2">
                      Requested Financial Commitment
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
                      <span className="text-2xl font-black text-indigo-400">
                        ₱
                        {parseFloat(po.grand_total).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Staff Notes */}
                  {po.notes && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-1">
                        Staff Justification
                      </p>
                      <p className="text-xs text-amber-900 dark:text-amber-200/80 italic">
                        "{po.notes}"
                      </p>
                    </div>
                  )}

                  {/* Decision Area (Only visible if PENDING_APPROVAL) */}
                  {po.status === "PENDING_APPROVAL" && (
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <MessageSquare size={14} /> Manager Remarks (Required
                        for Rejection)
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Provide feedback or justification..."
                        rows="3"
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none disabled:opacity-50"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Footer */}
            {po?.status === "PENDING_APPROVAL" && !loading && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => handleDecision("REJECTED")}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision("APPROVED")}
                  disabled={isSubmitting}
                  className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Approve Order
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PurchaseOrderApprovalDrawer;
