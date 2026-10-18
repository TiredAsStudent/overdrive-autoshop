import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Receipt,
  CheckCircle,
  Clock,
  Store,
  ShieldCheck,
  Calculator,
  Printer,
  Building2,
  Loader2,
  BadgeCheck,
  AlertCircle,
  Ban,
  Archive,
  Link,
  Calendar,
  FileText,
  PackageCheck,
  Paperclip,
  Download,
  Image as ImageIcon,
  ImageOff,
} from "lucide-react";
import { billService } from "../../../services/staff/bill.service";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useApp } from "../../../context/AppContext";
import { openPdfInNewTab } from "../../../utils/pdfViewer";

const BillDrawer = ({ isOpen, onClose, billId, readOnly = false }) => {
  const { showToast } = useApp();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && billId) {
      setLoading(true);
      setError("");
      setImageError(false);
      billService
        .getBillDetails(billId)
        .then((res) => {
          if (isMounted) setBill(res.data);
        })
        .catch((err) => {
          console.error("Failed to load bill:", err);
          if (isMounted) {
            setError(err.message || "Unable to retrieve supplier bill ledger.");
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setBill(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, billId]);

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

  const getReceiveVariant = (status) => {
    if (status === "RECEIVED") return "success";
    if (status === "CLOSED") return "info";
    return "warning";
  };

  const getReceiveIcon = (status) => {
    if (status === "RECEIVED") return CheckCircle;
    if (status === "CLOSED") return Archive;
    return Clock;
  };

  const getPaymentVariant = (status) => {
    if (status === "PAID") return "success";
    if (status === "PARTIALLY_PAID") return "info";
    if (status === "VOID") return "danger";
    return "danger";
  };

  const getPaymentIcon = (status) => {
    if (status === "PAID") return CheckCircle;
    if (status === "PARTIALLY_PAID") return Clock;
    if (status === "VOID") return Ban;
    return AlertCircle;
  };

  const getAttachmentUrl = (filePath) => {
    if (!filePath) return null;
    const baseUrl = (
      import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
      "http://localhost:5000"
    ).replace(/\/$/, "");
    const normalized = filePath.replace(/\\/g, "/");
    const uploadsIdx = normalized.indexOf("uploads/");
    const cleanRelative =
      uploadsIdx !== -1
        ? normalized.slice(uploadsIdx)
        : normalized.replace(/^\//, "");
    return `${baseUrl}/${cleanRelative}`;
  };

  const isPdf = (path) => {
    return path?.toLowerCase().endsWith(".pdf");
  };

  const formatCalendarDate = (dateString) => {
    if (!dateString) return "--";
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
      await openPdfInNewTab(() => billService.downloadPdf(billId));
    } catch (err) {
      showToast(
        err.message || "Failed to generate supplier bill PDF.",
        "error",
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const balanceDue = bill
    ? Math.max(
        0,
        (parseFloat(bill.grand_total) || 0) -
          (parseFloat(bill.amount_paid) || 0),
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
                    {loading ? "Loading..." : bill?.bill_number}
                  </h2>
                  {bill && (
                    <div className="flex flex-col items-start gap-1.5 mt-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge
                          label={
                            bill.status
                              ? bill.status.replace(/_/g, " ")
                              : "PENDING RECEIPT"
                          }
                          variant={getReceiveVariant(bill.status)}
                          icon={getReceiveIcon(bill.status)}
                        />
                        <StatusBadge
                          label={
                            bill.payment_status
                              ? bill.payment_status.replace(/_/g, " ")
                              : "UNPAID"
                          }
                          variant={getPaymentVariant(bill.payment_status)}
                          icon={getPaymentIcon(bill.payment_status)}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <BadgeCheck
                          size={12}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                        />
                        <span>Prepared by:</span>
                        <span className="text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                          {bill.created_by_name || "System"}
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
                aria-label="Close supplier bill drawer"
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
                    className="h-8 w-8 text-amber-500 animate-spin mb-3"
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

              {bill && !loading && (
                <>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-5">
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between min-w-0">
                      <Store
                        size={16}
                        aria-hidden="true"
                        className="text-amber-600 dark:text-overdrive-yellow mb-3"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Vendor Entity
                        </p>
                        <p
                          className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase"
                          title={bill.vendor_name}
                        >
                          {bill.vendor_name}
                        </p>
                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                            {bill.is_vat_registered ? (
                              <>
                                <ShieldCheck
                                  size={12}
                                  aria-hidden="true"
                                  className="text-emerald-500 shrink-0"
                                />
                                <span>VAT Registered</span>
                              </>
                            ) : (
                              <span>Non-VAT Entity</span>
                            )}
                          </p>
                          <p
                            className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate font-bold uppercase tracking-wider pt-2 mt-1 border-t border-slate-100 dark:border-slate-700/50"
                            title={bill.branch_name}
                          >
                            <Building2
                              size={11}
                              aria-hidden="true"
                              className="shrink-0"
                            />
                            <span className="truncate">{bill.branch_name}</span>
                          </p>
                        </div>
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
                          Vendor Invoice
                        </p>
                        <p
                          className="text-sm font-mono tabular-nums font-bold text-blue-800 dark:text-blue-300 truncate uppercase"
                          title={bill.vendor_invoice_number}
                        >
                          {bill.vendor_invoice_number}
                        </p>
                        <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-2 pt-2 border-t border-blue-200/50 dark:border-blue-500/20 truncate font-medium flex flex-col gap-0.5">
                          <span className="uppercase tracking-widest font-black text-[9px]">
                            Source PO
                          </span>
                          <span className="font-mono tabular-nums font-bold">
                            {bill.purchase_order_number}
                          </span>
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
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 min-w-0 gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Billing Date
                        </p>
                        <p className="text-xs sm:text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                          {formatCalendarDate(bill.bill_date)}
                        </p>
                      </div>
                      <div className="border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-700/50 pt-3 sm:pt-0 sm:pl-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Due Date
                        </p>
                        <p className="text-xs sm:text-sm font-mono tabular-nums font-bold text-amber-600 dark:text-overdrive-yellow">
                          {formatCalendarDate(bill.due_date)}
                        </p>
                      </div>
                      <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-700/50 pt-3 sm:pt-0 sm:pl-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                          Date Received
                        </p>
                        {bill.date_received ? (
                          <p className="text-xs sm:text-sm font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 flex items-center sm:justify-end gap-1.5">
                            <CheckCircle
                              size={14}
                              aria-hidden="true"
                              className="shrink-0"
                            />
                            <span>
                              {formatCalendarDate(bill.date_received)}
                            </span>
                          </p>
                        ) : (
                          <p className="text-xs sm:text-sm font-mono tabular-nums font-bold text-slate-400">
                            --
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <PackageCheck
                          size={14}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow"
                        />
                        <span>Received Items</span>
                      </h3>
                    </div>
                    <div className="p-5 sm:p-6 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {bill.items?.map((item) => {
                        const gross =
                          (parseFloat(item.recorded_unit_cost) || 0) *
                          (Number(item.quantity_received) || 1);
                        const disc = parseFloat(item.discount_amount) || 0;
                        const net = Math.max(0, gross - disc);

                        return (
                          <div
                            key={item.id}
                            className="flex justify-between items-center gap-3 p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl sm:rounded-[20px] transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/80"
                          >
                            <div className="flex flex-col min-w-0 flex-1">
                              <p
                                className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase italic truncate"
                                title={item.item_name}
                              >
                                {item.item_name}
                              </p>
                              <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 tracking-wider mt-0.5 truncate">
                                {item.quantity_received}x {item.uom} @ ₱
                                {formatCurrency(item.recorded_unit_cost)}
                                {disc > 0 && (
                                  <span className="text-amber-600 dark:text-overdrive-yellow ml-1.5 font-bold">
                                    (Disc: -₱{formatCurrency(disc)})
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums">
                                ₱{formatCurrency(net)}
                              </span>
                              <p className="text-[9px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5 tracking-widest uppercase">
                                SKU: {item.sku}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800 dark:border-white/10">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-overdrive-yellow mb-4 border-b border-white/10 pb-3 flex items-center gap-1.5">
                      <Calculator size={14} aria-hidden="true" />
                      <span>Financial Posting</span>
                    </h3>
                    <div className="space-y-3 mb-5 text-xs sm:text-sm font-medium text-slate-400">
                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl gap-3">
                        <span>Subtotal (Net of VAT)</span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(bill.subtotal)}
                        </span>
                      </div>

                      {parseFloat(bill.discount_amount || 0) > 0 && (
                        <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-3 sm:p-4 rounded-xl text-amber-400 gap-3">
                          <span className="font-bold">Discount Applied</span>
                          <span className="font-black font-mono tabular-nums">
                            - ₱{formatCurrency(bill.discount_amount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl gap-3">
                        <span>
                          Input VAT Allocation{" "}
                          {!bill.is_vat_registered ? "(Exempt)" : ""}
                        </span>
                        <span className="font-bold text-slate-200 font-mono tabular-nums">
                          ₱{formatCurrency(bill.vat_amount)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 sm:pt-5 border-y border-slate-800 pb-4 mb-4 flex justify-between items-center gap-3">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono tabular-nums">
                        ₱{formatCurrency(bill.grand_total)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-emerald-400 mb-4 bg-emerald-500/10 border border-emerald-500/20 p-3 sm:p-4 rounded-xl gap-3">
                      <span>Total Payments Applied</span>
                      <span className="font-black font-mono tabular-nums">
                        - ₱{formatCurrency(bill.amount_paid)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 gap-3">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-rose-400">
                        Balance Due
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-rose-500 font-mono tabular-nums tracking-tight">
                        ₱{formatCurrency(balanceDue)}
                      </span>
                    </div>
                  </section>

                  {bill.attachment_url && (
                    <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-3 gap-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Paperclip
                            size={14}
                            aria-hidden="true"
                            className="text-amber-500 dark:text-overdrive-yellow"
                          />
                          <span>Documentary Proof</span>
                        </h3>
                        {isPdf(bill.attachment_url) && (
                          <a
                            href={getAttachmentUrl(bill.attachment_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 px-3 py-1.5 rounded-lg shrink-0"
                          >
                            <Download size={12} aria-hidden="true" />
                            <span>Download PDF</span>
                          </a>
                        )}
                      </div>

                      {isPdf(bill.attachment_url) ? (
                        <div className="w-full h-40 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                          <FileText
                            size={40}
                            aria-hidden="true"
                            className="text-red-500 mb-2.5"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            PDF Document Attached
                          </span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                            Click download to view full document
                          </span>
                        </div>
                      ) : imageError ? (
                        <div className="w-full h-48 sm:h-56 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-4">
                          <ImageOff
                            size={32}
                            aria-hidden="true"
                            className="text-slate-400 mb-3 opacity-50"
                          />
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Image File Unavailable
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 text-center max-w-[220px] mt-1">
                            The file may have been moved or deleted from the
                            server.
                          </span>
                        </div>
                      ) : (
                        <a
                          href={getAttachmentUrl(bill.attachment_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open attached supplier bill document in a new tab"
                          className="block relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900 cursor-zoom-in"
                        >
                          <img
                            src={getAttachmentUrl(bill.attachment_url)}
                            alt={`Documentary proof for ${bill.bill_number}`}
                            onError={() => setImageError(true)}
                            className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-focus-visible:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-opacity backdrop-blur-xs flex items-center gap-1.5">
                              <ImageIcon size={12} aria-hidden="true" />
                              <span>Click to Enlarge</span>
                            </span>
                          </div>
                        </a>
                      )}
                    </section>
                  )}

                  {bill.notes && (
                    <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px]">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-overdrive-yellow mb-2 flex items-center gap-1.5">
                        <FileText size={14} aria-hidden="true" />
                        <span>Bill Notes</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/80 italic leading-relaxed break-words">
                        "{bill.notes}"
                      </p>
                    </section>
                  )}
                </>
              )}
            </div>

            {!readOnly && bill && !loading && (
              <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-3 z-10 shadow-xs">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!bill || loading || isPrinting}
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
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BillDrawer;
