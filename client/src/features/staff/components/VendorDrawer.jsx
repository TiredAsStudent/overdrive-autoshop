import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Store,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  FileText,
  Landmark,
  ShieldCheck,
} from "lucide-react";

const VendorDrawer = ({ isOpen, onClose, vendor }) => {
  if (!vendor) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[500px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <Store size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    {vendor.business_name}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {vendor.vendor_code}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Profile Card */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-slate-100 dark:border-slate-700 pb-2 mb-2 flex items-center gap-1.5">
                  <Building2 size={12} /> Corporate Profile
                </h3>

                <div className="grid grid-cols-2 gap-4 pb-2">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Rep Name
                    </p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {vendor.contact_person}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Contact No.
                    </p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                      <Phone size={12} className="text-amber-500" />{" "}
                      {vendor.contact_number}
                    </p>
                  </div>
                </div>

                {vendor.email && (
                  <div className="flex items-start gap-3">
                    <Mail size={14} className="text-slate-400 mt-0.5" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {vendor.email}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <MapPin
                    size={14}
                    className="text-slate-400 mt-0.5 shrink-0"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                    {vendor.business_address}
                  </span>
                </div>
              </div>

              {/* Fiscal Registration */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 flex items-center gap-1.5">
                  <Landmark size={12} /> Fiscal Data
                </h3>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-500">
                    TIN Registry
                  </span>
                  <span className="text-xs font-mono font-bold tracking-wider text-slate-900 dark:text-white">
                    {vendor.tin || "Not Provided"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">
                    VAT Status
                  </span>
                  {vendor.is_vat_registered ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <ShieldCheck size={10} /> VAT Registered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                      NON-VAT
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              {vendor.notes && (
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-2">
                    <FileText size={14} /> Procurement Terms / Notes
                  </h3>
                  <p className="text-xs text-amber-900 dark:text-amber-200/80 italic leading-relaxed">
                    "{vendor.notes}"
                  </p>
                </div>
              )}

              {/* Administrative Footer */}
              <div className="flex justify-between items-center px-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Building2 size={10} /> {vendor.branch_name || "Global"}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Calendar size={10} /> Added:{" "}
                  {new Date(vendor.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Transaction History Stub (Aligns with FRS 5.8) */}
              <div className="mt-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-2">
                  Procurement Ledger (Pending Module)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center opacity-60">
                    <span className="block text-xl font-black text-slate-900 dark:text-white mb-1">
                      -
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                      Purchase Orders
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center opacity-60">
                    <span className="block text-xl font-black text-slate-900 dark:text-white mb-1">
                      -
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                      Supplier Bills
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

export default VendorDrawer;
