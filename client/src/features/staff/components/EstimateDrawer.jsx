import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Calendar,
  Building2,
  User,
  Printer,
  Loader2,
  BadgeCheck,
  Clock,
  CheckCircle,
  FileCheck,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { estimateService } from "../../../services/staff/estimate.service";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useApp } from "../../../context/AppContext";
import { openPdfInNewTab } from "../../../utils/pdfViewer";

const EstimateDrawer = ({ isOpen, onClose, estimateId }) => {
  const { showToast } = useApp();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && estimateId) {
      setLoading(true);
      setError("");
      estimateService
        .getEstimateDetails(estimateId)
        .then((res) => {
          if (isMounted) setEstimate(res.data);
        })
        .catch((err) => {
          if (isMounted)
            setError(err.message || "Unable to retrieve estimate details.");
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setEstimate(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, estimateId]);

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
    if (status === "APPROVED" || status === "CONVERTED") return "success";
    if (status === "REJECTED" || status === "EXPIRED") return "danger";
    return "default";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return Clock;
      case "APPROVED":
        return CheckCircle;
      case "CONVERTED":
        return FileCheck;
      case "REJECTED":
        return XCircle;
      case "EXPIRED":
        return AlertCircle;
      default:
        return FileText; // DRAFT
    }
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await openPdfInNewTab(() => estimateService.downloadPdf(estimateId));
    } catch (err) {
      showToast(err.message || "Failed to generate estimate PDF.", "error");
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
                  <FileText size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]"
                  >
                    {estimate?.estimate_number || "Loading..."}
                  </h2>

                  {estimate && (
                    <div className="flex flex-col items-start gap-1.5 mt-1.5">
                      <StatusBadge
                        label={
                          estimate.status
                            ? estimate.status.replace(/_/g, " ")
                            : "DRAFT"
                        }
                        variant={getStatusVariant(estimate.status)}
                        icon={getStatusIcon(estimate.status)}
                      />

                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <BadgeCheck
                          size={12}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                        />
                        <span>Prepared by:</span>
                        <span className="text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                          {estimate.created_by_name || "System"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isPrinting}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                aria-label="Close estimate details drawer"
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

              {error && (
                <div role="alert" className="form-error-banner">
                  <AlertCircle
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <span>{error}</span>
                </div>
              )}

              {estimate && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Meta Cards */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-5">
                    <div className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between min-w-0">
                      <User
                        size={16}
                        aria-hidden="true"
                        className="text-amber-600 dark:text-overdrive-yellow mb-3"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Customer
                        </p>
                        <p
                          className="text-sm font-bold text-slate-900 dark:text-white truncate"
                          title={estimate.customer_name}
                        >
                          {estimate.customer_name}
                        </p>
                        <p
                          className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium"
                          title={estimate.contact_number}
                        >
                          {estimate.contact_number}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between min-w-0">
                      <Calendar
                        size={16}
                        aria-hidden="true"
                        className="text-amber-600 dark:text-overdrive-yellow mb-3"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Valid Until
                        </p>
                        <p className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white truncate">
                          {formatDate(estimate.valid_until)}
                        </p>
                        <p
                          className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate font-bold uppercase tracking-wider"
                          title={estimate.branch_name}
                        >
                          <Building2
                            size={11}
                            aria-hidden="true"
                            className="shrink-0"
                          />
                          <span className="truncate">
                            {estimate.branch_name}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Breakdown */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                        Itemized Breakdown
                      </h3>
                    </div>
                    <div className="p-5 sm:p-6 space-y-3">
                      {estimate.items?.map((item) => {
                        const isService = item.line_type === "SERVICE";
                        const itemTitle = isService
                          ? item.service_name
                          : item.item_name;
                        const gross =
                          (parseFloat(item.recorded_selling_price) || 0) *
                          (Number(item.quantity) || 1);
                        const disc = parseFloat(item.discount_amount) || 0;
                        const net = Math.max(0, gross - disc);

                        return (
                          <div
                            key={item.id}
                            className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl sm:rounded-[20px] flex items-center justify-between gap-3 transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/80"
                          >
                            <div className="flex flex-col min-w-0 flex-1">
                              <p
                                className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate uppercase italic"
                                title={itemTitle}
                              >
                                {itemTitle}
                              </p>
                              <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 tracking-wider mt-0.5">
                                {item.quantity}x @ ₱
                                {formatCurrency(item.recorded_selling_price)}
                                {disc > 0 && (
                                  <span className="text-amber-600 dark:text-overdrive-yellow ml-1.5">
                                    (Disc: -₱{formatCurrency(disc)})
                                  </span>
                                )}
                              </p>
                            </div>
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums shrink-0">
                              ₱{formatCurrency(net)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Totals */}
                  <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800 dark:border-white/10">
                    <div className="space-y-2 mb-5 text-xs sm:text-sm font-medium text-slate-400">
                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>Subtotal (Gross)</span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(estimate.subtotal)}
                        </span>
                      </div>

                      {parseFloat(estimate.total_discount) > 0 && (
                        <div className="flex justify-between items-center bg-amber-500/10 p-3 sm:p-4 rounded-xl text-amber-400 border border-amber-500/20">
                          <span className="font-bold">Total Discounts</span>
                          <span className="font-black font-mono tabular-nums">
                            - ₱{formatCurrency(estimate.total_discount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>VAT Amount</span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(estimate.vat_amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 sm:pt-5 border-t border-slate-700/60 gap-3">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-overdrive-yellow tracking-tight font-mono tabular-nums">
                        ₱{formatCurrency(estimate.grand_total)}
                      </span>
                    </div>
                  </section>

                  {/* Notes */}
                  {estimate.notes && (
                    <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px]">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-overdrive-yellow mb-2">
                        Staff Notes
                      </h3>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                        "{estimate.notes}"
                      </p>
                    </section>
                  )}
                </div>
              )}
            </div>

            {/* Print Footer */}
            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                disabled={!estimate || loading || isPrinting}
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

export default EstimateDrawer;
