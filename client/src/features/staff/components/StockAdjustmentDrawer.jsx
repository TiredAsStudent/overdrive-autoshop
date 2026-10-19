import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Calculator,
  Image as ImageIcon,
  ImageOff,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import StatusBadge from "../../../components/ui/StatusBadge";
import api from "../../../services/api";

const StockAdjustmentDrawer = ({ isOpen, onClose, request }) => {
  const [imageError, setImageError] = useState(false);
  const drawerTitleId = useId();

  useEffect(() => {
    if (isOpen) {
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

  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    if (includeTime) {
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getEvidenceUrl = (filePath) => {
    if (!filePath) return null;
    const rawBaseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace("/api/v1", "")
      : import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
        "http://localhost:5000";

    const baseUrl = rawBaseUrl.replace(/\/$/, "");
    const normalized = filePath.replace(/\\/g, "/");
    const uploadsIdx = normalized.indexOf("uploads/");
    const cleanRelative =
      uploadsIdx !== -1
        ? normalized.slice(uploadsIdx)
        : normalized.replace(/^\//, "");

    return `${baseUrl}/${cleanRelative}`;
  };

  const isDeduct = request?.adjustment_type === "DEDUCT";
  const isPending = request?.status === "PENDING";

  const currentStock = parseInt(request?.current_system_quantity, 10) || 0;
  const requestedQty = parseInt(request?.requested_quantity, 10) || 0;
  const unitCost = parseFloat(request?.unit_cost) || 0;
  const financialImpact = formatCurrency(requestedQty * unitCost);
  const resultingStock = isDeduct
    ? currentStock - requestedQty
    : currentStock + requestedQty;

  const docNumber = request
    ? request.adjustment_number || `ADJ-${String(request.id).padStart(5, "0")}`
    : "Request Details";

  return (
    <AnimatePresence>
      {isOpen && request && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* 1. Standardized Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
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
            className="relative h-full h-dvh w-full sm:w-[480px] lg:w-[560px] bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
          >
            {/* 3. Standardized Fixed Header */}
            <header className="flex justify-between items-center px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs">
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
                    className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[280px]"
                  >
                    {docNumber}
                  </h2>
                  <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    Submitted on {formatDate(request.created_at)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Close stock adjustment drawer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {/* 4. Standardized Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8 bg-slate-50/50 dark:bg-transparent">
              {/* STATUS BANNER */}
              <section className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">
                    Resolution Status
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                    {request.status || "PENDING"}
                  </span>
                </div>
                <StatusBadge
                  label={request.status || "PENDING"}
                  variant={
                    request.status === "APPROVED"
                      ? "success"
                      : request.status === "REJECTED"
                        ? "danger"
                        : "warning"
                  }
                  icon={
                    request.status === "APPROVED"
                      ? CheckCircle
                      : request.status === "REJECTED"
                        ? XCircle
                        : Clock
                  }
                />
              </section>

              {/* ITEM SNAPSHOT CARD */}
              <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Target Inventory Item
                  </h3>
                  <Package
                    size={16}
                    aria-hidden="true"
                    className="text-amber-500 dark:text-overdrive-yellow"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono tabular-nums font-black uppercase text-amber-600 dark:text-overdrive-yellow tracking-widest mb-1">
                      {request.sku}
                    </p>
                    <p
                      className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase italic truncate"
                      title={request.item_name}
                    >
                      {request.item_name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 truncate">
                      Branch: {request.branch_name}
                    </p>
                  </div>
                  <div className="text-left sm:text-right bg-slate-50 dark:bg-slate-900/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none shrink-0">
                    <p className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-1">
                      Base Cost
                    </p>
                    <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums bg-white sm:bg-slate-50 dark:bg-slate-800 sm:dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                      ₱{formatCurrency(request.unit_cost)}
                    </p>
                  </div>
                </div>
              </section>

              {/* VARIANCE & STOCK MATH CARD */}
              <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      Requested Variance
                    </h3>
                    <div
                      className={`flex items-center gap-2 text-2xl sm:text-3xl font-mono tabular-nums font-black tracking-tight uppercase ${
                        isDeduct
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isDeduct ? (
                        <ArrowDownRight size={26} aria-hidden="true" />
                      ) : (
                        <ArrowUpRight size={26} aria-hidden="true" />
                      )}
                      <span>
                        {isDeduct ? "-" : "+"}
                        {requestedQty}
                      </span>
                      <span className="text-xs sm:text-sm font-sans ml-1 opacity-75">
                        {request.uom}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <span>System Stock Snapshot:</span>
                    <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {currentStock} {request.uom}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-3">
                    <span>Resulting Stock:</span>
                    <span
                      className={`font-mono tabular-nums text-sm ${
                        resultingStock < 0
                          ? "text-rose-600 dark:text-rose-400"
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
                <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                    <ImageIcon
                      size={14}
                      aria-hidden="true"
                      className="text-amber-500 dark:text-overdrive-yellow"
                    />
                    <span>Visual Evidence</span>
                  </h3>
                  {imageError ? (
                    <div className="w-full h-48 sm:h-56 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-4">
                      <ImageOff
                        size={32}
                        aria-hidden="true"
                        className="text-slate-400 mb-3 opacity-50"
                      />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Image File Unavailable
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 text-center max-w-[220px] mt-1">
                        The file may have been moved or deleted from the server.
                      </span>
                    </div>
                  ) : (
                    <a
                      href={getEvidenceUrl(request.evidence_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open attached discrepancy photo evidence in a new tab"
                      className="block relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900 cursor-zoom-in"
                    >
                      <img
                        src={getEvidenceUrl(request.evidence_url)}
                        alt={`Discrepancy evidence for ${docNumber}`}
                        onError={() => setImageError(true)}
                        className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-focus-visible:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-opacity backdrop-blur-xs flex items-center gap-1.5">
                          <ImageIcon size={12} aria-hidden="true" />
                          <span>Click to Enlarge</span>
                        </span>
                      </div>
                    </a>
                  )}
                </section>
              )}

              {/* REASON & REMARKS CARD */}
              <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                  Reason Code
                </h3>
                <div className="inline-flex w-fit px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-[10px] font-black tracking-widest uppercase text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {request.reason
                    ? request.reason.replace(/_/g, " ")
                    : "UNSPECIFIED"}
                </div>

                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-6 mb-3">
                  Your Explanation
                </h3>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex-1 leading-relaxed break-words">
                  {request.staff_remarks || "No remarks provided."}
                </div>
              </section>

              {/* ESTIMATED FINANCIAL IMPACT CARD */}
              <section
                className={`p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                  isDeduct
                    ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-400"
                    : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    aria-hidden="true"
                    className={`p-3.5 rounded-2xl shadow-inner shrink-0 ${
                      isDeduct
                        ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                        : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    <Calculator size={22} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-widest opacity-85 mb-1 truncate">
                      Estimated {isDeduct ? "Write-Off" : "Gain"}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-widest opacity-65 truncate">
                      Quantity × Base Cost
                    </span>
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-black tracking-tight font-mono tabular-nums text-left sm:text-right shrink-0">
                  ₱{financialImpact}
                </span>
              </section>

              {/* MANAGER RESOLUTION SECTION */}
              <section
                className={`p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col shadow-xs ${
                  isPending
                    ? "bg-slate-50 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-600"
                    : request.status === "APPROVED"
                      ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20"
                      : "bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20"
                }`}
              >
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                  Manager Resolution
                </h3>
                {isPending ? (
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">
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
                      {request.status} BY{" "}
                      {request.resolver_first_name || "Manager"}{" "}
                      {request.resolver_last_name || ""}
                    </p>
                    <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest">
                      On {formatDate(request.resolved_at, true)}
                    </p>
                    <div className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs leading-relaxed break-words">
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
