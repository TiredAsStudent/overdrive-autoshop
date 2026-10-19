import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  Building2,
  Store,
  Printer,
  Loader2,
  Link,
  Wallet,
  Banknote,
  Landmark,
  Calendar,
  BadgeCheck,
  Image as ImageIcon,
  ImageOff,
  FileText,
  Download,
  AlertCircle,
} from "lucide-react";
import { vendorPaymentService } from "../../../services/manager/vendorPayment.service";
import StatusBadge from "../../../components/ui/StatusBadge";
import { openPdfInNewTab } from "../../../utils/pdfViewer";
import { useApp } from "../../../context/AppContext";
import api from "../../../services/api";

const getEvidenceUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  let baseUrl = api.defaults.baseURL
    ? api.defaults.baseURL.replace("/api/v1", "")
    : import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
      "http://localhost:5000";

  if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);

  const normalizedPath = path.replace(/\\/g, "/");
  const uploadsIndex = normalizedPath.toLowerCase().indexOf("uploads/");
  const cleanPath =
    uploadsIndex !== -1
      ? normalizedPath.slice(uploadsIndex)
      : normalizedPath.startsWith("/")
        ? normalizedPath.slice(1)
        : normalizedPath;

  return `${baseUrl}/${cleanPath}`;
};

const isPdf = (path) => path?.toLowerCase().endsWith(".pdf");

const VendorPaymentDrawer = ({
  isOpen,
  onClose,
  paymentId,
  readOnly = false,
}) => {
  const { showToast } = useApp();
  const drawerTitleId = useId();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && paymentId) {
      setLoading(true);
      setError("");
      setImageError(false);
      vendorPaymentService
        .getPaymentDetails(paymentId)
        .then((res) => {
          if (isMounted) setPayment(res.data);
        })
        .catch((err) => {
          if (isMounted) {
            setError(
              err.message || "Unable to retrieve payment voucher details.",
            );
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setPayment(null);
      setIsPrinting(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, paymentId]);

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

  const handlePrintVoucher = async () => {
    if (!payment?.id || isPrinting) return;
    try {
      setIsPrinting(true);
      await openPdfInNewTab(() =>
        vendorPaymentService.getPaymentPdf(payment.id),
      );
    } catch (err) {
      showToast(
        err.message || "Failed to generate Payment Voucher PDF.",
        "error",
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const formatCalendarDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = String(dateString).split("T")[0].split("-");
    if (!year || !month || !day) return String(dateString);
    return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const renderMethodBadge = (method) => {
    switch (method) {
      case "CASH":
        return <StatusBadge label="CASH" variant="default" icon={Banknote} />;
      case "CHECK":
      case "BANK_TRANSFER":
        return (
          <StatusBadge
            label={method.replace(/_/g, " ")}
            variant="info"
            icon={Landmark}
          />
        );
      case "GCASH":
        return <StatusBadge label="GCASH" variant="info" icon={Wallet} />;
      case "MAYA":
        return <StatusBadge label="MAYA" variant="success" icon={Wallet} />;
      default:
        return null;
    }
  };

  const billTotal = payment ? parseFloat(payment.bill_total) || 0 : 0;
  const currentPayment = payment ? parseFloat(payment.amount_paid) || 0 : 0;
  const totalPaidOnBill = payment
    ? parseFloat(payment.bill_amount_paid) || 0
    : 0;
  const previouslyPaid = payment
    ? payment.prior_amount_paid !== undefined
      ? parseFloat(payment.prior_amount_paid) || 0
      : payment.status === "VOID"
        ? totalPaidOnBill
        : totalPaidOnBill - currentPayment
    : 0;
  const remainingBalance = billTotal - totalPaidOnBill;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
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
          >
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <CreditCard size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]"
                  >
                    {payment?.payment_number || "Loading..."}
                  </h2>
                  {payment && (
                    <div className="flex flex-col items-start gap-1.5 mt-1.5">
                      <StatusBadge
                        label={
                          payment.status === "VOID"
                            ? "VOIDED"
                            : "VENDOR PAYMENT"
                        }
                        variant={
                          payment.status === "VOID" ? "danger" : "success"
                        }
                      />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <BadgeCheck
                          size={12}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                        />
                        <span>Paid by:</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {payment.created_by_name
                            ? `${payment.created_by_name} ${payment.created_by_last_name || ""}`.trim()
                            : "System"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close payment details drawer"
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
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
                    Retrieving Record...
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

              {payment && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-5">
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                      <Store
                        size={16}
                        aria-hidden="true"
                        className="text-slate-400 mb-3"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Vendor Recipient
                        </p>
                        <p
                          className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase"
                          title={payment.vendor_name}
                        >
                          {payment.vendor_name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate font-medium">
                          <Building2
                            size={10}
                            aria-hidden="true"
                            className="shrink-0"
                          />
                          <span className="truncate">
                            {payment.branch_name}
                          </span>
                        </p>
                      </div>
                    </section>

                    <section className="p-5 sm:p-6 bg-blue-50 dark:bg-blue-500/5 rounded-[20px] sm:rounded-[24px] border border-blue-200/80 dark:border-blue-500/20 shadow-xs flex flex-col justify-between">
                      <Link
                        size={16}
                        aria-hidden="true"
                        className="text-blue-500 mb-3"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
                          Target Supplier Bill
                        </p>
                        <p className="text-sm font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400 truncate uppercase">
                          {payment.bill_number}
                        </p>
                        <p className="text-[10px] font-mono tabular-nums text-blue-600/80 dark:text-blue-400/80 mt-0.5 truncate font-medium">
                          INV: {payment.vendor_invoice_number}
                        </p>
                      </div>
                    </section>
                  </div>

                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                    <div className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between gap-5 sm:items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                          Payment Method
                        </p>
                        {renderMethodBadge(payment.payment_method)}
                      </div>
                      <div
                        aria-hidden="true"
                        className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block"
                      />
                      <div className="sm:text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 flex items-center sm:justify-end gap-1.5">
                          <Calendar
                            size={12}
                            aria-hidden="true"
                            className="text-slate-400"
                          />
                          <span>Payment Date</span>
                        </p>
                        <p className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                          {formatCalendarDate(
                            payment.payment_date || payment.created_at,
                          )}
                        </p>
                      </div>
                    </div>
                    {payment.reference_number && (
                      <div className="px-5 py-4 sm:px-6 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Transaction Reference Number
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white font-mono tabular-nums tracking-wider">
                          {payment.reference_number}
                        </p>
                      </div>
                    )}
                  </section>

                  {payment.proof_of_payment_url && (
                    <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-3 gap-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <ImageIcon size={14} aria-hidden="true" />
                          <span>Documentary Proof</span>
                        </p>
                        {isPdf(payment.proof_of_payment_url) && (
                          <a
                            href={getEvidenceUrl(payment.proof_of_payment_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 px-3 py-1.5 rounded-lg"
                          >
                            <Download size={12} aria-hidden="true" />
                            <span>Download PDF</span>
                          </a>
                        )}
                      </div>

                      {isPdf(payment.proof_of_payment_url) ? (
                        <div className="w-full h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <FileText
                            size={40}
                            aria-hidden="true"
                            className="text-red-500 mb-2"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            PDF Document Attached
                          </span>
                        </div>
                      ) : imageError ? (
                        <div className="w-full h-48 sm:h-56 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                          <ImageOff
                            size={32}
                            aria-hidden="true"
                            className="text-slate-400 mb-3 opacity-50"
                          />
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Image File Unavailable
                          </span>
                        </div>
                      ) : (
                        <a
                          href={getEvidenceUrl(payment.proof_of_payment_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open attached proof of payment image in a new tab"
                          className="block relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-zoom-in"
                        >
                          <img
                            src={getEvidenceUrl(payment.proof_of_payment_url)}
                            alt={`Proof of payment for ${payment.payment_number}`}
                            onError={() => setImageError(true)}
                            className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-opacity backdrop-blur-xs">
                              Click to enlarge
                            </span>
                          </div>
                        </a>
                      )}
                    </section>
                  )}

                  <section
                    className={`bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl ${
                      payment.status === "VOID"
                        ? "border border-rose-500/30"
                        : "border border-slate-800"
                    }`}
                  >
                    <p
                      className={`text-[10px] font-black uppercase tracking-widest ${
                        payment.status === "VOID"
                          ? "text-rose-400"
                          : "text-emerald-400"
                      } mb-4 border-b border-white/10 pb-3`}
                    >
                      {payment.status === "VOID"
                        ? "Voided Transaction"
                        : "Accounts Payable Liquidation"}
                    </p>

                    <div className="flex justify-between items-center text-sm font-medium text-slate-400 mb-3">
                      <span>Associated Bill Total</span>
                      <span className="font-mono tabular-nums">
                        ₱{formatCurrency(billTotal)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-medium text-slate-400 mb-4 pb-4 border-b border-white/10">
                      <span>Previously Paid</span>
                      <span className="font-mono tabular-nums">
                        -₱{formatCurrency(Math.max(0, previouslyPaid))}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-medium text-slate-300 mb-4 pb-4 border-b border-white/10">
                      <span>Current Bill Balance</span>
                      <span className="font-mono tabular-nums text-rose-400">
                        ₱{formatCurrency(Math.max(0, remainingBalance))}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-medium text-slate-300 mb-5">
                      <span>Current Bill Status</span>
                      <StatusBadge
                        label={
                          payment.current_bill_status?.replace(/_/g, " ") ||
                          "UNKNOWN"
                        }
                        variant={
                          payment.current_bill_status === "PAID"
                            ? "success"
                            : "warning"
                        }
                      />
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <span
                        className={`text-xs sm:text-sm font-black uppercase tracking-widest ${
                          payment.status === "VOID"
                            ? "text-rose-400 line-through"
                            : "text-emerald-400"
                        }`}
                      >
                        Amount Paid
                      </span>
                      <span
                        className={`text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight ${
                          payment.status === "VOID"
                            ? "text-rose-500/60 line-through"
                            : "text-emerald-400"
                        }`}
                      >
                        ₱{formatCurrency(currentPayment)}
                      </span>
                    </div>
                  </section>

                  {payment.notes && (
                    <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-overdrive-yellow mb-2">
                        Payment Notes
                      </p>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                        "{payment.notes}"
                      </p>
                    </section>
                  )}
                </div>
              )}
            </div>

            {!readOnly && payment && !loading && (
              <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-3 z-10 shadow-xs">
                <button
                  type="button"
                  onClick={handlePrintVoucher}
                  disabled={isPrinting}
                  aria-busy={isPrinting || undefined}
                  className="w-full py-3.5 sm:py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isPrinting ? (
                    <>
                      <Loader2
                        size={16}
                        aria-hidden="true"
                        className="animate-spin text-amber-500"
                      />
                      <span>Generating Voucher...</span>
                    </>
                  ) : (
                    <>
                      <Printer size={16} aria-hidden="true" />
                      <span>Print Official Receipt</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VendorPaymentDrawer;
