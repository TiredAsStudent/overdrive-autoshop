import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Calculator,
  ImageOff,
  FileText,
  Download,
} from "lucide-react";
import StatusBadge from "../../../components/ui/StatusBadge";
import api from "../../../services/api";

const getEvidenceUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  let baseUrl = api.defaults.baseURL
    ? api.defaults.baseURL.replace("/api/v1", "")
    : import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
      "http://localhost:5000";

  if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);

  const normalizedPath = path.replace(/\\/g, "/");
  const uploadsIndex = normalizedPath.toLowerCase().indexOf("uploads/");
  const cleanPath =
    uploadsIndex !== -1
      ? normalizedPath.slice(uploadsIndex)
      : normalizedPath.startsWith("/")
        ? normalizedPath.slice(1)
        : normalizedPath;

  return `${baseUrl}/${cleanPath}`;
};

const isPdf = (path) => path?.toLowerCase().endsWith(".pdf");

const AdjustmentDrawer = ({ isOpen, onClose, request }) => {
  const [imageError, setImageError] = useState(false);
  const drawerTitleId = useId();
  const managerRemarksId = useId();

  useEffect(() => {
    if (isOpen && request) {
      setImageError(false);
    }
  }, [isOpen, request]);

  // Close drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const isVisible = Boolean(isOpen && request && request.status !== "PENDING");
  const isDeduct = request?.adjustment_type === "DEDUCT";

  // Financial Impact Math
  const unitCost = parseFloat(request?.unit_cost) || 0;
  const currentStock = parseInt(request?.current_system_quantity, 10) || 0;
  const requestedQty = parseInt(request?.requested_quantity, 10) || 0;
  const financialImpact = (requestedQty * unitCost).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const resultingStock = isDeduct
    ? currentStock - requestedQty
    : currentStock + requestedQty;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            className="relative h-full h-dvh w-full sm:w-[480px] lg:w-[560px] bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Drawer Header */}
            <header className="flex justify-between items-center px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <Scale size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]"
                  >
                    Adjustment Details
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Req by: {request.requester_first_name}{" "}
                    {request.requester_last_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close adjustment details drawer"
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {/* Scrollable Body Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6 bg-slate-50/50 dark:bg-transparent">
              {/* STATUS BANNER */}
              <section className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">
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
              </section>

              {/* ITEM SNAPSHOT SECTION */}
              <section className="bg-white dark:bg-slate-800 p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    aria-hidden="true"
                    className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 border border-slate-100 dark:border-slate-800 shrink-0"
                  >
                    <Package size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono tabular-nums font-black uppercase text-amber-600 dark:text-overdrive-yellow tracking-widest truncate">
                      {request.sku}
                    </p>
                    <p
                      className="text-sm font-black text-slate-900 dark:text-white uppercase mt-0.5 truncate max-w-[200px] sm:max-w-[250px]"
                      title={request.item_name}
                    >
                      {request.item_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 truncate">
                      Branch: {request.branch_name}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right border-t border-slate-100 dark:border-slate-700/50 sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0 shrink-0">
                  <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-1">
                    Base Cost
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-white font-mono tabular-nums bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 inline-block">
                    ₱
                    {unitCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </section>

              {/* VARIANCE & STOCK MATH SECTION */}
              <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      Requested Variance
                    </p>
                    <div
                      className={`flex items-center gap-2 text-3xl font-mono tabular-nums font-black tracking-tight uppercase ${
                        isDeduct
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isDeduct ? (
                        <ArrowDownRight size={28} aria-hidden="true" />
                      ) : (
                        <ArrowUpRight size={28} aria-hidden="true" />
                      )}
                      <span>
                        {isDeduct ? "-" : "+"}
                        {requestedQty}
                      </span>
                      <span className="text-sm font-sans font-bold ml-1 opacity-75">
                        {request.uom}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3 bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <span>System Stock:</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {currentStock} {request.uom}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-3">
                    <span>Resulting Stock:</span>
                    <span
                      className={`font-mono tabular-nums text-sm ${
                        resultingStock < 0
                          ? "text-red-600 dark:text-red-400"
                          : ""
                      }`}
                    >
                      {resultingStock} {request.uom}
                    </span>
                  </div>
                </div>
              </section>

              {/* PHOTO EVIDENCE VIEWER */}
              {request.evidence_url && (
                <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                  <div className="flex justify-between items-center mb-4 gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      Visual Evidence Attached
                    </p>
                    {isPdf(request.evidence_url) && (
                      <a
                        href={getEvidenceUrl(request.evidence_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 px-3 py-1.5 rounded-lg"
                      >
                        <Download size={12} aria-hidden="true" />
                        <span>Download PDF</span>
                      </a>
                    )}
                  </div>

                  {isPdf(request.evidence_url) ? (
                    <div className="w-full h-36 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <FileText
                        size={40}
                        aria-hidden="true"
                        className="text-red-500 mb-2"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        PDF Document Attached
                      </span>
                    </div>
                  ) : imageError ? (
                    <div className="w-full h-48 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                      <ImageOff
                        size={32}
                        aria-hidden="true"
                        className="text-slate-400 mb-3 opacity-50"
                      />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Image File Unavailable
                      </span>
                    </div>
                  ) : (
                    <a
                      href={getEvidenceUrl(request.evidence_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open attached discrepancy evidence image in a new tab"
                      className="block relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-zoom-in"
                    >
                      <img
                        src={getEvidenceUrl(request.evidence_url)}
                        alt={`Discrepancy evidence for ${request.item_name}`}
                        onError={() => setImageError(true)}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-opacity backdrop-blur-xs">
                          Click to enlarge
                        </span>
                      </div>
                    </a>
                  )}
                </section>
              )}

              {/* REASON & REMARKS STACK */}
              <section className="bg-white dark:bg-slate-800 p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                  Reason Code
                </p>
                <div className="inline-flex w-fit px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-[10px] font-black tracking-widest uppercase text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {(request.reason || "").replace(/_/g, " ")}
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-6 mb-3">
                  Staff Remarks
                </p>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 flex-1 leading-relaxed">
                  {request.staff_remarks ||
                    "No remarks provided by the staff member."}
                </div>
              </section>

              {/* ESTIMATED FINANCIAL IMPACT */}
              <section
                className={`p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs ${
                  isDeduct
                    ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400"
                    : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    aria-hidden="true"
                    className={`p-3.5 rounded-xl shrink-0 ${
                      isDeduct
                        ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                        : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    <Calculator size={22} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest opacity-90 mb-1">
                      Estimated {isDeduct ? "Write-Off" : "Gain"}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-widest opacity-70">
                      Quantity × Base Cost
                    </span>
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-black tracking-tight font-mono tabular-nums text-left sm:text-right">
                  ₱{financialImpact}
                </span>
              </section>

              {/* MANAGER RESOLUTION AREA (Read-Only) */}
              <div className="pb-6">
                <label htmlFor={managerRemarksId} className="form-label">
                  Manager Resolution Remarks{" "}
                  <span className="opacity-60">(Read-Only)</span>
                </label>
                <textarea
                  id={managerRemarksId}
                  value={request.manager_remarks || ""}
                  disabled
                  rows={3}
                  placeholder="No remarks provided during resolution."
                  className="form-textarea resize-none font-medium leading-relaxed disabled:opacity-80"
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AdjustmentDrawer;
