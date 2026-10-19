import React, { useState, useEffect, useMemo, useId } from "react";
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
  const drawerTitleId = useId();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Viewer States
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && scanId) {
      setLoading(true);
      setError("");
      setZoom(1);
      setRotation(0);
      setImageError(false);
      receiptService
        .getHistoryDetails(scanId)
        .then((res) => {
          if (isMounted) setData(res.data);
        })
        .catch((err) => {
          if (isMounted) {
            setError(
              err.message || "Unable to retrieve archived receipt record.",
            );
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setData(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, scanId]);

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

  const handleNavigateToExpense = () => {
    if (!data?.expense_number) return;
    onClose?.();
    navigate(
      `/staff/purchases/expenses?search=${encodeURIComponent(data.expense_number)}`,
    );
  };

  const getConfidenceBannerClasses = (score) => {
    const num = parseFloat(score || 0);
    if (num >= 85)
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    if (num >= 60)
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
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

  const getAttachmentUrl = (filePath) => {
    if (!filePath) return "";
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

  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return "N/A";
    if (!includeTime) {
      const datePart = String(dateString).split("T")[0];
      const [year, month, day] = datePart.split("-");
      if (year && month && day) {
        return new Date(
          parseInt(year, 10),
          parseInt(month, 10) - 1,
          parseInt(day, 10),
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        });
      }
    }
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) return String(dateString);
    return includeTime
      ? parsed.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "numeric",
          minute: "2-digit",
        })
      : parsed.toLocaleDateString("en-US", {
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

  const isPdf =
    data?.mime_type === "application/pdf" ||
    data?.original_filename?.toLowerCase().endsWith(".pdf") ||
    data?.file_path?.toLowerCase().endsWith(".pdf");

  const fileUrl = data?.file_path ? getAttachmentUrl(data.file_path) : "";

  const parsedData = useMemo(() => {
    if (!data?.extracted_data) return {};
    if (typeof data.extracted_data === "string") {
      try {
        return JSON.parse(data.extracted_data);
      } catch (err) {
        console.error("Failed to parse archived OCR JSON:", err);
        return {};
      }
    }
    return data.extracted_data;
  }, [data]);

  const refNumber =
    parsedData?.receipt_number || parsedData?.reference_number || "N/A";

  const staffNotes = data?.notes
    ? data.notes.split("\n\n[Manager")[0].trim()
    : "";
  const managerNotes =
    data?.expense_status === "REJECTED"
      ? data.rejection_remarks
      : data?.notes?.includes("[Manager Approval Notes]:")
        ? data.notes.split("[Manager Approval Notes]:")[1]?.trim()
        : "";

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
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer z-40"
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
            className="relative h-full h-dvh w-full lg:w-[900px] xl:w-[1100px] bg-slate-50 dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
          >
            {/* Header */}
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs">
              <div className="flex items-start gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <History size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[220px] sm:max-w-[340px]"
                  >
                    Archived Document Record
                  </h2>
                  <div className="flex flex-col items-start gap-1.5 mt-1.5">
                    {data && (
                      <StatusBadge
                        label={
                          data.expense_status
                            ? data.expense_status.replace(/_/g, " ")
                            : "UNKNOWN"
                        }
                        variant={getStatusBadgeVariant(data.expense_status)}
                        icon={getStatusBadgeIcon(data.expense_status)}
                      />
                    )}
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                      <BadgeCheck
                        size={12}
                        aria-hidden="true"
                        className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                      />
                      <span>Immutable Audit Trail</span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                aria-label="Close archived receipt drawer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {/* Content Body: Split Workspace */}
            <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-slate-50/50 dark:bg-transparent">
              {loading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="w-full h-full flex flex-col items-center justify-center py-20 opacity-80"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-8 h-8 animate-spin mb-3 text-amber-500"
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Retrieving Archive...
                  </p>
                </div>
              )}

              {error && !loading && (
                <div className="w-full p-6 sm:p-8">
                  <div role="alert" className="form-error-banner">
                    <AlertCircle
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 mt-0.5"
                    />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {data && !loading && (
                <>
                  {/* LEFT PANE: Source Document View */}
                  <div className="w-full lg:w-1/2 h-[360px] sm:h-[420px] lg:h-full shrink-0 bg-slate-100 dark:bg-slate-950 relative flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
                    {/* Viewer Toolbar */}
                    <div
                      role="toolbar"
                      aria-label="Raw scan viewer controls"
                      className="p-3 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <FileText
                          size={14}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow"
                        />
                        <span>Raw Scan File</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setZoom((z) => Math.max(0.5, z - 0.25))
                          }
                          disabled={isPdf}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-overdrive-yellow rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Zoom out"
                          title="Zoom Out"
                        >
                          <ZoomOut size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={isPdf}
                          onClick={() => {
                            setZoom(1);
                            setRotation(0);
                          }}
                          aria-label="Reset zoom and rotation"
                          title="Click to Reset View"
                          className="text-[10px] font-mono tabular-nums font-black w-11 py-1 text-center text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-overdrive-yellow rounded-md transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {Math.round(zoom * 100)}%
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                          disabled={isPdf}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-overdrive-yellow rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Zoom in"
                          title="Zoom In"
                        >
                          <ZoomIn size={14} aria-hidden="true" />
                        </button>
                        <div
                          aria-hidden="true"
                          className="w-px h-3.5 bg-slate-300 dark:bg-slate-700 mx-1"
                        />
                        <button
                          type="button"
                          onClick={() => setRotation((r) => (r + 90) % 360)}
                          disabled={isPdf}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-overdrive-yellow rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Rotate image 90 degrees clockwise"
                          title="Rotate 90°"
                        >
                          <RotateCw size={14} aria-hidden="true" />
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
                            title="Archived Receipt PDF Document"
                            onError={() => setImageError(true)}
                          />
                          <div className="absolute bottom-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:bg-amber-500 hover:text-slate-900 transition-colors"
                            >
                              <FileText size={14} aria-hidden="true" />
                              <span>Open PDF in New Tab</span>
                            </a>
                          </div>
                        </div>
                      ) : imageError ? (
                        <div className="flex flex-col items-center justify-center p-10 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-center shadow-xs">
                          <ImageOff
                            size={44}
                            aria-hidden="true"
                            className="mb-3 opacity-50"
                          />
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                            File Unavailable
                          </h3>
                          <p className="text-[10px] font-medium max-w-[200px] text-slate-400 dark:text-slate-500">
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
                          alt={`Archived receipt scan for ${data.expense_number}`}
                          onError={() => setImageError(true)}
                          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl select-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* RIGHT PANE: Extracted Data Workspace */}
                  <div className="w-full lg:w-1/2 flex flex-col lg:h-full min-h-0 bg-slate-50 dark:bg-slate-900">
                    <div className="flex-1 lg:overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8">
                      {/* Ledger Linkage Top Bar */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                            Official Ledger Record
                          </p>
                          <p className="text-sm font-mono tabular-nums font-black text-amber-600 dark:text-overdrive-yellow">
                            {data.expense_number}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleNavigateToExpense}
                          className="w-full sm:w-auto justify-center px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 rounded-xl hover:border-amber-500 hover:text-amber-600 dark:hover:text-overdrive-yellow transition-all flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
                        >
                          <span>Open Expense</span>
                          <ExternalLink size={14} aria-hidden="true" />
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                            <CheckCircle2
                              size={16}
                              aria-hidden="true"
                              className="text-blue-600 dark:text-blue-400"
                            />
                            <span>Data Validation</span>
                          </h3>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                            Review AI outputs and verified accounting data.
                          </p>
                        </div>

                        {/* Premium Confidence Banner */}
                        <div
                          className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 shadow-2xs transition-all ${getConfidenceBannerClasses(
                            data.confidence_score,
                          )}`}
                        >
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5">
                              AI Confidence
                            </p>
                            <p className="text-base font-mono tabular-nums font-black tracking-tight leading-none">
                              {data.confidence_score ?? 0}%
                            </p>
                          </div>
                          {parseFloat(data.confidence_score || 0) < 60 && (
                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase bg-rose-500/10 px-2 py-1.5 rounded-lg border border-rose-500/20">
                              <AlertCircle size={14} aria-hidden="true" />
                              <span>Low Accuracy</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vendor & General Info Grid */}
                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-5">
                        <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between min-w-0">
                          <Store
                            size={16}
                            aria-hidden="true"
                            className="text-amber-600 dark:text-overdrive-yellow mb-3"
                          />
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                              Vendor Identity
                            </p>
                            <p
                              className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase"
                              title={data.vendor_name || "Unregistered Vendor"}
                            >
                              {data.vendor_name || "Unregistered Vendor"}
                            </p>
                            <p
                              className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 truncate"
                              title={refNumber}
                            >
                              REF: {refNumber}
                            </p>
                          </div>
                        </section>

                        <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 rounded-[20px] sm:rounded-[24px] border border-amber-200 dark:border-amber-500/20 shadow-xs flex flex-col justify-between min-w-0">
                          <Calendar
                            size={16}
                            aria-hidden="true"
                            className="text-amber-600 dark:text-overdrive-yellow mb-3"
                          />
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-overdrive-yellow mb-1">
                              Expense Date
                            </p>
                            <p className="text-sm font-mono tabular-nums font-bold text-amber-900 dark:text-amber-300 truncate">
                              {formatDate(data.expense_date)}
                            </p>
                          </div>
                        </section>
                      </div>

                      {/* Line Items Breakdown */}
                      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <FileText
                              size={14}
                              aria-hidden="true"
                              className="text-amber-500 dark:text-overdrive-yellow"
                            />
                            <span>Verified Line Items</span>
                          </h3>
                        </div>
                        <div className="p-5 sm:p-6 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {Array.isArray(data.line_items) &&
                          data.line_items.length > 0 ? (
                            data.line_items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center gap-3 text-xs p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800"
                              >
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="font-bold text-slate-900 dark:text-white uppercase truncate"
                                    title={item.description}
                                  >
                                    {item.description}
                                  </p>
                                  <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                    {item.quantity}x @ ₱
                                    {formatCurrency(item.unit_price)}
                                  </p>
                                </div>
                                <span className="font-black font-mono tabular-nums text-slate-900 dark:text-white shrink-0">
                                  ₱{formatCurrency(item.total_price)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-xs text-slate-500 dark:text-slate-400 italic py-2">
                              No individual line items parsed.
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Financial Posting Summary */}
                      <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800 dark:border-white/10">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-overdrive-yellow mb-4 border-b border-white/10 pb-3 flex items-center gap-1.5">
                          <Calculator size={14} aria-hidden="true" />
                          <span>Financial Statement Impact</span>
                        </h3>
                        <div className="space-y-3 mb-5 text-xs sm:text-sm font-medium text-slate-400">
                          <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl gap-3">
                            <span>Net Subtotal</span>
                            <span className="font-bold text-slate-200 font-mono tabular-nums">
                              ₱{formatCurrency(data.subtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl gap-3">
                            <span>Input VAT Allocation</span>
                            <span className="font-bold text-slate-200 font-mono tabular-nums">
                              ₱{formatCurrency(data.vat_amount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 sm:pt-5 border-t border-slate-800 gap-3">
                          <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                            Grand Total
                          </span>
                          <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-overdrive-yellow tracking-tight font-mono tabular-nums">
                            ₱{formatCurrency(data.grand_total)}
                          </span>
                        </div>
                      </section>

                      {/* Staff Justification / Notes */}
                      {staffNotes && (
                        <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                            <FileText
                              size={14}
                              aria-hidden="true"
                              className="text-amber-500 dark:text-overdrive-yellow"
                            />
                            <span>Staff Justification</span>
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed break-words">
                            "{staffNotes}"
                          </p>
                        </section>
                      )}

                      {/* Human Verification Trace */}
                      <section className="p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col shadow-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                          <ClipboardList
                            size={14}
                            aria-hidden="true"
                            className="text-amber-500 dark:text-overdrive-yellow"
                          />
                          <span>Human Verification Trace</span>
                        </h3>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest mb-1.5 text-slate-800 dark:text-slate-200">
                            VERIFIED BY {data.verified_by_first || "Staff"}{" "}
                            {data.verified_by_last || ""}
                          </p>
                          <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            On {formatDate(data.verification_date, true)}
                          </p>
                        </div>
                      </section>

                      {/* Manager Resolution Area */}
                      {data.expense_status === "PENDING_APPROVAL" ? (
                        <section className="p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border flex items-center gap-3 shadow-xs bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300">
                          <Clock
                            size={20}
                            aria-hidden="true"
                            className="shrink-0"
                          />
                          <div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">
                              Manager Review
                            </h3>
                            <p className="text-xs font-bold leading-relaxed">
                              Pending Approval Process
                            </p>
                          </div>
                        </section>
                      ) : (
                        <section
                          className={`p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col shadow-xs ${
                            data.expense_status === "APPROVED"
                              ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20"
                              : "bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20"
                          }`}
                        >
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                            {data.expense_status === "APPROVED" ? (
                              <CheckCircle2
                                size={14}
                                aria-hidden="true"
                                className="text-emerald-500"
                              />
                            ) : (
                              <XCircle
                                size={14}
                                aria-hidden="true"
                                className="text-rose-500"
                              />
                            )}
                            <span>Manager Resolution</span>
                          </h3>
                          <div>
                            <p
                              className={`text-xs font-black uppercase tracking-widest mb-1.5 ${
                                data.expense_status === "APPROVED"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {data.expense_status
                                ? data.expense_status.replace(/_/g, " ")
                                : "RESOLVED"}{" "}
                              BY {data.resolved_by_name || "Manager"}
                            </p>
                            <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest">
                              On{" "}
                              {formatDate(
                                data.resolved_at || data.updated_at,
                                true,
                              )}
                            </p>
                            <div className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs leading-relaxed break-words">
                              "
                              {managerNotes ||
                                "No additional remarks provided."}
                              "
                            </div>
                          </div>
                        </section>
                      )}
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
