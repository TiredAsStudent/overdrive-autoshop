import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Calculator,
} from "lucide-react";
import StatusBadge from "../../../components/ui/StatusBadge";

const StockAdjustmentDrawer = ({ isOpen, onClose, request }) => {
  if (!request) return null;

  const isDeduct = request.adjustment_type === "DEDUCT";
  const isPending = request.status === "PENDING";

  // Financial Impact Math
  const financialImpact = (
    request.requested_quantity * parseFloat(request.unit_cost)
  ).toLocaleString(undefined, { minimumFractionDigits: 2 });

  // Resulting Stock Math
  const currentStock = parseInt(request.current_system_quantity, 10) || 0;
  const requestedQty = parseInt(request.requested_quantity, 10) || 0;
  const resultingStock = isDeduct
    ? currentStock - requestedQty
    : currentStock + requestedQty;

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
                  <Scale size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]">
                    {request.adjustment_number || "Request Details"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                    Submitted on{" "}
                    {new Date(request.created_at).toLocaleDateString()}
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
                    Resolution Status
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                    {request.status}
                  </span>
                </div>
                <StatusBadge
                  label={request.status}
                  variant={
                    request.status === "APPROVED"
                      ? "success"
                      : request.status === "REJECTED"
                        ? "danger"
                        : "warning"
                  }
                />
              </section>

              {/* ITEM SNAPSHOT CARD */}
              <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Target Inventory Item
                  </span>
                  <Package size={16} className="text-slate-400" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">
                      {request.sku}
                    </p>
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase truncate">
                      {request.item_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Branch: {request.branch_name}
                    </p>
                  </div>
                  <div className="text-left sm:text-right bg-slate-50 dark:bg-slate-900/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                      Base Cost
                    </p>
                    <p className="text-sm font-black text-slate-900 dark:text-white font-mono bg-white sm:bg-slate-50 dark:bg-slate-800 sm:dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                      ₱
                      {parseFloat(request.unit_cost).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </section>

              {/* VARIANCE & STOCK MATH CARD */}
              <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Requested Variance
                    </p>
                    <div
                      className={`flex items-center gap-2 text-3xl font-black tracking-tighter uppercase ${
                        isDeduct
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isDeduct ? (
                        <ArrowDownRight size={28} />
                      ) : (
                        <ArrowUpRight size={28} />
                      )}
                      {request.requested_quantity}{" "}
                      <span className="text-sm ml-1 opacity-70">
                        {request.uom}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-5 rounded-[16px] border border-slate-100 dark:border-slate-800/50">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>System Stock Snapshot:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {currentStock} {request.uom}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-3">
                    <span>Resulting Stock:</span>
                    <span
                      className={`font-mono text-sm ${resultingStock < 0 ? "text-red-500" : ""}`}
                    >
                      {resultingStock} {request.uom}
                    </span>
                  </div>
                </div>
              </section>

              {/* REASON & REMARKS CARD */}
              <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  Reason Code
                </p>
                <div className="inline-flex w-fit px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-[10px] font-black tracking-widest uppercase text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {request.reason.replace(/_/g, " ")}
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-6 mb-3">
                  Your Explanation
                </p>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900 p-5 rounded-[16px] border border-slate-100 dark:border-slate-800/50 flex-1 leading-relaxed">
                  {request.staff_remarks || "No remarks provided."}
                </div>
              </section>

              {/* ESTIMATED FINANCIAL IMPACT CARD */}
              <section
                className={`p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm ${
                  isDeduct
                    ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400"
                    : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`p-3.5 rounded-2xl shadow-inner shrink-0 ${
                      isDeduct
                        ? "bg-red-100 dark:bg-red-500/20 text-red-600"
                        : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600"
                    }`}
                  >
                    <Calculator size={22} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 truncate">
                      Estimated {isDeduct ? "Write-Off" : "Gain"}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-widest opacity-50 truncate">
                      Quantity × Base Cost
                    </span>
                  </div>
                </div>
                <span className="text-3xl font-black tracking-tight font-mono text-left sm:text-right shrink-0">
                  ₱{financialImpact}
                </span>
              </section>

              {/* MANAGER RESOLUTION SECTION */}
              <section
                className={`p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col shadow-sm ${
                  isPending
                    ? "bg-slate-50 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-600"
                    : request.status === "APPROVED"
                      ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20"
                      : "bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                  Manager Resolution
                </p>
                {isPending ? (
                  <p className="text-xs font-bold text-slate-400 italic">
                    Awaiting manager review and financial execution...
                  </p>
                ) : (
                  <div>
                    <p
                      className={`text-xs font-black uppercase tracking-widest mb-1.5 ${
                        request.status === "APPROVED"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {request.status} BY {request.resolver_first_name}{" "}
                      {request.resolver_last_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-widest">
                      On {new Date(request.resolved_at).toLocaleString()}
                    </p>
                    <div className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-4 rounded-[16px] border border-slate-100 dark:border-slate-800 shadow-sm leading-relaxed">
                      "
                      {request.manager_remarks ||
                        "No additional remarks provided."}
                      "
                    </div>
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StockAdjustmentDrawer;
