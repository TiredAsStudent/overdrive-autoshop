import React, { useState, useEffect, useRef, useId } from "react";
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
  Clock,
  User,
} from "lucide-react";
import { poApprovalService } from "../../../services/manager/poApproval.service";
import { useApp } from "../../../context/AppContext";
import StatusBadge from "../../../components/ui/StatusBadge";

const POApprovalModal = ({ isOpen, onClose, poId, onSuccess }) => {
  const { showToast } = useApp();

  // Accessible IDs
  const modalTitleId = useId();
  const remarksTextareaId = useId();

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(null);
  const [validationError, setValidationError] = useState("");

  const conflictTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (conflictTimerRef.current) {
        clearTimeout(conflictTimerRef.current);
      }
    };
  }, []);

  // Close modal on Escape key when not submitting
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    let isMounted = true;
    if (conflictTimerRef.current) {
      clearTimeout(conflictTimerRef.current);
      conflictTimerRef.current = null;
    }

    if (isOpen && poId) {
      setLoading(true);
      setError("");
      setRemarks("");
      setValidationError("");
      setSubmittingDecision(null);

      poApprovalService
        .getPODetails(poId)
        .then((res) => {
          if (isMounted) setPo(res.data);
        })
        .catch((err) => {
          if (isMounted) {
            setError(
              err.message || "Unable to retrieve purchase order document.",
            );
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setPo(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, poId]);

  const handleDecision = async (decision) => {
    if (!po || isSubmitting) return;
    setValidationError("");

    const trimmedRemarks = remarks.trim();
    if (decision === "REJECTED" && trimmedRemarks.length < 5) {
      setValidationError(
        "Rejection requires a detailed reason (min 5 characters).",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmittingDecision(decision);
    try {
      if (decision === "APPROVED") {
        await poApprovalService.approvePO(po.id, trimmedRemarks);
        showToast("Purchase Order Approved successfully.", "success");
      } else {
        await poApprovalService.rejectPO(po.id, trimmedRemarks);
        showToast("Purchase Order Rejected.", "success");
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const message =
        err.message || "Failed to process purchase order decision.";
      setValidationError(message);

      const errMsg = message.toLowerCase();
      if (errMsg.includes("conflict") || errMsg.includes("no longer pending")) {
        conflictTimerRef.current = setTimeout(() => {
          onSuccess?.();
          onClose?.();
        }, 3000);
      }
    } finally {
      setIsSubmitting(false);
      setSubmittingDecision(null);
    }
  };

  const getBadgeVariant = (status) => {
    if (status === "PENDING_APPROVAL") return "warning";
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "danger";
    return "default";
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const shouldRenderModal = isOpen && (!po || po.status === "PENDING_APPROVAL");

  return (
    <AnimatePresence>
      {shouldRenderModal && (
        <div
          onClick={() => !isSubmitting && onClose?.()}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[95dvh] sm:max-h-[92vh]"
          >
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0 gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <ShoppingCart size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={modalTitleId}
                    className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate"
                  >
                    {po?.purchase_order_number || "Loading PO..."}
                  </h2>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    {po && (
                      <StatusBadge
                        label={(po.status || "").replace(/_/g, " ")}
                        variant={getBadgeVariant(po.status)}
                        icon={Clock}
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className="hidden sm:inline text-slate-300 dark:text-slate-600"
                    >
                      •
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate flex items-center gap-1">
                      <User size={12} aria-hidden="true" />
                      <span>Drafted by: {po?.created_by_name || "System"}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close purchase order approval modal"
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="px-4 sm:px-8 py-6 sm:py-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 sm:space-y-8">
              {loading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-80"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-8 h-8 animate-spin mb-3 text-amber-500"
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Retrieving Document...
                  </p>
                </div>
              )}

              {error && !loading && (
                <div role="alert" className="form-error-banner">
                  <AlertCircle
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <span>{error}</span>
                </div>
              )}

              {validationError && (
                <div role="alert" className="form-error-banner">
                  <AlertCircle
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <span>{validationError}</span>
                </div>
              )}

              {po && !loading && (
                <>
                  {/* SECTION 1: Vendor & Logistics */}
                  <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 relative z-20">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-4 flex items-center gap-2">
                      <Store size={14} aria-hidden="true" />
                      <span>Vendor & Logistics Information</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Target Vendor
                        </p>
                        <p
                          className="text-sm font-black text-slate-900 dark:text-white truncate"
                          title={po.vendor_name}
                        >
                          {po.vendor_name}
                        </p>
                        {po.contact_person && (
                          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            Attn: {po.contact_person}
                          </p>
                        )}
                        {po.vendor_email && (
                          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {po.vendor_email}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-3 flex items-center gap-1.5 font-bold border-t border-slate-100 dark:border-slate-700/50 pt-3">
                          <Building2
                            size={12}
                            aria-hidden="true"
                            className="shrink-0"
                          />
                          <span className="truncate">{po.branch_name}</span>
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-center">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                              Purchase Date
                            </p>
                            <p className="text-xs font-mono tabular-nums font-black text-slate-800 dark:text-slate-200 truncate mt-0.5">
                              {new Date(po.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                              Delivery Target
                            </p>
                            <p className="text-xs font-mono tabular-nums font-black text-slate-800 dark:text-slate-200 truncate mt-0.5">
                              {new Date(
                                po.expected_delivery_date,
                              ).toLocaleDateString("en-US", {
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
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow flex items-center gap-2">
                        <Package size={14} aria-hidden="true" />
                        <span>Requested Parts</span>
                      </h3>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                      {(po.items || []).map((item) => {
                        const unitCost =
                          parseFloat(item.recorded_unit_cost) || 0;
                        const qty = parseInt(item.quantity, 10) || 0;
                        const discount = parseFloat(item.discount_amount) || 0;
                        const net = unitCost * qty - discount;

                        return (
                          <div
                            key={item.id}
                            className="p-4 sm:p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between shadow-2xs"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                              <div
                                aria-hidden="true"
                                className="p-2 rounded-md shrink-0 bg-slate-50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                              >
                                <Package size={16} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <p
                                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate uppercase italic"
                                  title={`[${item.sku}] ${item.item_name}`}
                                >
                                  <span className="font-mono tabular-nums not-italic text-amber-600 dark:text-overdrive-yellow">
                                    [{item.sku}]
                                  </span>{" "}
                                  {item.item_name}
                                </p>
                                <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 tracking-widest mt-0.5">
                                  {qty}x @ ₱{formatCurrency(unitCost)}
                                  {discount > 0 && (
                                    <span className="text-amber-600 dark:text-overdrive-yellow ml-1.5">
                                      (Disc: -₱{formatCurrency(discount)})
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums shrink-0">
                              ₱{formatCurrency(net)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* SECTION 3: Financials & Remarks */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 relative z-0">
                    <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800 flex flex-col justify-center">
                      <div className="space-y-2 mb-4 text-sm font-medium text-slate-400">
                        <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                          <span>Subtotal</span>
                          <span className="font-bold text-slate-200 font-mono tabular-nums">
                            ₱{formatCurrency(po.subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                          <span>VAT Allocation</span>
                          <span className="font-bold text-slate-200 font-mono tabular-nums">
                            ₱{formatCurrency(po.vat_amount)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 sm:pt-5 mt-2 border-t border-slate-700/50">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                          Grand Total
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-overdrive-yellow tracking-tight font-mono tabular-nums">
                          ₱{formatCurrency(po.grand_total)}
                        </span>
                      </div>
                    </section>

                    <section className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col space-y-5">
                      {po.notes && (
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-2 flex items-center gap-2">
                            <ClipboardList size={14} aria-hidden="true" />
                            <span>Staff Justification</span>
                          </h3>
                          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs">
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed whitespace-pre-wrap break-words">
                              "{po.notes}"
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex-1 flex flex-col">
                        <label
                          htmlFor={remarksTextareaId}
                          className="form-label flex flex-wrap items-center gap-2 mb-3"
                        >
                          <MessageSquare size={14} aria-hidden="true" />
                          <span>Manager Remarks</span>
                          <span className="text-red-500 lowercase">
                            (Required for Rejection)
                          </span>
                        </label>
                        <textarea
                          id={remarksTextareaId}
                          value={remarks}
                          onChange={(e) => {
                            setRemarks(e.target.value);
                            if (validationError) setValidationError("");
                          }}
                          placeholder="Provide feedback or justification..."
                          disabled={isSubmitting}
                          rows={4}
                          className="form-textarea flex-1 min-h-[100px] resize-none font-medium"
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
                    type="button"
                    onClick={() => handleDecision("REJECTED")}
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-300 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {submittingDecision === "REJECTED" ? (
                      <Loader2
                        size={16}
                        aria-hidden="true"
                        className="animate-spin"
                      />
                    ) : (
                      <XCircle size={16} aria-hidden="true" />
                    )}
                    <span>Reject Request</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision("APPROVED")}
                    disabled={isSubmitting}
                    className="flex-[1.5] py-3.5 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingDecision === "APPROVED" ? (
                      <Loader2
                        size={16}
                        aria-hidden="true"
                        className="animate-spin"
                      />
                    ) : (
                      <CheckCircle size={16} aria-hidden="true" />
                    )}
                    <span>Approve Order</span>
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
