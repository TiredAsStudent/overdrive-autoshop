import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { vendorPaymentService } from "../../../services/manager/vendorPayment.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const VendorPaymentDrawer = ({ isOpen, onClose, paymentId }) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen && paymentId) {
      setLoading(true);
      setError("");
      setImageError(false);
      vendorPaymentService
        .getPaymentDetails(paymentId)
        .then((res) => setPayment(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setPayment(null);
    }
  }, [isOpen, paymentId]);

  const formatCalendarDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split("T")[0].split("-");
    return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
  };

  const renderMethodBadge = (method) => {
    switch (method) {
      case "CASH":
        return <StatusBadge label="CASH" variant="default" icon={Banknote} />;
      case "CHECK":
      case "BANK_TRANSFER":
        return (
          <StatusBadge
            label={method.replace("_", " ")}
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

  const getEvidenceUrl = (path) => {
    if (!path) return null;
    const baseUrl =
      import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
      "http://localhost:5000";
    return `${baseUrl}/${path}`;
  };

  const isPdf = (path) => path?.toLowerCase().endsWith(".pdf");

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
          >
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <CreditCard size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate">
                    {payment?.payment_number || "Loading..."}
                  </h2>
                  {payment && (
                    <div className="flex flex-col items-start gap-1.5 mt-1.5">
                      <StatusBadge
                        label="DISBURSEMENT VOUCHER"
                        variant="success"
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <BadgeCheck size={12} className="text-amber-500" />
                        Disbursed by:{" "}
                        <span className="text-slate-600 dark:text-slate-300">
                          {payment.created_by_name || "System"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 opacity-70">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Retrieving Record...
                  </p>
                </div>
              )}
              {error && (
                <div className="p-4 text-center bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200">
                  {error}
                </div>
              )}

              {payment && !loading && (
                <div className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-2 gap-4 sm:gap-5">
                    <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                      <Store size={16} className="text-slate-400 mb-3" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Vendor Recipient
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase">
                          {payment.vendor_name}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate font-medium">
                          <Building2 size={10} /> {payment.branch_name}
                        </p>
                      </div>
                    </section>

                    <section className="p-5 sm:p-6 bg-blue-50 dark:bg-blue-500/5 rounded-[20px] sm:rounded-[24px] border border-blue-100 dark:border-blue-500/20 shadow-sm flex flex-col justify-between">
                      <Link size={16} className="text-blue-400 mb-3" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">
                          Target Supplier Bill
                        </p>
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-400 truncate uppercase">
                          {payment.bill_number}
                        </p>
                        <p className="text-[10px] text-blue-600/70 dark:text-blue-500/70 mt-0.5 truncate font-medium">
                          INV: {payment.vendor_invoice_number}
                        </p>
                      </div>
                    </section>
                  </div>

                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                    <div className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between gap-5 sm:items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Disbursement Method
                        </p>
                        {renderMethodBadge(payment.payment_method)}
                      </div>
                      <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                      <div className="sm:text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 flex items-center sm:justify-end gap-1.5">
                          <Calendar size={12} className="text-slate-400" />{" "}
                          Payment Date
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatCalendarDate(
                            payment.payment_date || payment.created_at,
                          )}
                        </p>
                      </div>
                    </div>
                    {payment.reference_number && (
                      <div className="px-5 py-4 sm:px-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                          Transaction Reference Number
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white font-mono tracking-wider">
                          {payment.reference_number}
                        </p>
                      </div>
                    )}
                  </section>

                  {payment.proof_of_payment_url && (
                    <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          <ImageIcon size={14} /> Documentary Proof
                        </p>
                        {isPdf(payment.proof_of_payment_url) && (
                          <a
                            href={getEvidenceUrl(payment.proof_of_payment_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg"
                          >
                            <Download size={12} /> Download PDF
                          </a>
                        )}
                      </div>

                      {isPdf(payment.proof_of_payment_url) ? (
                        <div className="w-full h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <FileText size={40} className="text-red-500 mb-2" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            PDF Document Attached
                          </span>
                        </div>
                      ) : imageError ? (
                        <div className="w-full h-48 sm:h-56 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                          <ImageOff
                            size={32}
                            className="text-slate-400 mb-3 opacity-50"
                          />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Image File Unavailable
                          </span>
                        </div>
                      ) : (
                        <a
                          href={getEvidenceUrl(payment.proof_of_payment_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block relative group overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 cursor-zoom-in"
                        >
                          <img
                            src={getEvidenceUrl(payment.proof_of_payment_url)}
                            alt="Proof of Payment"
                            onError={() => setImageError(true)}
                            className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </a>
                      )}
                    </section>
                  )}

                  <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl opacity-95">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 border-b border-white/10 pb-3">
                      Accounts Payable Liquidation
                    </p>
                    <div className="flex justify-between items-center text-sm font-medium text-slate-400 mb-4">
                      <span>Associated Bill Total</span>
                      <span className="font-mono">
                        ₱
                        {parseFloat(payment.bill_total).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-400">
                        Amount Disbursed
                      </span>
                      <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-500">
                        ₱
                        {parseFloat(payment.amount_paid).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </section>

                  {payment.notes && (
                    <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">
                        Disbursement Notes
                      </p>
                      <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                        "{payment.notes}"
                      </p>
                    </section>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-3 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
              <button
                disabled={!payment || loading}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Printer size={16} /> Print Voucher
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VendorPaymentDrawer;
