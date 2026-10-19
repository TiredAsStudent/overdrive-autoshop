import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Store,
  Mail,
  MapPin,
  Building2,
  Calendar,
  Landmark,
  ShieldCheck,
  ShoppingBag,
  Receipt,
  Calculator,
  MinusCircle,
  Loader2,
  FileText,
  Phone,
  User,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { managerVendorService } from "../../../services/manager/vendor.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const VendorDrawer = ({ isOpen, onClose, vendor }) => {
  const [ledger, setLedger] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerError, setLedgerError] = useState("");
  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && vendor?.id) {
      setLoadingLedger(true);
      setLedgerError("");
      managerVendorService
        .getVendorLedger(vendor.id, 1, 50)
        .then((res) => {
          if (isMounted) setLedger(res.data?.history || []);
        })
        .catch((err) => {
          if (isMounted) {
            setLedgerError(
              err.message || "Unable to load vendor transaction ledger.",
            );
          }
        })
        .finally(() => {
          if (isMounted) setLoadingLedger(false);
        });
    } else {
      setLedger([]);
      setLedgerError("");
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, vendor]);

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

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getTxStatusVariant = (status) => {
    const s = (status || "").toUpperCase();
    if (["CLOSED", "RECEIVED", "PAID", "APPROVED", "COMPLETED"].includes(s))
      return "success";
    if (["OVERDUE", "VOID", "CANCELLED", "REJECTED"].includes(s))
      return "danger";
    return "warning";
  };

  return (
    <AnimatePresence>
      {isOpen && vendor && (
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
            className="relative h-full h-dvh w-full sm:w-[480px] lg:w-[560px] bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <header className="flex justify-between items-center px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <Store size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]"
                    title={vendor.business_name}
                  >
                    {vendor.business_name}
                  </h2>
                  <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {vendor.vendor_code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close vendor profile drawer"
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {/* Corporate Profile Card */}
              <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-2 flex items-center gap-2">
                  <Building2 size={14} aria-hidden="true" />
                  <span>Corporate Profile</span>
                </h3>
                <div className="flex items-center gap-3 text-slate-900 dark:text-white font-mono tabular-nums font-bold text-sm">
                  <Phone
                    size={14}
                    aria-hidden="true"
                    className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                  />
                  <span>{vendor.contact_number}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium">
                  <User
                    size={14}
                    aria-hidden="true"
                    className="text-slate-400 shrink-0"
                  />
                  <span>
                    {vendor.contact_person}{" "}
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                      (Primary Contact)
                    </span>
                  </span>
                </div>
                {vendor.email && (
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium">
                    <Mail
                      size={14}
                      aria-hidden="true"
                      className="text-slate-400 shrink-0"
                    />
                    <span className="truncate" title={vendor.email}>
                      {vendor.email}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400 text-xs font-medium leading-relaxed pt-1">
                  <MapPin
                    size={14}
                    aria-hidden="true"
                    className="text-slate-400 mt-0.5 shrink-0"
                  />
                  <span>{vendor.business_address}</span>
                </div>
              </section>

              {/* Administrative Timeline Card */}
              <section className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Building2
                    size={14}
                    aria-hidden="true"
                    className="text-slate-400 shrink-0"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Master Assignment:
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white ml-auto truncate">
                    {vendor.branch_name || "Enterprise Wide (Global)"}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                  <Calendar
                    size={14}
                    aria-hidden="true"
                    className="text-slate-400 shrink-0"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Registered Date:
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white ml-auto font-mono tabular-nums">
                    {formatDate(vendor.created_at)}
                  </span>
                </div>
              </section>

              {/* Fiscal Registration Card */}
              <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-2 flex items-center gap-2">
                  <Landmark size={14} aria-hidden="true" />
                  <span>Fiscal Registration</span>
                </h3>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500 dark:text-slate-400">
                    TIN Registry
                  </span>
                  <span className="font-mono tabular-nums font-bold tracking-wider text-slate-900 dark:text-white">
                    {vendor.tin || "Not Provided"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 dark:border-slate-700/50">
                  <span className="font-bold text-slate-500 dark:text-slate-400">
                    Tax Classification
                  </span>
                  {vendor.is_vat_registered ? (
                    <StatusBadge
                      label="VAT Registered"
                      variant="success"
                      icon={ShieldCheck}
                    />
                  ) : (
                    <StatusBadge
                      label="Non-VAT"
                      variant="default"
                      icon={MinusCircle}
                    />
                  )}
                </div>
              </section>

              {/* Procurement Summary Metrics */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <Calculator
                    size={14}
                    aria-hidden="true"
                    className="text-amber-500 dark:text-overdrive-yellow"
                  />
                  <span>Procurement Summary</span>
                </h3>

                {/* Metric Count Boxes */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] sm:rounded-[20px] p-4 text-center shadow-xs">
                    <span className="block text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums mb-1">
                      {vendor.total_pos ?? 0}
                    </span>
                    <span className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                      <ShoppingBag size={11} aria-hidden="true" />
                      <span>POs</span>
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] sm:rounded-[20px] p-4 text-center shadow-xs">
                    <span className="block text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums mb-1">
                      {vendor.total_bills ?? 0}
                    </span>
                    <span className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                      <Receipt size={11} aria-hidden="true" />
                      <span>Bills</span>
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] sm:rounded-[20px] p-4 text-center shadow-xs">
                    <span className="block text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums mb-1">
                      {vendor.total_payments ?? 0}
                    </span>
                    <span className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                      <CreditCard size={11} aria-hidden="true" />
                      <span>Pymnts</span>
                    </span>
                  </div>
                </div>

                {/* Financial Overview Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Outstanding Payables */}
                  <div className="bg-red-50 dark:bg-red-500/5 border border-red-200/80 dark:border-red-500/20 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs flex flex-col justify-between items-start gap-3 sm:gap-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">
                        Outstanding Payables
                      </p>
                      <p className="text-[10px] text-red-600/80 dark:text-red-400/80 mt-0.5 font-medium">
                        Unsettled Liabilities
                      </p>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-red-700 dark:text-red-400 font-mono tabular-nums tracking-tight self-end sm:self-auto w-full text-right sm:text-left mt-2 sm:mt-0 truncate">
                      ₱{formatCurrency(vendor.outstanding_payables)}
                    </span>
                  </div>

                  {/* Total Procurement Value */}
                  <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-200/80 dark:border-blue-500/20 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs flex flex-col justify-between items-start gap-3 sm:gap-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
                        Total Procurement Value
                      </p>
                      <p className="text-[10px] font-mono tabular-nums text-blue-600/80 dark:text-blue-400/80 mt-0.5 font-medium">
                        Latest: {formatDate(vendor.latest_procurement_date)}
                      </p>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 font-mono tabular-nums tracking-tight self-end sm:self-auto w-full text-right sm:text-left mt-2 sm:mt-0 truncate">
                      ₱{formatCurrency(vendor.total_procurement_value)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Transaction Ledger */}
              <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-4 flex items-center gap-2">
                  <Receipt size={14} aria-hidden="true" />
                  <span>Transaction Ledger (Top 50)</span>
                </h3>
                {loadingLedger ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex justify-center items-center py-8 text-amber-500"
                  >
                    <Loader2
                      aria-hidden="true"
                      className="animate-spin w-6 h-6"
                    />
                    <span className="sr-only">Loading transaction ledger</span>
                  </div>
                ) : ledgerError ? (
                  <div role="alert" className="form-error-banner">
                    <AlertCircle
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 mt-0.5"
                    />
                    <span>{ledgerError}</span>
                  </div>
                ) : ledger.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                    No procurement history found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ledger.map((tx, idx) => (
                      <div
                        key={tx.id || `${tx.reference_number}-${idx}`}
                        className="flex justify-between items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50"
                      >
                        <div className="min-w-0">
                          <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400">
                            {(tx.transaction_type || "LEDGER").replace(
                              /_/g,
                              " ",
                            )}
                          </p>
                          <p className="text-xs sm:text-sm font-mono tabular-nums font-black text-slate-900 dark:text-white mt-0.5 truncate">
                            {tx.reference_number}
                          </p>
                          <p className="text-[10px] font-mono tabular-nums font-medium text-slate-500 dark:text-slate-400 mt-1">
                            {formatDate(tx.transaction_date)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white mb-1">
                            ₱{formatCurrency(tx.amount)}
                          </p>
                          <StatusBadge
                            label={(tx.status || "PENDING").replace(/_/g, " ")}
                            variant={getTxStatusVariant(tx.status)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {vendor.notes && (
                <section className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-overdrive-yellow mb-2 flex items-center gap-2">
                    <FileText size={14} aria-hidden="true" />
                    <span>Procurement Terms / Notes</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                    "{vendor.notes}"
                  </p>
                </section>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VendorDrawer;
