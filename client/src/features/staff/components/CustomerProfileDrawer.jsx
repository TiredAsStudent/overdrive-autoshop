import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { customerService } from "../../../services/staff/customer.service";
import StatusBadge from "../../../components/ui/StatusBadge";

const CustomerProfileDrawer = ({ isOpen, onClose, customer }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && customer?.id) {
      setLoading(true);
      setError("");
      customerService
        .getCustomerProfile(customer.id)
        .then((res) => setProfileData(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setProfileData(null);
    }
  }, [isOpen, customer]);

  if (!customer) return null;

  const formatDate = (dateString) => {
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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
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
            className="relative w-full sm:w-[480px] lg:w-[560px] bg-slate-50 dark:bg-slate-900/95 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
          >
            {/* 3. Standardized Fixed Header */}
            <header className="flex justify-between items-center px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <User size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]">
                    {customer.full_name}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                    {customer.customer_code}
                  </p>
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

            {/* 4. Standardized Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {/* Contact Information Card */}
              <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-2 flex items-center gap-2">
                  <Phone size={14} /> Contact Profile
                </h3>
                <div className="flex items-start gap-3 text-slate-900 dark:text-white font-bold text-sm">
                  {customer.contact_number}
                </div>
                {customer.email && (
                  <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium">
                    {customer.email}
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400 text-xs font-medium leading-relaxed">
                    {customer.address}
                  </div>
                )}
              </section>

              {/* Administrative Details */}
              <section className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Registered Branch:
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white ml-auto">
                    {customer.branch_name || "Global"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Member Since:
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white ml-auto">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                </div>
              </section>

              {/* Staff Notes */}
              {customer.notes && (
                <section className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-2">
                    <FileText size={14} /> Service Preferences
                  </h3>
                  <p className="text-xs text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                    "{customer.notes}"
                  </p>
                </section>
              )}

              {/* 360° TRANSACTION LEDGER LOADING STATE */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-70">
                  <Loader2
                    className="animate-spin text-amber-500 mb-3"
                    size={24}
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Compiling Ledger...
                  </p>
                </div>
              ) : error ? (
                <div className="p-4 text-center bg-red-50 text-red-500 rounded-xl text-xs font-bold border border-red-200">
                  {error}
                </div>
              ) : profileData ? (
                <div className="mt-8 space-y-6">
                  {/* Summary Cards */}
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                      <FileText size={16} className="text-amber-500" />{" "}
                      Transaction Summary
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] p-4 text-center shadow-sm">
                        <span className="block text-xl font-black text-slate-900 dark:text-white mb-1">
                          {profileData.summary.total_estimates}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                          Estimates
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] p-4 text-center shadow-sm">
                        <span className="block text-xl font-black text-slate-900 dark:text-white mb-1">
                          {profileData.summary.total_orders}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                          Orders
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] p-4 text-center shadow-sm">
                        <span className="block text-xl font-black text-slate-900 dark:text-white mb-1">
                          {profileData.summary.total_invoices}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                          Invoices
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] p-4 text-center shadow-sm">
                        <span className="block text-xl font-black text-slate-900 dark:text-white mb-1">
                          {profileData.summary.total_payments}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                          Payments
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Chronological Ledger Table */}
                  <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Historical Ledger
                      </h3>
                    </div>

                    {profileData.history.length === 0 ? (
                      <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          No transactions found.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left whitespace-nowrap min-w-[500px]">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700">
                              <th className="px-5 py-4">Date</th>
                              <th className="px-5 py-4">Document</th>
                              <th className="px-5 py-4">Status</th>
                              <th className="px-5 py-4 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {profileData.history.map((record, index) => (
                              <tr
                                key={`${record.doc_number}-${index}`}
                                className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                              >
                                <td className="px-5 py-4 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  {formatDate(record.transaction_date)}
                                </td>
                                <td className="px-5 py-4">
                                  <StatusBadge
                                    label={record.doc_type.replace(/_/g, " ")}
                                    variant={getDocVariant(record.doc_type)}
                                  />
                                  <p className="text-[10px] font-black text-slate-900 dark:text-white mt-1.5">
                                    {record.doc_number}
                                  </p>
                                </td>
                                <td className="px-5 py-4">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    {record.status.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right text-xs font-black text-slate-900 dark:text-white font-mono">
                                  ₱
                                  {parseFloat(record.amount).toLocaleString(
                                    undefined,
                                    { minimumFractionDigits: 2 },
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
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
