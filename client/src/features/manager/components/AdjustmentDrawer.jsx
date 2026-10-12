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

  const getEvidenceUrl = (path) => {
    if (!path) return null;
    const baseUrl =
      import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
      "http://localhost:5000";
    return `${baseUrl}/${path}`;
  };

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
            <div className="flex justify-between items-center p-6 sm:p-8 pb-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500">
                  <Scale size={24} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]">
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
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Body Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6 bg-slate-50/50 dark:bg-transparent">
              {/* STATUS BANNER */}
              <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Resolution Status
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                    {request.status}
                  </span>
                </div>
                <StatusBadge
                  label={
                    request.status === "APPROVED" ? "Approved" : "Rejected"
                  }
                  variant={request.status === "APPROVED" ? "success" : "danger"}
                />
              </div>

              {/* ITEM SNAPSHOT SECTION */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-inner text-slate-400 border border-slate-100 dark:border-slate-800">
                    <Package size={22} />
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
                <div className="text-left sm:text-right border-t border-slate-100 dark:border-slate-700/50 sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">
                    Base Cost
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-white font-mono bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 inline-block">
                    ₱
                    {parseFloat(request.unit_cost).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              {/* VARIANCE & STOCK MATH SECTION */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
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

                <div className="mt-6 space-y-3 bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>System Stock:</span>
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
              </div>

              {/* PHOTO EVIDENCE VIEWER */}
              {request.evidence_url && (
                <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    Visual Evidence Attached
                  </p>
                  <a
                    href={getEvidenceUrl(request.evidence_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative group overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 cursor-zoom-in"
                  >
                    <img
                      src={getEvidenceUrl(request.evidence_url)}
                      alt="Discrepancy Evidence"
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-opacity backdrop-blur-sm">
                        Click to enlarge
                      </span>
                    </div>
                  </a>
                </section>
              )}

              {/* REASON & REMARKS STACK */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  Reason Code
                </p>
                <div className="inline-flex w-fit px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-[10px] font-black tracking-widest uppercase text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {request.reason.replace(/_/g, " ")}
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-6 mb-3">
                  Staff Remarks
                </p>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 flex-1 leading-relaxed">
                  {request.staff_remarks ||
                    "No remarks provided by the staff member."}
                </div>
              </div>

              {/* ESTIMATED FINANCIAL IMPACT */}
              <div
                className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm ${
                  isDeduct
                    ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400"
                    : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3.5 rounded-xl shadow-inner ${
                      isDeduct
                        ? "bg-red-100 dark:bg-red-500/20 text-red-600"
                        : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600"
                    }`}
                  >
                    <Calculator size={22} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                      Estimated {isDeduct ? "Write-Off" : "Gain"}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-widest opacity-50">
                      Quantity × Base Cost
                    </span>
                  </div>
                </div>
                <span className="text-3xl font-black tracking-tight font-mono text-left sm:text-right">
                  ₱{financialImpact}
                </span>
              </div>

              {/* MANAGER RESOLUTION AREA (Read-Only) */}
              <div className="pb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                  Manager Resolution Remarks{" "}
                  <span className="opacity-50">(Read-Only)</span>
                </label>
                <textarea
                  value={request.manager_remarks || ""}
                  disabled={true}
                  rows="3"
                  placeholder="No remarks provided during resolution."
                  className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl text-xs font-medium text-slate-900 dark:text-white resize-none disabled:opacity-90 disabled:cursor-not-allowed leading-relaxed"
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
