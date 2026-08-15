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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />

          {/* Drawer Slide Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] lg:w-[560px] bg-slate-50 dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <User size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]">
                    {customer.full_name}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                    {customer.customer_code}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Contact Information Card */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] p-5 shadow-sm space-y-4">
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
              </div>

              {/* Administrative Details */}
              <div className="bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[20px] p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Registered Branch:
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white ml-auto">
                    {customer.branch_name || "Global"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Member Since:
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white ml-auto">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Staff Notes */}
              {customer.notes && (
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] p-5 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-2">
                    <FileText size={14} /> Service Preferences
                  </h3>
                  <p className="text-xs text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                    "{customer.notes}"
                  </p>
                </div>
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
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1">
                      Transaction Summary
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center shadow-sm">
                        <span className="block text-xl font-black text-slate-900 dark:text-white mb-1">
                          {profileData.summary.total_estimates}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                          Estimates
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center shadow-sm">
                        <span className="block text-xl font-black text-slate-900 dark:text-white mb-1">
                          {profileData.summary.total_orders}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                          Orders
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center shadow-sm">
                        <span className="block text-xl font-black text-slate-900 dark:text-white mb-1">
                          {profileData.summary.total_invoices}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                          Invoices
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center shadow-sm">
                        <span className="block text-xl font-black text-slate-900 dark:text-white mb-1">
                          {profileData.summary.total_payments}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                          Payments
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chronological Ledger Table */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Historical Ledger
                      </h3>
                    </div>

                    {profileData.history.length === 0 ? (
                      <div className="p-10 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          No transactions found.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left whitespace-nowrap min-w-[500px]">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 dark:border-slate-700">
                              <th className="px-5 py-3">Date</th>
                              <th className="px-5 py-3">Document</th>
                              <th className="px-5 py-3">Status</th>
                              <th className="px-5 py-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {profileData.history.map((record, index) => (
                              <tr
                                key={`${record.doc_number}-${index}`}
                                className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                              >
                                <td className="px-5 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  {formatDate(record.transaction_date)}
                                </td>
                                <td className="px-5 py-3">
                                  <StatusBadge
                                    label={record.doc_type.replace(/_/g, " ")}
                                    variant={getDocVariant(record.doc_type)}
                                    className="!py-0.5 !px-1.5 !text-[8px]"
                                  />
                                  <p className="text-[10px] font-black text-slate-900 dark:text-white mt-1">
                                    {record.doc_number}
                                  </p>
                                </td>
                                <td className="px-5 py-3">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    {record.status.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-right text-xs font-black text-slate-900 dark:text-white font-mono">
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
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomerProfileDrawer;
