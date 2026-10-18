import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X,
  Receipt,
  Calendar,
  Building2,
  User,
  Printer,
  Loader2,
  Link,
  CreditCard,
  History,
  BadgeCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  Ban,
  FileText,
} from "lucide-react";
import { invoiceService } from "../../../services/staff/invoice.service";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useApp } from "../../../context/AppContext";
import { openPdfInNewTab } from "../../../utils/pdfViewer";

const InvoiceDrawer = ({ isOpen, onClose, invoiceId, readOnly = false }) => {
  const { showToast } = useApp();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const navigate = useNavigate();

  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && invoiceId) {
      setLoading(true);
      setError("");
      invoiceService
        .getInvoiceDetails(invoiceId)
        .then((res) => {
          if (isMounted) setInvoice(res.data);
        })
        .catch((err) => {
          if (isMounted)
            setError(err.message || "Unable to retrieve invoice ledger.");
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setInvoice(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, invoiceId]);

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
    switch (status) {
      case "PAID":
        return "success";
      case "PARTIALLY_PAID":
        return "warning";
      case "OVERDUE":
        return "danger";
      case "VOID":
      case "UNPAID":
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PAID":
        return CheckCircle;
      case "PARTIALLY_PAID":
        return Clock;
      case "OVERDUE":
        return AlertCircle;
      case "VOID":
        return Ban;
      case "UNPAID":
      default:
        return FileText;
    }
  };

  const formatCalendarDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split("T")[0].split("-");
    if (!year || !month || !day) return dateString;
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
    ).toLocaleDateString("en-US", {
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
      await openPdfInNewTab(() => invoiceService.downloadPdf(invoiceId));
    } catch (err) {
      showToast(err.message || "Failed to generate invoice PDF.", "error");
    } finally {
      setIsPrinting(false);
    }
  };

  const balanceDue = invoice
    ? Math.max(
        0,
        (parseFloat(invoice.grand_total) || 0) -
          (parseFloat(invoice.amount_paid) || 0),
      )
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Standardized Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !isPrinting && onClose?.()}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* Standardized Drawer Panel */}
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
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs">
              <div className="flex items-start gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <Receipt size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]"
                  >
                    {invoice?.invoice_number || "Loading..."}
                  </h2>

                  {invoice && (
                    <div className="flex flex-col items-start gap-1.5 mt-1.5">
                      <StatusBadge
                        label={
                          invoice.status
                            ? invoice.status.replace(/_/g, " ")
                            : "UNPAID"
                        }
                        variant={getStatusVariant(invoice.status)}
                        icon={getStatusIcon(invoice.status)}
                        className={
                          invoice.status === "VOID"
                            ? "line-through opacity-70"
                            : ""
                        }
                      />

                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <BadgeCheck
                          size={12}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                        />
                        <span>Created by:</span>
                        <span className="text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                          {invoice.created_by_name || "System"}
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
                aria-label="Close invoice details drawer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

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
                    Retrieving Ledger...
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

              {invoice && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-5">
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between min-w-0">
                      <User
                        size={16}
                        aria-hidden="true"
                        className="text-amber-600 dark:text-overdrive-yellow mb-3"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Billed To
                        </p>
                        <p
                          className="text-sm font-bold text-slate-900 dark:text-white truncate"
                          title={invoice.customer_name}
                        >
                          {invoice.customer_name}
                        </p>
                        <p
                          className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate font-bold uppercase tracking-wider"
                          title={invoice.branch_name}
                        >
                          <Building2
                            size={11}
                            aria-hidden="true"
                            className="shrink-0"
                          />
                          <span className="truncate">
                            {invoice.branch_name}
                          </span>
                        </p>
                      </div>
                    </section>

                    <section className="p-5 sm:p-6 bg-blue-50 dark:bg-blue-500/5 rounded-[20px] sm:rounded-[24px] border border-blue-200 dark:border-blue-500/20 shadow-xs flex flex-col justify-between min-w-0">
                      <Link
                        size={16}
                        aria-hidden="true"
                        className="text-blue-600 dark:text-blue-400 mb-3"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
                          Source Operation
                        </p>
                        <p
                          className="text-sm font-mono tabular-nums font-bold text-blue-800 dark:text-blue-300 truncate"
                          title={invoice.sales_order_number}
                        >
                          {invoice.sales_order_number}
                        </p>
                        <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5 truncate font-medium">
                          Work Order Completed
                        </p>
                      </div>
                    </section>
                  </div>

                  <section className="flex items-center gap-4 p-5 sm:p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs">
                    <Calendar
                      size={20}
                      aria-hidden="true"
                      className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                    />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                        Payment Due Date
                      </p>
                      <p className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {formatCalendarDate(invoice.due_date)}
                      </p>
                    </div>
                  </section>

                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                        Finalized Billing Statement
                      </h3>
                    </div>
                    <div className="p-5 sm:p-6 space-y-3">
                      {invoice.items?.map((item) => {
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
                            className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl sm:rounded-[20px] flex items-center justify-between gap-3 group transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/80"
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
                                  <span className="text-amber-600 dark:text-overdrive-yellow ml-1.5 font-bold">
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

                  <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800 dark:border-white/10">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-overdrive-yellow mb-4 border-b border-white/10 pb-3">
                      Receivable Lock
                    </h3>
                    <div className="space-y-2 mb-5 text-xs sm:text-sm font-medium text-slate-400">
                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>Subtotal (Gross)</span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(invoice.subtotal)}
                        </span>
                      </div>

                      {parseFloat(invoice.total_discount) > 0 && (
                        <div className="flex justify-between items-center bg-amber-500/10 p-3 sm:p-4 rounded-xl text-amber-400 border border-amber-500/20">
                          <span className="font-bold">Total Discounts</span>
                          <span className="font-black font-mono tabular-nums">
                            - ₱{formatCurrency(invoice.total_discount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>VAT Amount</span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(invoice.vat_amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3 border-y border-slate-800 mb-4 gap-3">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums tracking-tight">
                        ₱{formatCurrency(invoice.grand_total)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-emerald-400 mb-3 bg-emerald-500/10 border border-emerald-500/20 p-3 sm:p-4 rounded-xl">
                      <span>Total Amount Paid</span>
                      <span className="font-black font-mono tabular-nums">
                        - ₱{formatCurrency(invoice.amount_paid)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-4 sm:pt-5 border-t border-slate-800 gap-3">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-rose-400">
                        Balance Due
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-rose-500 font-mono tabular-nums tracking-tight">
                        ₱{formatCurrency(balanceDue)}
                      </span>
                    </div>
                  </section>

                  {invoice.payments && invoice.payments.length > 0 && (
                    <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2">
                        <History
                          size={16}
                          aria-hidden="true"
                          className="text-emerald-500"
                        />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                          Payment Ledger
                        </h3>
                      </div>
                      <div className="p-5 sm:p-6 space-y-3">
                        {invoice.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className={`p-4 sm:p-5 rounded-2xl sm:rounded-[20px] border flex items-center justify-between gap-3 ${
                              payment.status === "VOID"
                                ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-65"
                                : "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200/80 dark:border-emerald-500/20"
                            }`}
                          >
                            <div className="min-w-0">
                              <p
                                className={`text-xs font-mono tabular-nums font-black uppercase tracking-widest truncate ${
                                  payment.status === "VOID"
                                    ? "text-slate-500 line-through"
                                    : "text-emerald-700 dark:text-emerald-400"
                                }`}
                              >
                                {payment.payment_number}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                  {formatCalendarDate(payment.payment_date)}
                                </span>
                                <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  {payment.payment_method
                                    ? payment.payment_method.replace(/_/g, " ")
                                    : "PAYMENT"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span
                                className={`text-xs sm:text-sm font-black font-mono tabular-nums ${
                                  payment.status === "VOID"
                                    ? "text-slate-500 line-through"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                ₱{formatCurrency(payment.amount_received)}
                              </span>
                              {payment.status === "VOID" && (
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5">
                                  VOIDED
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {invoice.notes && (
                    <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px]">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-overdrive-yellow mb-2">
                        Invoice Notes
                      </h3>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                        "{invoice.notes}"
                      </p>
                    </section>
                  )}
                </div>
              )}
            </div>

            {!readOnly && invoice && !loading && (
              <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col sm:flex-row gap-3 z-10 shadow-xs">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!invoice || loading || isPrinting}
                  className="flex-1 py-3.5 sm:py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
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
                <button
                  type="button"
                  onClick={() =>
                    navigate("/staff/sales/payments", {
                      state: { invoiceId: invoice.id },
                    })
                  }
                  disabled={
                    invoice.status === "PAID" || invoice.status === "VOID"
                  }
                  className="flex-1 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  <CreditCard size={16} aria-hidden="true" />
                  <span>Record Payment</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvoiceDrawer;
