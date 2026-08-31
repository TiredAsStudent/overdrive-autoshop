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
  ShoppingBag,
  Receipt,
  Calculator,
} from "lucide-react";

const VendorDrawer = ({ isOpen, onClose, vendor }) => {
  if (!vendor) return null;

  const procurementValue = parseFloat(
    vendor.total_procurement_value || 0,
  ).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
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
            {/* Header */}
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <Store size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]">
                    {vendor.business_name}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                    {vendor.vendor_code}
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

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {/* Corporate Profile Card */}
              <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-2 flex items-center gap-2">
                  <Building2 size={14} /> Corporate Profile
                </h3>

                <div className="flex items-start gap-3 text-slate-900 dark:text-white font-bold text-sm">
                  {vendor.contact_number}
                </div>
                <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium">
                  {vendor.contact_person} (Representative)
                </div>

                {vendor.email && (
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium mt-2">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                )}

                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400 text-xs font-medium leading-relaxed mt-2">
                  <MapPin
                    size={14}
                    className="text-slate-400 mt-0.5 shrink-0"
                  />
                  <span>{vendor.business_address}</span>
                </div>
              </section>

              {/* Administrative Details Card */}
              <section className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Registered Branch:
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white ml-auto">
                    {vendor.branch_name || "Global"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Partner Since:
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white ml-auto">
                    {new Date(vendor.created_at).toLocaleDateString()}
                  </span>
                </div>
              </section>

              {/* Fiscal Data Card */}
              <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-2 flex items-center gap-2">
                  <Landmark size={14} /> Fiscal Registration
                </h3>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">TIN Registry</span>
                  <span className="font-mono font-bold tracking-wider text-slate-900 dark:text-white">
                    {vendor.tin || "Not Provided"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 dark:border-slate-700/50">
                  <span className="font-bold text-slate-500">Tax Type</span>
                  {vendor.is_vat_registered ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                      <ShieldCheck size={12} /> VAT Registered
                    </span>
                  ) : (
                    <span className="inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                      NON-VAT
                    </span>
                  )}
                </div>
              </section>

              {/* Lifetime Procurement Summary Metrics */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                  <Calculator size={14} className="text-amber-500" />{" "}
                  Procurement Summary
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 text-center shadow-sm">
                    <span className="block text-2xl font-black text-slate-900 dark:text-white font-mono mb-1">
                      {vendor.total_pos ?? 0}
                    </span>
                    <span className="flex items-center justify-center gap-1.5 text-slate-500 text-[8px] font-bold uppercase tracking-widest">
                      <ShoppingBag size={12} /> Purchase Orders
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] p-5 text-center shadow-sm">
                    <span className="block text-2xl font-black text-slate-900 dark:text-white font-mono mb-1">
                      {vendor.total_bills ?? 0}
                    </span>
                    <span className="flex items-center justify-center gap-1.5 text-slate-500 text-[8px] font-bold uppercase tracking-widest">
                      <Receipt size={12} /> Supplier Bills
                    </span>
                  </div>

                  <div className="col-span-2 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">
                        Total Procurement Value
                      </p>
                      <p className="text-[9px] text-blue-600/70 dark:text-blue-500 mt-0.5 font-medium">
                        Latest:{" "}
                        {vendor.latest_procurement_date
                          ? new Date(
                              vendor.latest_procurement_date,
                            ).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 font-mono tracking-tight">
                      ₱{procurementValue}
                    </span>
                  </div>
                </div>
              </section>

              {/* Notes Card */}
              {vendor.notes && (
                <section className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-2">
                    <FileText size={14} /> Procurement Terms / Notes
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
