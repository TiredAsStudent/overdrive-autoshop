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
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[550px] bg-slate-50 dark:bg-slate-900 shadow-2xl z-[80] flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 pb-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500">
                  <ArrowRightLeft size={24} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                    {transfer.transfer_reference}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Executed on{" "}
                    {new Date(transfer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6 bg-slate-50/50 dark:bg-transparent">
              <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Execution Status
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                    COMPLETED
                  </span>
                </div>
                <StatusBadge label="Completed" variant="success" />
              </div>

              {/* Item Profile */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-inner text-slate-400 border border-slate-100 dark:border-slate-800">
                    <Package size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">
                      {transfer.sku}
                    </p>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase mt-0.5 truncate max-w-[200px] sm:max-w-[250px]">
                      {transfer.item_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Category: {transfer.category}
                    </p>
                  </div>
                </div>
              </div>

              {/* Logistics Vector Map */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                  Logistics Vector
                </p>
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
              </div>

              {/* Financial & Quantities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Transfer Quantity
                  </p>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-500">
                    {transfer.quantity}{" "}
                    <span className="text-xs opacity-70">{transfer.uom}</span>
                  </p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Asset Value Shifted
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    ₱{financialImpact}
                  </p>
                </div>
              </div>

              {/* Logistics Notes & Audit */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  Logistics Reason / Notes
                </p>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 leading-relaxed mb-6">
                  "{transfer.reason}"
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Audit Trail
                </p>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-300">
                  Executed by: {transfer.first_name} {transfer.last_name}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TransferDrawer;
