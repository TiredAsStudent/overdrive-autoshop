import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ScanLine,
  Calendar,
  Building2,
  User,
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
} from "lucide-react";
import { receiptApprovalService } from "../../../services/manager/receiptApproval.service";
import { useApp } from "../../../context/AppContext";
import api from "../../../services/api";

const ReceiptApprovalDrawer = ({ isOpen, onClose, receiptId, onSuccess }) => {
  const { showToast } = useApp();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Document Viewer States
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen && receiptId) {
      setLoading(true);
      setError("");
      setRemarks("");
      setValidationError("");
      setImageError(false);
      setZoom(1);
      setRotation(0);

      receiptApprovalService
        .getReceiptDetails(receiptId)
        .then((res) => setReceipt(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setReceipt(null);
    }
  }, [isOpen, receiptId]);

  const handleDecision = async (decision) => {
    setValidationError("");
    if (decision === "REJECTED" && remarks.trim().length < 5) {
      setValidationError(
        "Rejection requires a detailed reason (minimum 5 characters).",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (decision === "APPROVED") {
        await receiptApprovalService.approveReceipt(receipt.id, remarks);
        showToast("OCR Receipt Approved successfully.", "success");
      } else {
        await receiptApprovalService.rejectReceipt(receipt.id, remarks);
        showToast("OCR Receipt Rejected.", "success");
      }
      onSuccess();
      onClose();
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
      case "APPROVED":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "REJECTED":
        return "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
      default:
        return "text-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20";
    }
  };

  const getConfidenceBadge = (score) => {
    const num = parseFloat(score || 0);
    if (num >= 85)
      return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    if (num >= 60)
      return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    return "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
  };

  const getBaseUrl = () => {
    if (api.defaults.baseURL) {
      return api.defaults.baseURL.replace("/api/v1", "");
    }
    return import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace("/api/v1", "")
      : "http://localhost:5000";
  };

  const isPdf = receipt?.file_path?.toLowerCase().endsWith(".pdf");
  const fileUrl = receipt?.file_path
    ? `${getBaseUrl()}${receipt.file_path}`
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
            className="fixed inset-y-0 right-0 w-full lg:w-[900px] xl:w-[1100px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                  <ScanLine size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-[350px]">
                    {receipt?.expense_number || "Loading..."}
                  </h2>
                  {receipt && (
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(
                          receipt.status,
                        )}`}
                      >
                        {receipt.status.replace("_", " ")}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getConfidenceBadge(
                          receipt.confidence_score,
                        )}`}
                      >
                        AI Accuracy: {receipt.confidence_score}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 -mr-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body: Split Workspace */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {loading && (
                <div className="w-full h-full flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Retrieving OCR Session & Source Image...
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

              {receipt && !loading && (
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
                          className="p-1.5 text-slate-500 hover:text-amber-500 rounded transition-colors cursor-pointer"
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
                          className="p-1.5 text-slate-500 hover:text-amber-500 rounded transition-colors cursor-pointer"
                          title="Zoom In"
                        >
                          <ZoomIn size={14} />
                        </button>
                        <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-1" />
                        <button
                          type="button"
                          onClick={() => setRotation((r) => r + 90)}
                          className="p-1.5 text-slate-500 hover:text-amber-500 rounded transition-colors cursor-pointer"
                          title="Rotate"
                        >
                          <RotateCw size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Image Preview Canvas */}
                    <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center p-4">
                      {isPdf ? (
                        <iframe
                          src={fileUrl}
                          className="w-full h-full rounded-xl shadow-md bg-white"
                          title="PDF Receipt Scan"
                        />
                      ) : imageError ? (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                          <ImageOff size={36} className="opacity-40 mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-widest">
                            Physical File Unavailable
                          </p>
                        </div>
                      ) : (
                        <motion.img
                          animate={{ scale: zoom, rotate: rotation }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                          src={fileUrl}
                          alt="Physical Receipt Scan"
                          onError={() => setImageError(true)}
                          className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                        />
                      )}
                    </div>
                  </div>

                  {/* RIGHT PANE: Extracted Data & Approval Workspace */}
                  <div className="w-full lg:w-1/2 flex flex-col h-full overflow-y-auto custom-scrollbar p-6 space-y-6 bg-white dark:bg-slate-900">
                    {validationError && (
                      <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-xl flex items-start gap-3 text-xs font-bold">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{validationError}</span>
                      </div>
                    )}

                    {/* Manager Feedback (if already decided) */}
                    {managerNotes && receipt.status !== "PENDING_APPROVAL" && (
                      <div
                        className={`p-4 rounded-2xl border flex items-start gap-3 ${
                          receipt.status === "REJECTED"
                            ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-800 dark:text-rose-300"
                            : "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                        }`}
                      >
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">
                            Manager Decision Remarks
                          </p>
                          <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap">
                            {managerNotes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Vendor & General Info */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          <Store size={14} className="text-amber-500" /> Vendor
                          Information
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          Ref: {receipt.reference_number || "N/A"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                          {receipt.vendor_name ||
                            receipt.vendor_name_db ||
                            "Unregistered Vendor"}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />{" "}
                            {new Date(
                              receipt.expense_date,
                            ).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 size={12} className="text-slate-400" />{" "}
                            {receipt.branch_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={12} className="text-slate-400" /> By{" "}
                            {receipt.created_by_name || "Staff"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Line Items Breakdown */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 px-1">
                        <Calculator size={12} className="text-amber-500" />{" "}
                        Verified Itemized Line Items
                      </h3>
                      <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {Array.isArray(receipt.line_items) &&
                        receipt.line_items.length > 0 ? (
                          receipt.line_items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 flex justify-between items-center text-xs"
                            >
                              <div className="min-w-0 flex-1 pr-3">
                                <p className="font-bold text-slate-900 dark:text-white uppercase truncate">
                                  {item.description}
                                </p>
                                <p className="text-[9px] font-bold text-slate-500 mt-0.5">
                                  {item.quantity}x @ ₱
                                  {parseFloat(
                                    item.unit_price || 0,
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
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
                          <div className="p-4 text-center text-xs text-slate-400 italic">
                            No individual line items parsed.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Posting Summary */}
                    <div className="bg-slate-900 dark:bg-black rounded-2xl p-5 text-white shadow-xl space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 border-b border-slate-800 pb-2 mb-3">
                        Financial Statement Impact
                      </p>
                      <div className="flex justify-between text-xs font-medium text-slate-400">
                        <span>Net Subtotal</span>
                        <span className="font-mono">
                          ₱
                          {parseFloat(receipt.subtotal || 0).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-slate-400">
                        <span>
                          Input VAT{" "}
                          {receipt.is_vatable ? "(Inclusive)" : "(Exempt)"}
                        </span>
                        <span className="font-mono">
                          ₱
                          {parseFloat(receipt.vat_amount || 0).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-white">
                          Grand Total
                        </span>
                        <span className="text-xl font-black font-mono text-amber-500">
                          ₱
                          {parseFloat(receipt.total_amount || 0).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Remarks Input Area (Only if PENDING_APPROVAL) */}
                    {receipt.status === "PENDING_APPROVAL" && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          <MessageSquare size={14} /> Manager Remarks (Required
                          for Rejection)
                        </label>
                        <textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Provide approval justification or reason for rejection..."
                          rows="3"
                          disabled={isSubmitting}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none disabled:opacity-50"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    {receipt.status === "PENDING_APPROVAL" && (
                      <div className="pt-2 flex flex-col sm:flex-row gap-3 mt-auto">
                        <button
                          type="button"
                          onClick={() => handleDecision("REJECTED")}
                          disabled={isSubmitting}
                          className="flex-1 py-3.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <XCircle size={16} />
                          )}
                          Reject Request
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecision("APPROVED")}
                          disabled={isSubmitting}
                          className="flex-[2] py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Approve Receipt & Post
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReceiptApprovalDrawer;
