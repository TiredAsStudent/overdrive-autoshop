import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X,
  History,
  CheckCircle2,
  FileText,
  Calculator,
  Store,
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  ImageOff,
  AlertCircle,
  Clock,
  XCircle,
  BadgeCheck,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { receiptService } from "../../../services/staff/receipt.service";
import StatusBadge from "../../../components/ui/StatusBadge";
import api from "../../../services/api";

const ReceiptHistoryDrawer = ({ isOpen, onClose, scanId }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Viewer States
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && scanId) {
      setLoading(true);
      setError("");
      setZoom(1);
      setRotation(0);
      setImageError(false);
      receiptService
        .getHistoryDetails(scanId)
        .then((res) => setData(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, scanId]);

  if (!isOpen) return null;

  const handleNavigateToExpense = () => {
    onClose();
    navigate(`/staff/purchases/expenses?search=${data.expense_number}`);
  };

  const getConfidenceBannerClasses = (score) => {
    const num = parseFloat(score || 0);
    if (num >= 85)
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    if (num >= 60)
      return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    return "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
  };

  const getStatusBadgeVariant = (status) => {
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "danger";
    if (status === "PENDING_APPROVAL") return "warning";
    return "default";
  };

  const getStatusBadgeIcon = (status) => {
    if (status === "APPROVED") return CheckCircle2;
    if (status === "REJECTED") return XCircle;
    if (status === "PENDING_APPROVAL") return Clock;
    return FileText;
  };

  const getBaseUrl = () => {
    if (api.defaults.baseURL) {
      return api.defaults.baseURL.replace("/api/v1", "");
    }
    return import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace("/api/v1", "")
      : "http://localhost:5000";
  };

  const isPdf = data?.original_filename?.toLowerCase().endsWith(".pdf");
  const fileUrl = data?.file_path ? `${getBaseUrl()}${data.file_path}` : "";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer z-40"
            aria-hidden="true"
          />

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
            className="relative w-full lg:w-[900px] xl:w-[1100px] bg-slate-50 dark:bg-slate-900/95 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <History size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]">
                    Archived Document Record
                  </h2>
                  <div className="flex flex-col items-start gap-1.5 mt-1.5">
                    {data && (
                      <StatusBadge
                        label={
                          data.expense_status?.replace("_", " ") || "UNKNOWN"
                        }
                        variant={getStatusBadgeVariant(data.expense_status)}
                        icon={getStatusBadgeIcon(data.expense_status)}
                      />
                    )}
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                      <BadgeCheck size={12} className="text-amber-500" />
                      Immutable Audit Trail
                    </span>
                  </div>
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

            {/* Content Body: Split Workspace */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50/50 dark:bg-transparent">
              {loading && (
                <div className="w-full h-full flex flex-col items-center justify-center py-20 text-slate-400 opacity-70">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Retrieving Archive...
                  </p>
                </div>
              )}

              {error && (
                <div className="w-full p-8 flex items-center justify-center">
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200">
                    {error}
                  </div>
                </div>
              )}

              {data && !loading && (
                <>
                  {/* LEFT PANE: Source Document View */}
                  <div className="w-full lg:w-1/2 h-[350px] lg:h-full bg-slate-100 dark:bg-[#0B1120] relative flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
                    {/* Viewer Toolbar */}
                    <div className="p-3 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <FileText size={14} className="text-amber-500" /> Raw
                        Scan File
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setZoom((z) => Math.max(0.5, z - 0.25))
                          }
                          disabled={isPdf}
                          className="p-1.5 text-slate-500 hover:text-amber-500 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Zoom Out"
                        >
                          <ZoomOut size={14} />
                        </button>
                        <span className="text-[9px] font-black w-8 text-center text-slate-700 dark:text-slate-300">
                          {Math.round(zoom * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                          disabled={isPdf}
                          className="p-1.5 text-slate-500 hover:text-amber-500 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Zoom In"
                        >
                          <ZoomIn size={14} />
                        </button>
                        <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-1" />
                        <button
                          type="button"
                          onClick={() => setRotation((r) => r + 90)}
                          disabled={isPdf}
                          className="p-1.5 text-slate-500 hover:text-amber-500 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Rotate"
                        >
                          <RotateCw size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Image Preview Canvas */}
                    <div
                      className={`flex-1 overflow-auto custom-scrollbar flex items-center justify-center p-4 ${
                        isDesktop && !isPdf ? "cursor-move" : "cursor-auto"
                      }`}
                    >
                      {isPdf ? (
                        <div className="w-full h-full relative group bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-2xl">
                          <iframe
                            src={fileUrl}
                            className="w-full h-full bg-white"
                            title="Document PDF"
                            onError={() => setImageError(true)}
                          />
                          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl hover:bg-amber-500 transition-colors"
                            >
                              <FileText size={14} />
                              Open PDF in New Tab
                            </a>
                          </div>
                        </div>
                      ) : imageError ? (
                        <div className="flex flex-col items-center justify-center p-10 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-center shadow-lg">
                          <ImageOff size={48} className="mb-4 opacity-50" />
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-1">
                            File Unavailable
                          </h3>
                          <p className="text-[10px] font-medium max-w-[200px]">
                            The source document could not be loaded from the
                            storage server.
                          </p>
                        </div>
                      ) : (
                        <motion.img
                          drag={isDesktop && !isPdf}
                          dragConstraints={{
                            left: -500,
                            right: 500,
                            top: -500,
                            bottom: 500,
                          }}
                          animate={{ scale: zoom, rotate: rotation }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                          src={fileUrl}
                          alt="Physical Receipt Scan"
                          onError={() => setImageError(true)}
                          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        />
                      )}
                    </div>
                  </div>

                  {/* RIGHT PANE: Extracted Data Workspace */}
                  <div className="w-full lg:w-1/2 flex flex-col h-full bg-slate-50 dark:bg-slate-900">
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8">
                      {/* Ledger Linkage Top Bar */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                            Official Ledger Record
                          </p>
                          <p className="text-sm font-black text-amber-600 dark:text-amber-500">
                            {data.expense_number}
                          </p>
                        </div>
                        <button
                          onClick={handleNavigateToExpense}
                          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 rounded-xl hover:border-amber-500 hover:text-amber-500 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                        >
                          Open Expense <ExternalLink size={14} />
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-blue-500" />{" "}
                            Data Validation
                          </h2>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Review AI outputs and verified accounting data.
                          </p>
                        </div>

                        {/* Premium Confidence Banner */}
                        <div
                          className={`px-5 py-2.5 rounded-[16px] border flex items-center gap-4 shadow-sm transition-all ${getConfidenceBannerClasses(
                            data.confidence_score,
                          )}`}
                        >
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-0.5">
                              AI Confidence
                            </p>
                            <p className="text-base font-black tracking-tight leading-none">
                              {data.confidence_score}%
                            </p>
                          </div>
                          {parseFloat(data.confidence_score) < 60 && (
                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase bg-rose-500/10 px-2 py-1.5 rounded-lg border border-rose-500/20">
                              <AlertCircle size={14} /> Low Accuracy
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vendor & General Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                          <Store size={16} className="text-slate-400 mb-3" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                              Vendor Identity
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase">
                              {data.vendor_name || "Unregistered Vendor"}
                            </p>
                          </div>
                        </section>
                        <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 rounded-[20px] sm:rounded-[24px] border border-amber-100 dark:border-amber-500/20 shadow-sm flex flex-col justify-between">
                          <Calendar size={16} className="text-amber-400 mb-3" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-1">
                              Expense Date
                            </p>
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-400 truncate">
                              {new Date(data.expense_date).toLocaleDateString()}
                            </p>
                          </div>
                        </section>
                      </div>

                      {/* Line Items Breakdown */}
                      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                            <FileText size={14} /> Verified Line Items
                          </h3>
                        </div>
                        <div className="p-5 sm:p-6 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {Array.isArray(data.line_items) &&
                          data.line_items.length > 0 ? (
                            data.line_items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-xs p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800"
                              >
                                <div className="min-w-0 flex-1 pr-3">
                                  <p className="font-bold text-slate-900 dark:text-white uppercase truncate">
                                    {item.description}
                                  </p>
                                  <p className="text-[9px] font-bold text-slate-500 mt-0.5">
                                    {item.quantity}x
                                  </p>
                                </div>
                                <span className="font-black font-mono text-slate-900 dark:text-white shrink-0">
                                  ₱
                                  {parseFloat(
                                    item.total_price || 0,
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-xs text-slate-400 italic">
                              No individual line items parsed.
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Financial Posting Summary */}
                      <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl opacity-95">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 border-b border-white/10 pb-3 flex items-center gap-1.5">
                          <Calculator size={14} /> Financial Statement Impact
                        </p>
                        <div className="space-y-3 mb-5 text-sm font-medium text-slate-400">
                          <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                            <span>Net Subtotal</span>
                            <span className="font-bold text-slate-200 font-mono">
                              ₱
                              {parseFloat(data.subtotal || 0).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                },
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-800/50 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                            <span>Input VAT Allocation</span>
                            <span className="font-bold text-slate-200 font-mono">
                              ₱
                              {parseFloat(data.vat_amount || 0).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                },
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 sm:pt-5 border-t border-slate-700/50">
                          <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                            Grand Total
                          </span>
                          <span className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight font-mono">
                            ₱
                            {parseFloat(data.grand_total || 0).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                              },
                            )}
                          </span>
                        </div>
                      </section>

                      {/* Status / Staff Verification Audit Area */}
                      <section className="p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col shadow-sm bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                          <ClipboardList size={14} className="text-slate-400" />{" "}
                          Human Verification Trace
                        </p>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">
                            VERIFIED BY {data.verified_by_first}{" "}
                            {data.verified_by_last}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            On{" "}
                            {new Date(data.verification_date).toLocaleString()}
                          </p>
                        </div>
                      </section>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReceiptHistoryDrawer;
