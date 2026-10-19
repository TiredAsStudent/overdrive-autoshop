import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ScanLine,
  Calendar,
  Building2,
  Loader2,
  Store,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ImageOff,
  Calculator,
  FileText,
  BadgeCheck,
  ClipboardList,
} from "lucide-react";
import { receiptApprovalService } from "../../../services/manager/receiptApproval.service";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useApp } from "../../../context/AppContext";
import api from "../../../services/api";

const getAttachmentUrl = (path) => {
  if (!path) return "";
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

const ReceiptApprovalDrawer = ({ isOpen, onClose, receiptId, onSuccess }) => {
  const { showToast } = useApp();

  // Accessible IDs
  const drawerTitleId = useId();
  const remarksTextareaId = useId();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(null);
  const [validationError, setValidationError] = useState("");

  // Document Viewer States
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close drawer on Escape key when not submitting
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && receiptId) {
      setLoading(true);
      setError("");
      setRemarks("");
      setValidationError("");
      setImageError(false);
      setZoom(1);
      setRotation(0);
      setSubmittingDecision(null);

      receiptApprovalService
        .getReceiptDetails(receiptId)
        .then((res) => {
          if (isMounted) setReceipt(res.data);
        })
        .catch((err) => {
          if (isMounted) {
            setError(
              err.message || "Unable to retrieve OCR receipt session details.",
            );
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setReceipt(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, receiptId]);

  const handleDecision = async (decision) => {
    if (!receipt || isSubmitting) return;
    setValidationError("");

    const trimmedRemarks = remarks.trim();
    if (decision === "REJECTED" && trimmedRemarks.length < 5) {
      setValidationError(
        "Rejection requires a detailed reason (minimum 5 characters).",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmittingDecision(decision);
    try {
      if (decision === "APPROVED") {
        await receiptApprovalService.approveReceipt(receipt.id, trimmedRemarks);
        showToast("OCR Receipt Approved successfully.", "success");
      } else {
        await receiptApprovalService.rejectReceipt(receipt.id, trimmedRemarks);
        showToast("OCR Receipt Rejected.", "success");
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setValidationError(
        err.message || "Failed to process OCR receipt decision.",
      );
    } finally {
      setIsSubmitting(false);
      setSubmittingDecision(null);
    }
  };

  const getBadgeVariant = (status) => {
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "danger";
    if (status === "PENDING_APPROVAL") return "warning";
    return "default";
  };

  const getConfidenceVariant = (score) => {
    const num = parseFloat(score || 0);
    if (num >= 85) return "success";
    if (num >= 60) return "warning";
    return "danger";
  };

  const getConfidenceBannerClasses = (score) => {
    const num = parseFloat(score || 0);
    if (num >= 85)
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    if (num >= 60)
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const isPdf = Boolean(receipt?.file_path?.toLowerCase().endsWith(".pdf"));
  const fileUrl = getAttachmentUrl(receipt?.file_path);

  const staffNotes = receipt?.notes
    ? receipt.notes.split("\n\n[Manager")[0].trim()
    : "";
  const managerNotes =
    receipt?.status === "REJECTED"
      ? receipt.rejection_remarks
      : receipt?.notes?.includes("[Manager Approval Notes]:")
        ? receipt.notes.split("[Manager Approval Notes]:")[1]?.trim()
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
            onClick={() => !isSubmitting && onClose?.()}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-pointer z-40"
            aria-hidden="true"
          />

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
            className="relative h-full h-dvh w-full lg:w-[900px] xl:w-[1100px] bg-slate-50 dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <header className="flex justify-between items-start px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-xs gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div
                  aria-hidden="true"
                  className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-overdrive-yellow shrink-0"
                >
                  <ScanLine size={24} />
                </div>
                <div className="min-w-0">
                  <h2
                    id={drawerTitleId}
                    className="text-lg sm:text-xl font-black font-mono tabular-nums italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[300px]"
                  >
                    {loading
                      ? "Loading..."
                      : receipt?.expense_number || "OCR Receipt"}
                  </h2>
                  {receipt && (
                    <div className="flex flex-col items-start gap-1.5 mt-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          label={(receipt.status || "").replace(/_/g, " ")}
                          variant={getBadgeVariant(receipt.status)}
                        />
                        <StatusBadge
                          label={`AI Accuracy: ${receipt.confidence_score ?? 0}%`}
                          variant={getConfidenceVariant(
                            receipt.confidence_score,
                          )}
                          className="font-mono tabular-nums"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <BadgeCheck
                            size={12}
                            aria-hidden="true"
                            className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                          />
                          <span>Drafted by:</span>
                          <span className="text-slate-700 dark:text-slate-300 truncate">
                            {receipt.created_by_name || "System"}
                          </span>
                        </span>
                        <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Calendar
                            size={12}
                            aria-hidden="true"
                            className="text-slate-400 shrink-0"
                          />
                          <span>Submitted:</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {formatDateTime(receipt.created_at)}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2.5 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                aria-label="Close receipt approval drawer"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            {/* Content Body: Split Workspace */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row bg-slate-50/50 dark:bg-transparent">
              {loading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="w-full h-full flex flex-col items-center justify-center py-20 text-slate-400 opacity-80"
                >
                  <Loader2
                    aria-hidden="true"
                    className="w-8 h-8 animate-spin mb-3 text-amber-500"
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Retrieving OCR Session & Source Image...
                  </p>
                </div>
              )}

              {error && !loading && (
                <div className="w-full p-6 sm:p-8 flex items-start justify-center">
                  <div
                    role="alert"
                    className="form-error-banner w-full max-w-lg"
                  >
                    <AlertCircle
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 mt-0.5"
                    />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {receipt && !loading && (
                <>
                  {/* LEFT PANE: Source Document View */}
                  <div className="w-full lg:w-1/2 h-[260px] sm:h-[320px] lg:h-full shrink-0 bg-slate-100 dark:bg-[#0B1120] relative flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
                    {/* Viewer Toolbar */}
                    <div className="p-3 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
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
                          title="Zoom Out"
                          aria-label="Zoom out receipt image"
                        >
                          <ZoomOut size={14} aria-hidden="true" />
                        </button>
                        <span className="text-[10px] font-mono tabular-nums font-black w-10 text-center text-slate-700 dark:text-slate-300">
                          {Math.round(zoom * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                          disabled={isPdf}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-overdrive-yellow rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Zoom In"
                          aria-label="Zoom in receipt image"
                        >
                          <ZoomIn size={14} aria-hidden="true" />
                        </button>
                        <div
                          aria-hidden="true"
                          className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-1"
                        />
                        <button
                          type="button"
                          onClick={() => setRotation((r) => r + 90)}
                          disabled={isPdf}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-overdrive-yellow rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Rotate"
                          aria-label="Rotate receipt image 90 degrees"
                        >
                          <RotateCw size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Image Preview Canvas */}
                    <div
                      className={`flex-1 min-h-0 overflow-auto custom-scrollbar flex items-center justify-center p-4 ${
                        isDesktop && !isPdf ? "cursor-move" : "cursor-auto"
                      }`}
                    >
                      {isPdf ? (
                        <div className="w-full h-full relative group bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                          <iframe
                            src={fileUrl}
                            className="w-full h-full rounded-xl shadow-md bg-white"
                            title="PDF Receipt Scan"
                          />
                          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl hover:bg-amber-500 hover:text-slate-900 transition-colors"
                            >
                              <FileText size={14} aria-hidden="true" />
                              <span>Open PDF in New Tab</span>
                            </a>
                          </div>
                        </div>
                      ) : imageError || !fileUrl ? (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                          <ImageOff
                            size={36}
                            aria-hidden="true"
                            className="opacity-40 mb-2"
                          />
                          <p className="text-[10px] font-black uppercase tracking-widest">
                            Physical File Unavailable
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
                          alt={`Physical receipt scan for ${receipt.expense_number}`}
                          onError={() => setImageError(true)}
                          className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                        />
                      )}
                    </div>
                  </div>

                  {/* RIGHT PANE: Extracted Data & Approval Workspace */}
                  <div className="w-full lg:w-1/2 flex flex-col flex-1 min-h-0 bg-slate-50 dark:bg-slate-900">
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8">
                      {validationError && (
                        <div role="alert" className="form-error-banner">
                          <AlertCircle
                            size={18}
                            aria-hidden="true"
                            className="shrink-0 mt-0.5"
                          />
                          <span>{validationError}</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                            <CheckCircle2
                              size={16}
                              aria-hidden="true"
                              className="text-blue-500"
                            />
                            <span>Data Validation</span>
                          </h3>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                            Review AI outputs and accounting categories.
                          </p>
                        </div>

                        {/* Confidence Banner */}
                        <div
                          className={`px-5 py-2.5 rounded-2xl border flex items-center gap-4 shadow-2xs transition-all ${getConfidenceBannerClasses(
                            receipt.confidence_score,
                          )}`}
                        >
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5">
                              AI Confidence
                            </p>
                            <p className="text-base font-mono tabular-nums font-black tracking-tight leading-none">
                              {receipt.confidence_score ?? 0}%
                            </p>
                          </div>
                          {parseFloat(receipt.confidence_score || 0) < 60 && (
                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase bg-rose-500/10 px-2 py-1.5 rounded-lg border border-rose-500/20">
                              <AlertCircle size={14} aria-hidden="true" />
                              <span>Low Accuracy</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vendor & General Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <section className="p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                          <Store
                            size={16}
                            aria-hidden="true"
                            className="text-slate-400 mb-3"
                          />
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                              Category & Vendor
                            </p>
                            <p
                              className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase"
                              title={receipt.category}
                            >
                              {receipt.category}
                            </p>
                            <p
                              className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5"
                              title={
                                receipt.vendor_name ||
                                receipt.vendor_name_db ||
                                "Unregistered Vendor"
                              }
                            >
                              {receipt.vendor_name ||
                                receipt.vendor_name_db ||
                                "Unregistered Vendor"}
                            </p>
                          </div>
                        </section>

                        <section className="p-5 sm:p-6 bg-amber-50 dark:bg-amber-500/5 rounded-[20px] sm:rounded-[24px] border border-amber-200/80 dark:border-amber-500/20 shadow-xs flex flex-col justify-between">
                          <Calendar
                            size={16}
                            aria-hidden="true"
                            className="text-amber-500 mb-3"
                          />
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow mb-1">
                              Expense Date
                            </p>
                            <p className="text-sm font-mono tabular-nums font-bold text-amber-900 dark:text-amber-400 truncate">
                              {formatDate(receipt.expense_date)}
                            </p>
                            <p className="text-[10px] text-amber-700/80 dark:text-amber-500/80 flex items-center gap-1 font-medium truncate mt-0.5">
                              <Building2
                                size={10}
                                aria-hidden="true"
                                className="shrink-0"
                              />
                              <span className="truncate">
                                {receipt.branch_name}
                              </span>
                            </p>
                          </div>
                        </section>
                      </div>

                      {/* Operational Details */}
                      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Transaction Details
                          </h3>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4">
                          <div className="flex justify-between items-center text-xs gap-4">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              Payment Method
                            </span>
                            <span className="font-black text-slate-900 dark:text-white uppercase">
                              {(receipt.payment_method || "").replace(
                                /_/g,
                                " ",
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-700/50 pt-3 gap-4">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              Reference No.
                            </span>
                            <span className="font-mono tabular-nums font-black text-slate-900 dark:text-white">
                              {receipt.reference_number || "N/A"}
                            </span>
                          </div>
                        </div>
                      </section>

                      {/* Line Items Breakdown */}
                      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] sm:rounded-[24px] shadow-xs flex flex-col overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Calculator size={14} aria-hidden="true" />
                            <span>Verified Line Items</span>
                          </h3>
                        </div>
                        <div className="p-5 sm:p-6 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {Array.isArray(receipt.line_items) &&
                          receipt.line_items.length > 0 ? (
                            receipt.line_items.map((item, idx) => (
                              <div
                                key={item.id || `${item.description}-${idx}`}
                                className="flex justify-between items-center text-xs p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50"
                              >
                                <div className="min-w-0 flex-1 pr-3">
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
                            <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 italic">
                              No individual line items parsed.
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Financial Posting Summary */}
                      <section className="bg-slate-900 dark:bg-black rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 text-white shadow-xl border border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-overdrive-yellow mb-4 border-b border-white/10 pb-3 flex items-center gap-1.5">
                          <Calculator size={14} aria-hidden="true" />
                          <span>Financial Statement Impact</span>
                        </p>
                        <div className="space-y-3 mb-5 text-sm font-medium text-slate-400">
                          <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                            <span>Net Subtotal</span>
                            <span className="font-bold text-slate-200 font-mono tabular-nums">
                              ₱{formatCurrency(receipt.subtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-800/60 dark:bg-slate-900 p-3 sm:p-4 rounded-xl">
                            <span>
                              Input VAT{" "}
                              {receipt.is_vatable ? "(Inclusive)" : "(Exempt)"}
                            </span>
                            <span className="font-bold text-slate-200 font-mono tabular-nums">
                              ₱{formatCurrency(receipt.vat_amount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 sm:pt-5 border-t border-slate-700/50">
                          <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-300">
                            Grand Total
                          </span>
                          <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-overdrive-yellow tracking-tight font-mono tabular-nums">
                            ₱{formatCurrency(receipt.total_amount)}
                          </span>
                        </div>
                      </section>

                      {/* Staff Notes */}
                      {staffNotes && (
                        <section className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                            <ClipboardList
                              size={14}
                              aria-hidden="true"
                              className="text-amber-500 dark:text-overdrive-yellow"
                            />
                            <span>Staff Justification</span>
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                            "{staffNotes}"
                          </p>
                        </section>
                      )}

                      {/* Manager Resolution / Remarks Area */}
                      {receipt.status === "PENDING_APPROVAL" ? (
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-200 dark:border-slate-700 flex flex-col">
                          <label
                            htmlFor={remarksTextareaId}
                            className="form-label flex flex-wrap items-center gap-2 mb-3"
                          >
                            <MessageSquare size={14} aria-hidden="true" />
                            <span>Manager Remarks</span>
                            <span className="text-red-500 lowercase">
                              (Required for Rejection)
                            </span>
                          </label>
                          <textarea
                            id={remarksTextareaId}
                            value={remarks}
                            onChange={(e) => {
                              setRemarks(e.target.value);
                              if (validationError) setValidationError("");
                            }}
                            placeholder="Provide feedback or justification..."
                            rows={4}
                            disabled={isSubmitting}
                            className="form-textarea min-h-[100px] resize-none font-medium"
                          />
                        </div>
                      ) : (
                        <section
                          className={`p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border flex flex-col shadow-xs ${
                            receipt.status === "APPROVED"
                              ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20"
                              : "bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20"
                          }`}
                        >
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                            <CheckCircle2
                              size={14}
                              aria-hidden="true"
                              className={
                                receipt.status === "APPROVED"
                                  ? "text-emerald-500"
                                  : "text-rose-500"
                              }
                            />
                            <span>Manager Resolution</span>
                          </p>
                          <div>
                            <p
                              className={`text-xs font-black uppercase tracking-widest mb-1.5 ${
                                receipt.status === "APPROVED"
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-rose-700 dark:text-rose-400"
                              }`}
                            >
                              {(receipt.status || "").replace(/_/g, " ")} BY{" "}
                              {receipt.resolved_by_name ||
                                receipt.created_by_name}
                            </p>
                            <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest">
                              On{" "}
                              {formatDateTime(
                                receipt.resolved_at ||
                                  receipt.updated_at ||
                                  receipt.processed_at,
                              )}
                            </p>
                            <div className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs leading-relaxed">
                              "
                              {managerNotes ||
                                "No additional remarks provided."}
                              "
                            </div>
                          </div>
                        </section>
                      )}
                    </div>

                    {/* FIXED ACTION FOOTER (Only for Pending) */}
                    {receipt.status === "PENDING_APPROVAL" && (
                      <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 shrink-0">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => handleDecision("REJECTED")}
                            disabled={isSubmitting}
                            className="flex-1 py-3.5 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-300 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-2xs disabled:opacity-50 cursor-pointer"
                          >
                            {submittingDecision === "REJECTED" ? (
                              <Loader2
                                size={16}
                                aria-hidden="true"
                                className="animate-spin"
                              />
                            ) : (
                              <XCircle size={16} aria-hidden="true" />
                            )}
                            <span>Reject Request</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecision("APPROVED")}
                            disabled={isSubmitting}
                            className="flex-[1.5] py-3.5 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                          >
                            {submittingDecision === "APPROVED" ? (
                              <Loader2
                                size={16}
                                aria-hidden="true"
                                className="animate-spin"
                              />
                            ) : (
                              <CheckCircle2 size={16} aria-hidden="true" />
                            )}
                            <span>Approve Receipt & Post</span>
                          </button>
                        </div>
                      </div>
                    )}
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

export default ReceiptApprovalDrawer;
