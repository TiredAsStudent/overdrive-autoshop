import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Scale,
  Package,
  Calendar,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

const StockAdjustmentDrawer = ({ isOpen, onClose, request }) => {
  if (!request) return null;

  const isDeduct = request.adjustment_type === "DEDUCT";
  const isPending = request.status === "PENDING";

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "REJECTED":
        return "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
      default:
        return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    }
  };

  const StatusIcon =
    request.status === "APPROVED"
      ? CheckCircle
      : request.status === "REJECTED"
        ? XCircle
        : Clock;

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
            className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[600px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <Scale size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate">
                    {request.adjustment_number || "Request Details"}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusColor(request.status)}`}
                  >
                    <StatusIcon size={10} />
                    {request.status}
                  </span>
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
              {/* Item Snapshot */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-slate-400 shadow-sm">
                  <Package size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                    {request.sku}
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate mt-0.5">
                    {request.item_name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 flex items-center gap-1.5">
                    <Building2 size={12} /> {request.branch_name}
                  </p>
                </div>
              </div>

              {/* Variance Mathematics */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1">
                  Variance Report
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      System Snapshot
                    </p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {request.current_system_quantity}{" "}
                      <span className="text-xs text-slate-500">
                        {request.uom}
                      </span>
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-2xl border ${isDeduct ? "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20" : "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20"}`}
                  >
                    <p
                      className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isDeduct ? "text-red-500" : "text-emerald-500"}`}
                    >
                      Requested {isDeduct ? "Deduction" : "Addition"}
                    </p>
                    <p
                      className={`text-xl font-black flex items-center gap-1 ${isDeduct ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                    >
                      {isDeduct ? (
                        <ArrowDownRight size={20} />
                      ) : (
                        <ArrowUpRight size={20} />
                      )}
                      {request.requested_quantity}{" "}
                      <span className="text-xs">{request.uom}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Classification / Reason Code
                  </p>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    {request.reason.replace(/_/g, " ")}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Staff Explanation
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                      "{request.staff_remarks}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Resolution Area */}
              <div
                className={`p-4 rounded-2xl border ${isPending ? "bg-slate-50 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-600" : request.status === "APPROVED" ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20" : "bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20"}`}
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                  <Calendar size={12} /> Manager Resolution
                </p>
                {isPending ? (
                  <p className="text-xs font-bold text-slate-400 italic">
                    Awaiting manager review and financial execution...
                  </p>
                ) : (
                  <div>
                    <p
                      className={`text-xs font-black uppercase tracking-widest mb-1 ${request.status === "APPROVED" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                    >
                      {request.status} BY {request.resolver_first_name}{" "}
                      {request.resolver_last_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 mb-3">
                      On {new Date(request.resolved_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      "
                      {request.manager_remarks ||
                        "No additional remarks provided."}
                      "
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StockAdjustmentDrawer;
