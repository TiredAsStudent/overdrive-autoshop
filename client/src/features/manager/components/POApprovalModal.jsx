import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingCart,
  Building2,
  Loader2,
  Store,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  ClipboardList,
} from "lucide-react";
import { poApprovalService } from "../../../services/manager/poApproval.service";
import { useApp } from "../../../context/AppContext";
import StatusBadge from "../../../components/ui/StatusBadge";

const POApprovalModal = ({ isOpen, onClose, poId, onSuccess }) => {
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

  if (po && po.status !== "PENDING_APPROVAL") return null;

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
      onSuccess();
      onClose();
    } catch (err) {
      setValidationError(err.message);

      const errMsg = err.message.toLowerCase();
      if (errMsg.includes("conflict") || errMsg.includes("no longer pending")) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeVariant = (status) => {
    if (status === "PENDING_APPROVAL") return "warning";
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "danger";
    return "default";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95vh]"
          >
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <ShoppingCart size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate">
                    {po?.purchase_order_number || "Loading PO..."}
                  </h2>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    {po && (
                      <StatusBadge
                        label={po.status.replace("_", " ")}
                        variant={getBadgeVariant(po.status)}
                      />
                    )}
                    <span className="hidden sm:inline text-slate-300 dark:text-slate-600">
                      •
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                      Drafted by: {po?.created_by_name}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="px-4 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 sm:space-y-8">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-70">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Retrieving Document...
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200 text-center">
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
                <>
                  {/* SECTION 1: Vendor & Logistics */}
                  <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                      <Store size={14} /> Vendor & Logistics Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Target Vendor
                        </p>
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {po.vendor_name}
                        </p>
                        {po.contact_person && (
                          <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">
                            Attn: {po.contact_person}
                          </p>
                        )}
                        {po.vendor_email && (
                          <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">
                            {po.vendor_email}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 truncate mt-3 flex items-center gap-1.5 font-bold border-t border-slate-100 dark:border-slate-700/50 pt-3">
                          <Building2 size={12} /> {po.branch_name}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                              Purchase Date
                            </p>
                            <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate mt-0.5">
                              {new Date(po.created_at).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                              Delivery Target
                            </p>
                            <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate mt-0.5">
                              {new Date(
                                po.expected_delivery_date,
                              ).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 2: Itemized Breakdown */}
                  <section className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-10">
                    <div className="flex justify-between items-end mb-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                        <Package size={14} /> Requested Parts
                      </h3>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                      {po.items.map((item) => {
                        const net =
                          parseFloat(item.recorded_unit_cost) * item.quantity -
                          parseFloat(item.discount_amount);
                        return (
                          <div
                            key={item.id}
                            className="p-4 sm:p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] flex items-center justify-between shadow-sm"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                              <div className="p-2 rounded-md shrink-0 bg-slate-50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                <Package size={16} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate uppercase italic">
                                  [{item.sku}] {item.item_name}
                                </p>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-widest mt-0.5">
                                  {item.quantity}x @ ₱
                                  {parseFloat(
                                    item.recorded_unit_cost,
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                  {parseFloat(item.discount_amount) > 0 && (
                                    <span className="text-amber-500 ml-1.5">
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
                            <span className="text-sm font-black text-slate-900 dark:text-white font-mono shrink-0">
                              ₱
                              {net.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* SECTION 3: Financials & Remarks */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 relative z-0">
                    <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl flex flex-col justify-center">
                      <div className="space-y-2 mb-4 text-sm font-medium text-slate-400">
                        <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                          <span>Subtotal</span>
                          <span className="font-bold text-slate-200 font-mono">
                            ₱
                            {parseFloat(po.subtotal).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                          <span>VAT Allocation</span>
                          <span className="font-bold text-slate-200 font-mono">
                            ₱
                            {parseFloat(po.vat_amount).toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2 },
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 sm:pt-5 mt-2 border-t border-slate-700/50">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                          Grand Total
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight font-mono">
                          ₱
                          {parseFloat(po.grand_total).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </section>

                    <section className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col space-y-5">
                      {po.notes && (
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2">
                            <ClipboardList size={14} /> Staff Justification
                          </h3>
                          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed whitespace-pre-wrap break-words">
                              "{po.notes}"
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex-1 flex flex-col">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-3">
                          <MessageSquare size={14} /> Manager Remarks
                          <span className="text-red-500 ml-1 lowercase">
                            (Required for Rejection)
                          </span>
                        </label>
                        <textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Provide feedback or justification..."
                          disabled={isSubmitting}
                          className="w-full h-full min-h-[100px] px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none disabled:opacity-50 shadow-sm transition-all"
                        />
                      </div>
                    </section>
                  </div>
                </>
              )}
            </div>

            {/* MODAL FOOTER */}
            {po && !loading && (
              <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 shrink-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleDecision("REJECTED")}
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-500 text-slate-600 dark:text-slate-300 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle size={16} /> Reject Request
                  </button>
                  <button
                    onClick={() => handleDecision("APPROVED")}
                    disabled={isSubmitting}
                    className="flex-[1.5] py-3.5 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Approve Order
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default POApprovalModal;
