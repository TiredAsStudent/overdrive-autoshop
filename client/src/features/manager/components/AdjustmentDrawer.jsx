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

const AdjustmentDrawer = ({ isOpen, onClose, request }) => {
  if (!request || request.status === "PENDING") return null;

  const isDeduct = request.adjustment_type === "DEDUCT";

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
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[550px] bg-slate-50 dark:bg-slate-900 shadow-2xl z-[80] flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Drawer Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <Scale size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[250px]">
                    Adjustment Details
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Req by: {request.requester_first_name}{" "}
                    {request.requester_last_name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-500/10 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Status Header */}
              <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Resolution Status
                </span>
                <StatusBadge
                  label={request.status}
                  variant={request.status === "APPROVED" ? "success" : "danger"}
                />
              </div>

              {/* Item Snapshot */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-sm text-slate-400 border border-slate-100 dark:border-slate-800">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">
                      {request.sku}
                    </p>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase mt-0.5 truncate max-w-[200px] sm:max-w-[250px]">
                      {request.item_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Branch: {request.branch_name}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right border-t border-slate-100 dark:border-slate-700/50 sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                    Base Cost
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                    ₱
                    {parseFloat(request.unit_cost).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              {/* Variance & Stock Math */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Requested Variance
                  </p>
                  <div
                    className={`flex items-center gap-2 text-2xl font-black tracking-widest uppercase ${
                      isDeduct
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isDeduct ? (
                      <ArrowDownRight size={24} />
                    ) : (
                      <ArrowUpRight size={24} />
                    )}
                    {request.requested_quantity} {request.uom}
                  </div>
                </div>

                <div className="mt-5 space-y-2.5 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>System Stock:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {currentStock} {request.uom}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
                    <span>Resulting Stock:</span>
                    <span
                      className={`font-mono text-sm ${
                        resultingStock < 0 ? "text-red-500" : ""
                      }`}
                    >
                      {resultingStock} {request.uom}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason & Remarks Stack */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Reason Code
                </p>
                <div className="inline-flex w-fit px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-[10px] font-black tracking-widest uppercase text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                  {request.reason.replace(/_/g, " ")}
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-5 mb-2">
                  Staff Remarks
                </p>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 flex-1">
                  {request.staff_remarks || "No remarks provided."}
                </div>
              </div>

              {/* ESTIMATED FINANCIAL IMPACT */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                  isDeduct
                    ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400"
                    : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      isDeduct
                        ? "bg-red-100 dark:bg-red-500/20"
                        : "bg-emerald-100 dark:bg-emerald-500/20"
                    }`}
                  >
                    <Calculator size={20} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest opacity-80">
                      Estimated Financial {isDeduct ? "Write-Off" : "Gain"}
                    </span>
                    <span className="block text-[10px] font-medium opacity-60">
                      Quantity × Unit Cost
                    </span>
                  </div>
                </div>
                <span className="text-2xl font-black tracking-tight font-mono text-left sm:text-right">
                  ₱{financialImpact}
                </span>
              </div>

              {/* Manager Resolution Area (Read-Only) */}
              <div className="pb-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Manager Resolution Remarks (Read-Only)
                </label>
                <textarea
                  value={request.manager_remarks || ""}
                  disabled={true}
                  rows="3"
                  placeholder="No remarks provided."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl text-xs font-medium text-slate-900 dark:text-white resize-none disabled:opacity-80 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AdjustmentDrawer;
