import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRightLeft, Package, MapPin, Calculator } from "lucide-react";
import StatusBadge from "../../../components/ui/StatusBadge";

const TransferDrawer = ({ isOpen, onClose, transfer }) => {
  if (!transfer) return null;

  const financialImpact = (
    transfer.quantity * parseFloat(transfer.recorded_unit_cost)
  ).toLocaleString(undefined, { minimumFractionDigits: 2 });

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
                  <ArrowRightLeft size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]">
                    {transfer.transfer_reference}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                    Executed on{" "}
                    {new Date(transfer.created_at).toLocaleDateString()}
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
              {/* STATUS BANNER */}
              <section className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Execution Status
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                    COMPLETED
                  </span>
                </div>
                <StatusBadge label="Completed" variant="success" />
              </section>

              {/* ITEM SNAPSHOT CARD */}
              <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Transferred Asset
                  </span>
                  <Package size={16} className="text-slate-400" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">
                      {transfer.sku}
                    </p>
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase truncate">
                      {transfer.item_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Category: {transfer.category}
                    </p>
                  </div>
                  <div className="text-left sm:text-right bg-slate-50 dark:bg-slate-900/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                      Base Cost
                    </p>
                    <p className="text-sm font-black text-slate-900 dark:text-white font-mono bg-white sm:bg-slate-50 dark:bg-slate-800 sm:dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                      ₱
                      {parseFloat(transfer.recorded_unit_cost).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                        },
                      )}
                    </p>
                  </div>
                </div>
              </section>

              {/* LOGISTICS VECTOR CARD */}
              <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Logistics Vector
                  </p>
                  <ArrowRightLeft size={16} className="text-slate-400" />
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-red-500" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Extracted From
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {transfer.source_branch_name}
                      </span>
                    </div>
                  </div>
                  <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-700 ml-2"></div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Deposited To
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {transfer.destination_branch_name}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ESTIMATED FINANCIAL IMPACT CARD */}
              <section className="p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-400">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3.5 rounded-2xl shadow-inner shrink-0 bg-blue-100 dark:bg-blue-500/20 text-blue-600">
                    <Calculator size={22} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 truncate">
                      Asset Value Transferred
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-widest opacity-50 truncate">
                      {transfer.quantity} {transfer.uom} × Base Cost
                    </span>
                  </div>
                </div>
                <span className="text-3xl font-black tracking-tight font-mono text-left sm:text-right shrink-0">
                  ₱{financialImpact}
                </span>
              </section>

              {/* REASON & AUDIT CARD */}
              <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  Logistics Reason / Notes
                </p>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900 p-5 rounded-[16px] border border-slate-100 dark:border-slate-800/50 flex-1 leading-relaxed mb-6">
                  "{transfer.reason}"
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700/50 pt-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Audit Trail Execution
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-300">
                    Executed by: {transfer.first_name} {transfer.last_name}
                  </p>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TransferDrawer;
