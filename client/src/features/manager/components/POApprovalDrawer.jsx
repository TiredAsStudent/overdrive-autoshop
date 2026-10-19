import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingCart,
  Calendar,
  Building2,
  Loader2,
  Store,
  Package,
  AlertCircle,
  BadgeCheck,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { poApprovalService } from "../../../services/manager/poApproval.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const PurchaseOrderApprovalDrawer = ({ isOpen, onClose, poId }) => {
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && poId) {
      setLoading(true);
      setError("");
      poApprovalService
        .getPODetails(poId)
        .then((res) => {
          if (isMounted) setPo(res.data);
        })
        .catch((err) => {
          if (isMounted) {
            setError(
              err.message || "Unable to retrieve purchase order details.",
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

  // Close drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const getStatusVariant = (status) => {
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "danger";
    return "default";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "APPROVED":
        return CheckCircle;
      case "REJECTED":
        return XCircle;
      default:
        return FileText;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const shouldRenderDrawer =
    isOpen && (!po || po.status !== "PENDING_APPROVAL");

  return (
    <AnimatePresence>
      {shouldRenderDrawer && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* 1. Standardized Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* 2. Standardized Drawer Panel */}
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
            className="relative h-full h-dvh w-full sm:w-[500px] lg:w-[600px] bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
          >
            {/* 3. Standardized Fixed Header */}
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <ShoppingCart size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]"
                  >
                    {loading
                      ? "Loading..."
                      : po?.purchase_order_number || "Purchase Order"}
                  </h2>

                  {po && (
                    <div className="flex flex-col items-start gap-1.5 mt-1.5">
                      <StatusBadge
                        label={(po.status || "").replace(/_/g, " ")}
                        variant={getStatusVariant(po.status)}
                        icon={getStatusIcon(po.status)}
                      />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <BadgeCheck
                          size={12}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                        />
                        <span>Drafted by:</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {po.created_by_name || "System"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Close purchase order details drawer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {/* 4. Standardized Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {loading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-center justify-center py-20 opacity-80"
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

              {po && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Meta Linkages */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-5">
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                      <Store
                        size={16}
                        aria-hidden="true"
                        className="text-slate-400 mb-3"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Target Vendor
                        </p>
                        <p
                          className="text-sm font-bold text-slate-900 dark:text-white truncate"
                          title={po.vendor_name}
                        >
                          {po.vendor_name}
                        </p>
                        {po.contact_person && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                            Attn: {po.contact_person}
                          </p>
                        )}
                        {po.vendor_email && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                            {po.vendor_email}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 truncate font-medium">
                          <Building2
                            size={10}
                            aria-hidden="true"
                            className="shrink-0"
                          />
                          <span className="truncate">{po.branch_name}</span>
                        </p>
                      </div>
                    </section>

                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                      <Calendar
                        size={16}
                        aria-hidden="true"
                        className="text-slate-400 mb-3"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Timeline Focus
                        </p>
                        <div className="space-y-2 mt-2">
                          <div>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                              Purchase Date
                            </p>
                            <p className="text-xs font-mono tabular-nums font-black text-slate-700 dark:text-slate-300 truncate mt-0.5">
                              {formatDate(po.created_at)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
                              Delivery Target
                            </p>
                            <p className="text-xs font-mono tabular-nums font-black text-slate-700 dark:text-slate-300 truncate mt-0.5">
                              {formatDate(po.expected_delivery_date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Line Items Breakdown */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Itemized Parts Breakdown
                      </h3>
                    </div>
                    <div className="p-5 sm:p-6 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {(po.items || []).map((item) => {
                        const unitCost =
                          parseFloat(item.recorded_unit_cost) || 0;
                        const qty = parseInt(item.quantity, 10) || 0;
                        const discount = parseFloat(item.discount_amount) || 0;
                        const net = unitCost * qty - discount;

                        return (
                          <div
                            key={item.id}
                            className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl sm:rounded-[20px] flex items-center justify-between group transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                              <div
                                aria-hidden="true"
                                className="p-1.5 rounded-md shrink-0 bg-white border border-slate-200 dark:border-slate-600 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                              >
                                <Package size={14} />
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
                                    <span className="text-amber-600 dark:text-overdrive-yellow ml-1.5 font-bold">
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

                  {/* Totals Lock */}
                  <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-overdrive-yellow mb-4 border-b border-white/10 pb-3">
                      Locked Financials
                    </p>
                    <div className="space-y-2 mb-5 text-sm font-medium text-slate-400">
                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>Subtotal (Gross)</span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(po.subtotal)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span className="flex items-center gap-1.5">
                          VAT Allocation
                        </span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(po.vat_amount)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 sm:pt-5 border-t border-slate-700/50">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-overdrive-yellow tracking-tight font-mono tabular-nums">
                        ₱{formatCurrency(po.grand_total)}
                      </span>
                    </div>
                  </section>

                  {/* Operational Notes / Manager Resolution */}
                  <section
                    className={`p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col shadow-xs ${
                      po.status === "APPROVED"
                        ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20"
                        : "bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20"
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                      Manager Resolution
                    </p>
                    <div>
                      <p
                        className={`text-xs font-black uppercase tracking-widest mb-1.5 ${
                          po.status === "APPROVED"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-700 dark:text-rose-400"
                        }`}
                      >
                        {(po.status || "").replace(/_/g, " ")} BY{" "}
                        {po.resolved_by_name || po.created_by_name}
                      </p>
                      <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest">
                        On{" "}
                        {formatDateTime(
                          po.resolved_at || po.updated_at || po.processed_at,
                        )}
                      </p>
                      <div className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs leading-relaxed">
                        "
                        {po.approval_remarks ||
                          "No additional remarks provided."}
                        "
                      </div>
                    </div>
                  </section>

                  {po.notes && (
                    <section className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                        Staff Justification
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                        "{po.notes}"
                      </p>
                    </section>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PurchaseOrderApprovalDrawer;
