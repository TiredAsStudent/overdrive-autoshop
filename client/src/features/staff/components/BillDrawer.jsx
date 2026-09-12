import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { billService } from "../../../services/staff/bill.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const BillDrawer = ({ isOpen, onClose, billId }) => {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && billId) {
      setLoading(true);
      billService
        .getBillDetails(billId)
        .then((res) => setBill(res.data))
        .catch((err) => console.error("Failed to load bill:", err))
        .finally(() => setLoading(false));
    } else {
      setBill(null);
    }
  }, [isOpen, billId]);

  if (!isOpen) return null;

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

  const getAttachmentUrl = (path) => {
    if (!path) return null;
    const baseUrl =
      import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
      "http://localhost:5000";
    return `${baseUrl}/${path}`;
  };

  const isPdf = (path) => {
    return path?.toLowerCase().endsWith(".pdf");
  };

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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

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
            className="relative w-full sm:w-[500px] lg:w-[600px] bg-slate-50 dark:bg-slate-900/95 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
          >
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <Receipt size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {loading ? "Loading..." : bill?.bill_number}
                  </h2>
                  {bill && (
                    <div className="flex flex-col items-start gap-1.5 mt-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge
                          label={bill.status.replace("_", " ")}
                          variant={getReceiveVariant(bill.status)}
                          icon={getReceiveIcon(bill.status)}
                        />
                        <StatusBadge
                          label={
                            bill.payment_status?.replace("_", " ") || "UNPAID"
                          }
                          variant={getPaymentVariant(bill.payment_status)}
                          icon={getPaymentIcon(bill.payment_status)}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <BadgeCheck size={12} className="text-amber-500" />
                        Prepared by:{" "}
                        <span className="text-slate-600 dark:text-slate-300">
                          {bill.created_by_name || "System"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-70">
                  <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Retrieving Document...
                  </p>
                </div>
              ) : bill ? (
                <>
                  <div className="grid grid-cols-2 gap-4 sm:gap-5">
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                      <Store size={16} className="text-slate-400 mb-3" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Vendor Entity
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase">
                          {bill.vendor_name}
                        </p>
                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            {bill.is_vat_registered ? (
                              <>
                                <ShieldCheck
                                  size={12}
                                  className="text-emerald-500"
                                />{" "}
                                VAT Registered
                              </>
                            ) : (
                              "Non-VAT Entity"
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate font-medium pt-2 mt-1 border-t border-slate-100 dark:border-slate-700/50">
                            <Building2 size={10} /> {bill.branch_name}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="p-5 sm:p-6 bg-blue-50 dark:bg-blue-500/5 rounded-[20px] sm:rounded-[24px] border border-blue-100 dark:border-blue-500/20 shadow-sm flex flex-col justify-between">
                      <Link size={16} className="text-blue-400 mb-3" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">
                          Vendor Invoice
                        </p>
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-400 truncate uppercase">
                          {bill.vendor_invoice_number}
                        </p>
                        <p className="text-[10px] text-blue-600/70 dark:text-blue-500/70 mt-2 pt-2 border-t border-blue-200/50 dark:border-blue-500/20 truncate font-medium flex flex-col gap-0.5">
                          <span className="uppercase tracking-widest font-black text-[8px]">
                            Source PO
                          </span>
                          {bill.purchase_order_number}
                        </p>
                      </div>
                    </section>
                  </div>

                  <section className="flex items-center gap-4 p-5 sm:p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm">
                    <Calendar size={20} className="text-amber-500 shrink-0" />
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between min-w-0 gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Billing Date
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {new Date(bill.bill_date).toLocaleDateString()}
                        </p>
                      </div>
                      {bill.date_received && (
                        <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-700/50 pt-3 sm:pt-0 sm:pl-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                            Date Received
                          </p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center sm:justify-end gap-1.5">
                            <CheckCircle size={14} />
                            {new Date(bill.date_received).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <PackageCheck size={14} /> Received Items
                      </h3>
                    </div>
                    <div className="p-5 sm:p-6 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {bill.items.map((item) => {
                        const gross =
                          parseFloat(item.recorded_unit_cost) *
                          item.quantity_received;
                        const net = gross - parseFloat(item.discount_amount);

                        return (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-[16px] sm:rounded-[20px] transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800"
                          >
                            <div className="flex flex-col min-w-0 flex-1 pr-4">
                              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                                {item.item_name}
                              </p>
                              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-widest mt-0.5 truncate">
                                {item.quantity_received}x {item.uom} @ ₱
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
                            <div className="text-right shrink-0">
                              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                                ₱
                                {net.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                              <p className="text-[9px] font-mono text-slate-500 mt-0.5 tracking-widest uppercase">
                                SKU: {item.sku}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl opacity-95">
                    <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 border-b border-white/10 pb-3 flex items-center gap-1.5">
                      <Calculator size={14} /> Financial Posting
                    </h3>
                    <div className="space-y-3 mb-5 text-sm font-medium text-slate-400">
                      <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>Subtotal</span>
                        <span className="font-bold text-slate-200 font-mono">
                          ₱
                          {parseFloat(bill.subtotal).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {parseFloat(bill.discount_amount || 0) > 0 && (
                        <div className="flex justify-between text-xs font-medium text-red-600 dark:text-red-400 bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                          <span>Discount Applied</span>
                          <span className="font-mono">
                            - ₱
                            {parseFloat(bill.discount_amount).toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2 },
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                        <span>
                          VAT Allocation{" "}
                          {!bill.is_vat_registered ? "(Exempt)" : ""}
                        </span>
                        <span className="font-bold text-slate-200 font-mono">
                          ₱
                          {parseFloat(bill.vat_amount).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="pt-4 sm:pt-5 border-t border-slate-700/50 flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                        Grand Total
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight font-mono">
                        ₱
                        {parseFloat(bill.grand_total).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </section>

                  {/* DOCUMENTARY PROOF VIEWER */}
                  {bill.attachment_url && (
                    <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          <Paperclip size={14} /> Documentary Proof
                        </p>
                        {isPdf(bill.attachment_url) && (
                          <a
                            href={getAttachmentUrl(bill.attachment_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg"
                          >
                            <Download size={12} /> Download PDF
                          </a>
                        )}
                      </div>

                      {isPdf(bill.attachment_url) ? (
                        <div className="w-full h-40 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <FileText size={48} className="text-red-500 mb-3" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            PDF Document Attached
                          </span>
                          <span className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest">
                            Click download to view full document
                          </span>
                        </div>
                      ) : (
                        <a
                          href={getAttachmentUrl(bill.attachment_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block relative group overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 cursor-zoom-in"
                        >
                          <img
                            src={getAttachmentUrl(bill.attachment_url)}
                            alt="Documentary Proof"
                            className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-opacity backdrop-blur-sm flex items-center gap-1.5">
                              <ImageIcon size={12} /> Click to Enlarge
                            </span>
                          </div>
                        </a>
                      )}
                    </section>
                  )}

                  {bill.notes && (
                    <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-1.5">
                        <FileText size={14} /> Invoice Notes
                      </p>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                        "{bill.notes}"
                      </p>
                    </section>
                  )}
                </>
              ) : null}
            </div>

            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                disabled={!bill || loading}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer size={16} /> Print Document
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BillDrawer;
