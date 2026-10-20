import React, { useState, useEffect, useId } from "react";
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
  AlertCircle,
  BadgeCheck,
  CheckCircle,
  Clock,
  FileCheck,
  XCircle,
  FileText,
} from "lucide-react";
import { purchaseOrderService } from "../../../services/staff/purchaseOrder.service";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useApp } from "../../../context/AppContext";
import { openPdfInNewTab } from "../../../utils/pdfViewer";

const PurchaseOrderDrawer = ({ isOpen, onClose, poId }) => {
  const { showToast } = useApp();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && poId) {
      setLoading(true);
      setError("");
      purchaseOrderService
        .getPurchaseOrderDetails(poId)
        .then((res) => {
          if (isMounted) setPo(res.data);
        })
        .catch((err) => {
          if (isMounted)
            setError(
              err.message || "Unable to retrieve purchase order document.",
            );
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

  // Close drawer on Escape key when not printing
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isPrinting) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPrinting, onClose]);

  const getStatusVariant = (status) => {
    if (status === "PENDING_APPROVAL") return "warning";
    if (status === "APPROVED") return "success";
    if (status === "CLOSED") return "info";
    if (status === "REJECTED" || status === "CANCELLED") return "danger";
    return "default";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return Clock;
      case "APPROVED":
        return CheckCircle;
      case "CLOSED":
        return FileCheck;
      case "REJECTED":
      case "CANCELLED":
        return XCircle;
      default:
        return FileText; // DRAFT
    }
  };

  const formatCalendarDate = (dateString) => {
    if (!dateString) return "N/A";
    const datePart = String(dateString).split("T")[0];
    const [year, month, day] = datePart.split("-");
    if (year && month && day) {
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await openPdfInNewTab(() => purchaseOrderService.downloadPdf(poId));
    } catch (err) {
      showToast(
        err.message || "Failed to generate purchase order PDF.",
        "error",
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* 1. Standardized Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !isPrinting && onClose?.()}
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
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs">
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
                    {po?.purchase_order_number || "Loading..."}
                  </h2>

                  {po && (
                    <div className="flex flex-col items-start gap-1.5 mt-1.5">
                      <StatusBadge
                        label={
                          po.status ? po.status.replace(/_/g, " ") : "DRAFT"
                        }
                        variant={getStatusVariant(po.status)}
                        icon={getStatusIcon(po.status)}
                      />
                      <div className="flex flex-col gap-0.5 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <BadgeCheck
                            size={12}
                            aria-hidden="true"
                            className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                          />
                          <span>Prepared by:</span>
                          <span className="text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                            {po.created_by_name || "System"}
                          </span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Calendar
                            size={12}
                            aria-hidden="true"
                            className="text-slate-400 shrink-0"
                          />
                          <span>PO Date:</span>
                          <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
                            {formatCalendarDate(po.created_at)}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isPrinting}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                aria-label="Close purchase order drawer"
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
                  {/* Rejection / Approval Remarks */}
                  {po.approval_remarks && (
                    <section
                      className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3 shadow-xs ${
                        po.status === "REJECTED"
                          ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-800 dark:text-rose-300"
                          : "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      }`}
                    >
                      <AlertCircle
                        size={18}
                        aria-hidden="true"
                        className="shrink-0 mt-0.5"
                      />
                      <div className="min-w-0">
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">
                          Managerial Feedback
                        </h3>
                        <p className="text-xs font-bold leading-relaxed break-words">
                          {po.approval_remarks}
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Meta Cards */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-5">
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between min-w-0">
                      <Store
                        size={16}
                        aria-hidden="true"
                        className="text-amber-600 dark:text-overdrive-yellow mb-3"
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
                        <p
                          className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1 font-bold uppercase tracking-wider"
                          title={po.branch_name}
                        >
                          <Building2
                            size={11}
                            aria-hidden="true"
                            className="shrink-0"
                          />
                          <span className="truncate">{po.branch_name}</span>
                        </p>
                      </div>
                    </section>

                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between min-w-0">
                      <Calendar
                        size={16}
                        aria-hidden="true"
                        className="text-amber-600 dark:text-overdrive-yellow mb-3"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Delivery Target
                        </p>
                        <p className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white truncate">
                          {po.expected_delivery_date
                            ? formatCalendarDate(po.expected_delivery_date)
                            : "Not Set"}
                        </p>
                        <p
                          className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1 font-medium"
                          title={po.created_by_name}
                        >
                          <User
                            size={11}
                            aria-hidden="true"
                            className="shrink-0"
                          />
                          <span className="truncate">
                            By: {po.created_by_name || "System"}
                          </span>
                        </p>
                      </div>
                    </section>
                  </div>

                  {/* Line Items Table */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                        Itemized Parts Breakdown
                      </h3>
                    </div>
                    <div className="p-5 sm:p-6 space-y-3">
                      {po.items?.map((item) => {
                        const gross =
                          (parseFloat(item.recorded_unit_cost) || 0) *
                          (Number(item.quantity) || 1);
                        const disc = parseFloat(item.discount_amount) || 0;
                        const net = Math.max(0, gross - disc);
                        const fullTitle = `[${item.sku}] ${item.item_name}`;

                        return (
                          <div
                            key={item.id}
                            className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl sm:rounded-[20px] flex items-center justify-between gap-3 transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/80"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                aria-hidden="true"
                                className="p-2 rounded-lg shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-overdrive-yellow"
                              >
                                <Package size={14} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <p
                                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate uppercase italic"
                                  title={fullTitle}
                                >
                                  {fullTitle}
                                </p>
                                <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 tracking-wider mt-0.5">
                                  {item.quantity}x @ ₱
                                  {formatCurrency(item.recorded_unit_cost)}
                                  {disc > 0 && (
                                    <span className="text-amber-600 dark:text-overdrive-yellow ml-1.5 font-bold">
                                      (Disc: -₱{formatCurrency(disc)})
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums shrink-0">
                              ₱{formatCurrency(net)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Totals Lock */}
                  <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800 dark:border-white/10">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-overdrive-yellow mb-4 border-b border-white/10 pb-3">
                      Locked Financials
                    </h3>
                    <div className="space-y-2 mb-5 text-xs sm:text-sm font-medium text-slate-400">
                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl gap-3">
                        <span>Subtotal (Net of VAT)</span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(po.subtotal)}
                        </span>
                      </div>

                      {parseFloat(po.total_discount) > 0 && (
                        <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-3 sm:p-4 rounded-xl text-amber-400 gap-3">
                          <span className="font-bold">Total Discounts</span>
                          <span className="font-black font-mono tabular-nums">
                            - ₱{formatCurrency(po.total_discount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl gap-3">
                        <span>VAT Amount</span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(po.vat_amount)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 sm:pt-5 border-t border-slate-700/60 gap-3">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-overdrive-yellow tracking-tight font-mono tabular-nums">
                        ₱{formatCurrency(po.grand_total)}
                      </span>
                    </div>
                  </section>

                  {/* Notes */}
                  {po.notes && (
                    <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px]">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-overdrive-yellow mb-2">
                        Logistics Notes
                      </h3>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/80 italic leading-relaxed break-words">
                        "{po.notes}"
                      </p>
                    </section>
                  )}
                </div>
              )}
            </div>

            {/* Print Footer */}
            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs">
              <button
                type="button"
                onClick={handlePrint}
                disabled={!po || loading || isPrinting}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPrinting ? (
                  <>
                    <Loader2
                      size={16}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Printer size={16} aria-hidden="true" />
                    <span>Print Document</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PurchaseOrderDrawer;
