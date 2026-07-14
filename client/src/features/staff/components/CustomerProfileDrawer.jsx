import React from "react";
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
} from "lucide-react";

const CustomerProfileDrawer = ({ isOpen, onClose, customer }) => {
  if (!customer) return null;

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
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px]">
                    {customer.full_name}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {customer.customer_code}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Contact Information Card */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-slate-100 dark:border-slate-700 pb-2 mb-2">
                  Contact Profile
                </h3>
                <div className="flex items-start gap-3">
                  <Phone size={14} className="text-slate-400 mt-0.5" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {customer.contact_number}
                  </span>
                </div>
                {customer.email && (
                  <div className="flex items-start gap-3">
                    <Mail size={14} className="text-slate-400 mt-0.5" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {customer.email}
                    </span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin size={14} className="text-slate-400 mt-0.5" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                      {customer.address}
                    </span>
                  </div>
                )}
              </div>

              {/* Administrative Details */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
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
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-2">
                    <FileText size={14} /> Service Preferences
                  </h3>
                  <p className="text-xs text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                    "{customer.notes}"
                  </p>
                </div>
              )}

              {/* Transaction History Stub (Aligns with FRS 5.8) */}
              <div className="mt-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-2">
                  Financial History (Pending Module)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center opacity-60">
                    <span className="block text-xl font-black text-slate-900 dark:text-white mb-1">
                      -
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                      Orders
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center opacity-60">
                    <span className="block text-xl font-black text-slate-900 dark:text-white mb-1">
                      -
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                      Invoices
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center opacity-60">
                    <span className="block text-xl font-black text-slate-900 dark:text-white mb-1">
                      -
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                      Payments
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomerProfileDrawer;
