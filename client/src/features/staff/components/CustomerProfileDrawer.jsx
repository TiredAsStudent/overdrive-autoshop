import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { customerService } from "../../../services/staff/customer.service";
import StatusBadge from "../../../components/ui/StatusBadge";
import Pagination from "../../../components/shared/Pagination";

const ITEMS_PER_PAGE = 5;

const CustomerProfileDrawer = ({ isOpen, onClose, customer }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const drawerTitleId = useId();

  useEffect(() => {
    let isMounted = true;
    if (isOpen && customer?.id) {
      setLoading(true);
      setError("");
      setCurrentPage(1);

      customerService
        .getCustomerProfile(customer.id)
        .then((res) => {
          if (isMounted) setProfileData(res.data);
        })
        .catch((err) => {
          if (isMounted)
            setError(err.message || "Unable to load customer ledger.");
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setProfileData(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, customer]);

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

  if (!customer) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const getDocVariant = (type) => {
    if (type === "ESTIMATE") return "default";
    if (type === "SALES_ORDER") return "warning";
    if (type === "INVOICE") return "danger";
    return "success";
  };

  const totalItems = profileData?.history?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const currentHistory = profileData?.history
    ? profileData.history.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      )
    : [];

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
            className="relative h-full h-dvh w-full sm:w-[480px] lg:w-[560px] bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
          >
            {/* 3. Standardized Fixed Header */}
            <header className="flex justify-between items-center px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <User size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]"
                    title={customer.full_name}
                  >
                    {customer.full_name}
                  </h2>
                  <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {customer.customer_code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Close customer profile drawer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {/* 4. Standardized Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {/* Contact Information Card */}
              <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs space-y-3.5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-2 flex items-center gap-2">
                  <Phone size={14} aria-hidden="true" /> Contact Profile
                </h3>

                <div className="flex items-center gap-3 text-slate-900 dark:text-white font-mono tabular-nums font-bold text-xs sm:text-sm">
                  <Phone
                    size={14}
                    aria-hidden="true"
                    className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                  />
                  <span>{customer.contact_number}</span>
                </div>

                {customer.email && (
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium break-all">
                    <Mail
                      size={14}
                      aria-hidden="true"
                      className="text-slate-400 shrink-0"
                    />
                    <span>{customer.email}</span>
                  </div>
                )}

                {customer.address && (
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400 text-xs font-medium leading-relaxed">
                    <MapPin
                      size={14}
                      aria-hidden="true"
                      className="text-slate-400 shrink-0 mt-0.5"
                    />
                    <span>{customer.address}</span>
                  </div>
                )}
              </section>

              {/* Administrative Details */}
              <section className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Building2
                    size={14}
                    aria-hidden="true"
                    className="text-slate-400 shrink-0"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Registered Branch:
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white ml-auto truncate max-w-[180px]">
                    {customer.branch_name || "Global"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                  <Calendar
                    size={14}
                    aria-hidden="true"
                    className="text-slate-400 shrink-0"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Member Since:
                  </span>
                  <span className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white ml-auto">
                    {formatDate(customer.created_at)}
                  </span>
                </div>
              </section>

              {/* Staff Notes */}
              {customer.notes && (
                <section className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-xs">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-overdrive-yellow mb-2 flex items-center gap-2">
                    <FileText size={14} aria-hidden="true" /> Service
                    Preferences
                  </h3>
                  <p className="text-xs text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                    "{customer.notes}"
                  </p>
                </section>
              )}

              {/* 360° TRANSACTION LEDGER LOADING STATE */}
              {loading ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-center justify-center py-10 opacity-80"
                >
                  <Loader2
                    aria-hidden="true"
                    className="animate-spin text-amber-500 mb-3"
                    size={24}
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Compiling Ledger...
                  </p>
                </div>
              ) : error ? (
                <div role="alert" className="form-error-banner">
                  <AlertCircle
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5"
                  />
                  <span>{error}</span>
                </div>
              ) : profileData ? (
                <div className="mt-6 space-y-6">
                  {/* Summary Cards */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                      <FileText
                        size={16}
                        aria-hidden="true"
                        className="text-amber-600 dark:text-overdrive-yellow"
                      />
                      <span>Transaction Summary</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center shadow-xs">
                        <span className="block text-xl font-mono tabular-nums font-black text-slate-900 dark:text-white mb-1">
                          {profileData.summary?.total_estimates ?? 0}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Estimates
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center shadow-xs">
                        <span className="block text-xl font-mono tabular-nums font-black text-slate-900 dark:text-white mb-1">
                          {profileData.summary?.total_orders ?? 0}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Orders
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center shadow-xs">
                        <span className="block text-xl font-mono tabular-nums font-black text-slate-900 dark:text-white mb-1">
                          {profileData.summary?.total_invoices ?? 0}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Invoices
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center shadow-xs">
                        <span className="block text-xl font-mono tabular-nums font-black text-slate-900 dark:text-white mb-1">
                          {profileData.summary?.total_payments ?? 0}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Payments
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Chronological Ledger Table */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                        Historical Ledger
                      </h3>
                    </div>

                    {!profileData.history ||
                    profileData.history.length === 0 ? (
                      <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          No transactions found.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left whitespace-nowrap min-w-[460px]">
                          <caption className="sr-only">
                            Customer Historical Transaction Ledger
                          </caption>
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700">
                              <th scope="col" className="px-5 py-4">
                                Date
                              </th>
                              <th scope="col" className="px-5 py-4">
                                Document
                              </th>
                              <th scope="col" className="px-5 py-4">
                                Status
                              </th>
                              <th scope="col" className="px-5 py-4 text-right">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {currentHistory.map((record, index) => (
                              <tr
                                key={`${record.doc_number}-${index}`}
                                className="table-row-hover"
                              >
                                <td className="px-5 py-4 text-[11px] font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                                  {formatDate(record.transaction_date)}
                                </td>
                                <td className="px-5 py-4">
                                  <StatusBadge
                                    label={record.doc_type.replace(/_/g, " ")}
                                    variant={getDocVariant(record.doc_type)}
                                  />
                                  <p className="text-[10px] font-mono tabular-nums font-black text-slate-900 dark:text-white mt-1.5">
                                    {record.doc_number}
                                  </p>
                                </td>
                                <td className="px-5 py-4">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                                    {record.status
                                      ? record.status.replace(/_/g, " ")
                                      : "RECORDED"}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right text-xs font-black text-slate-900 dark:text-white font-mono tabular-nums">
                                  ₱
                                  {(
                                    parseFloat(record.amount) || 0
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {totalItems > 0 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CustomerProfileDrawer;
