import React, { useState, useRef, useEffect, useMemo, useId } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileText,
  ScanLine,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  ArrowRight,
  Store,
  ReceiptText,
  Calendar,
  Calculator,
  FileDigit,
  ImageOff,
  RotateCcw,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { receiptService } from "../../services/staff/receipt.service";
import PageHeader from "../../components/shared/PageHeader";
import api from "../../services/api";

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const ReceiptScanner = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const fileInputId = useId();

  // States
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Processing States: IDLE, PROCESSING, SUCCESS, ERROR
  const [status, setStatus] = useState("IDLE");
  const [scanResult, setScanResult] = useState(null);

  // Cleanup ObjectURLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith("http")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Standardized URL parser to resolve server uploads reliably
  const getAttachmentUrl = (filePath) => {
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

  // --- Drag & Drop Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    if (status === "IDLE" || status === "ERROR") {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (status !== "IDLE" && status !== "ERROR") return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFileSelection(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFileSelection(selectedFile);
  };

  // --- File Validation & Processing ---
  const processFileSelection = async (selectedFile) => {
    // Validate Size (10MB Limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      showToast(
        "File exceeds 10MB limit. Please upload a smaller file.",
        "error",
      );
      return;
    }

    // Validate Type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!validTypes.includes(selectedFile.type)) {
      showToast(
        "Invalid format. Only JPEG, PNG, WEBP, and PDF are allowed.",
        "error",
      );
      return;
    }

    if (previewUrl && !previewUrl.startsWith("http")) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageError(false);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));

    // Automatically trigger the scan
    executeScan(selectedFile);
  };

  const executeScan = async (fileToScan) => {
    setStatus("PROCESSING");
    setScanResult(null);

    try {
      const response = await receiptService.uploadAndScan(fileToScan);
      setScanResult(response.data);
      setStatus("SUCCESS");
      showToast(
        response.message || "Receipt scanned and analyzed successfully.",
        "success",
      );
    } catch (error) {
      setStatus("ERROR");
      showToast(
        error.message || "Unable to extract data from receipt.",
        "error",
      );
    }
  };

  // --- Actions ---
  const handleCancel = async () => {
    if (scanResult && scanResult.id) {
      try {
        await receiptService.cancelScan(scanResult.id);
        showToast("Scan session discarded.", "info");
      } catch (error) {
        console.error("Failed to cancel on server:", error);
      }
    }

    if (previewUrl && !previewUrl.startsWith("http")) {
      URL.revokeObjectURL(previewUrl);
    }

    // Reset UI State
    setFile(null);
    setPreviewUrl(null);
    setImageError(false);
    setScanResult(null);
    setStatus("IDLE");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProceed = () => {
    if (!scanResult?.id) return;
    navigate(`/staff/receipts/verification/${scanResult.id}`);
  };

  // --- UI Helpers ---
  const getConfidenceBadge = (score) => {
    const numScore = parseFloat(score) || 0;
    if (numScore >= 85)
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shadow-xs";
    if (numScore >= 60)
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 shadow-xs";
    return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 shadow-xs";
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parsedData = useMemo(() => {
    if (!scanResult?.extracted_data) return null;
    if (typeof scanResult.extracted_data === "string") {
      try {
        return JSON.parse(scanResult.extracted_data);
      } catch (err) {
        console.error("Failed to parse extracted OCR data:", err);
        return null;
      }
    }
    return scanResult.extracted_data;
  }, [scanResult]);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Receipt Scanner"
        subtitle="Intelligent Document Processing (OCR)"
        icon={ScanLine}
      />

      {/* DUAL PANE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-[600px]">
        {/* LEFT PANE: DOCUMENT VIEWER / DROPZONE */}
        <section
          aria-label="Source Document Upload and Preview"
          className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col overflow-hidden h-[60vh] min-h-[440px] lg:h-[750px]"
        >
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 gap-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText
                size={16}
                aria-hidden="true"
                className="text-amber-500 dark:text-overdrive-yellow"
              />
              <span>Source Document</span>
            </h2>
            {file && status !== "PROCESSING" && (
              <button
                type="button"
                onClick={handleCancel}
                className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-700 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-rose-200/60 dark:border-rose-500/20 cursor-pointer active:scale-95"
              >
                <Trash2 size={12} aria-hidden="true" />
                <span>Discard File</span>
              </button>
            )}
          </div>

          <div className="flex-1 relative p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/60 overflow-hidden">
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full w-full"
                >
                  <label
                    htmlFor={fileInputId}
                    role="button"
                    tabIndex={0}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`group h-full w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all cursor-pointer ${
                      isDragging
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 scale-[0.99]"
                        : "border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 hover:border-amber-400 dark:hover:border-amber-500/50 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    <input
                      id={fileInputId}
                      type="file"
                      ref={fileInputRef}
                      className="sr-only"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileSelect}
                    />
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 shadow-2xs group-hover:scale-110 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-all duration-300">
                      <UploadCloud
                        size={36}
                        aria-hidden="true"
                        className="text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-overdrive-yellow transition-colors"
                      />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2 text-center transition-colors group-hover:text-amber-600 dark:group-hover:text-overdrive-yellow">
                      Upload Supplier Receipt
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center max-w-[260px] leading-relaxed">
                      Drag and drop your file here, or click to browse securely.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
                      <span className="text-[10px] font-mono tabular-nums font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-600">
                        JPEG / PNG / WEBP
                      </span>
                      <span className="text-[10px] font-mono tabular-nums font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-600">
                        PDF
                      </span>
                      <span className="text-[10px] font-mono tabular-nums font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-600">
                        MAX 10MB
                      </span>
                    </div>
                  </label>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full w-full flex items-center justify-center bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-inner"
                >
                  {/* File Metadata Overlay */}
                  <div className="absolute top-4 left-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-xs flex items-center gap-3 max-w-[calc(100%-2rem)]">
                    <div
                      aria-hidden="true"
                      className="p-1.5 bg-blue-50 dark:bg-blue-500/15 border border-blue-200/60 dark:border-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400 shrink-0"
                    >
                      <FileDigit size={16} />
                    </div>
                    <div className="flex flex-col min-w-0 max-w-[160px] sm:max-w-[220px]">
                      <span
                        className="text-[10px] font-bold text-slate-900 dark:text-white truncate"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      <span className="text-[9px] font-mono tabular-nums font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  </div>

                  {scanResult?.file_path &&
                  scanResult.mime_type === "application/pdf" ? (
                    <iframe
                      src={getAttachmentUrl(scanResult.file_path)}
                      className="w-full h-full"
                      title="Scanned PDF Document Preview"
                    />
                  ) : file.type === "application/pdf" ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full"
                      title="Selected PDF Document Preview"
                    />
                  ) : imageError ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                      <ImageOff
                        size={40}
                        aria-hidden="true"
                        className="mb-3 opacity-50"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Receipt Preview Unavailable
                      </span>
                    </div>
                  ) : (
                    <img
                      src={
                        scanResult?.file_path
                          ? getAttachmentUrl(scanResult.file_path)
                          : previewUrl
                      }
                      alt="Uploaded supplier receipt preview"
                      onError={() => setImageError(true)}
                      className="max-w-full max-h-full object-contain p-4 transition-transform duration-500"
                    />
                  )}

                  {/* Processing Overlay inside Preview */}
                  {status === "PROCESSING" && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center z-30 text-white transition-all p-6 text-center"
                    >
                      <Loader2
                        size={44}
                        aria-hidden="true"
                        className="animate-spin text-amber-500 mb-5"
                      />
                      <div
                        aria-hidden="true"
                        className="h-1.5 w-40 bg-slate-800 rounded-full overflow-hidden mb-4 border border-slate-700"
                      >
                        <motion.div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">
                        Executing AI Engine...
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* RIGHT PANE: EXTRACTION RESULTS */}
        <section
          aria-label="AI OCR Diagnostic Results"
          className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col overflow-hidden h-[60vh] min-h-[440px] lg:h-[750px]"
        >
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <ScanLine
                size={16}
                aria-hidden="true"
                className="text-blue-600 dark:text-blue-400"
              />
              <span>AI Diagnostic Results</span>
            </h2>
          </div>

          <div className="flex-1 p-5 sm:p-6 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-800/30 relative">
            {status === "IDLE" && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="p-5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 rounded-full mb-4">
                  <ScanLine
                    size={40}
                    aria-hidden="true"
                    className="text-slate-400 dark:text-slate-500 opacity-60"
                  />
                </div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 mb-2">
                  Awaiting Document
                </h3>
                <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  Upload a physical or digital supplier receipt to automatically
                  extract vendor data, dates, and financial totals.
                </p>
              </div>
            )}

            {status === "PROCESSING" && (
              <div
                role="status"
                aria-live="polite"
                className="h-full flex flex-col items-center justify-center"
              >
                <div
                  aria-hidden="true"
                  className="w-16 h-16 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mb-8 shadow-lg shadow-amber-500/20"
                />
                <div className="space-y-4 w-full max-w-xs bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center gap-3">
                    <CheckCircle
                      size={18}
                      aria-hidden="true"
                      className="text-emerald-500 shrink-0"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                      Document Accepted
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Loader2
                      size={18}
                      aria-hidden="true"
                      className="text-amber-500 animate-spin shrink-0"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow">
                      Parsing Unstructured Text
                    </span>
                  </div>
                  <div className="flex items-center gap-3 opacity-45">
                    <div
                      aria-hidden="true"
                      className="w-4.5 h-4.5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Structuring Financial Data
                    </span>
                  </div>
                </div>
              </div>
            )}

            {status === "ERROR" && (
              <div
                role="alert"
                className="h-full flex flex-col items-center justify-center text-center px-4"
              >
                <div className="p-5 bg-rose-100 dark:bg-rose-500/20 rounded-full mb-5 shadow-inner">
                  <AlertCircle
                    size={40}
                    aria-hidden="true"
                    className="text-rose-600 dark:text-rose-400"
                  />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2">
                  Extraction Failed
                </h3>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed mb-6">
                  The document was unreadable or could not be processed. Please
                  discard the file and try uploading a clearer receipt.
                </p>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  <span>Try Another Document</span>
                </button>
              </div>
            )}

            {status === "SUCCESS" && parsedData && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Confidence Badge */}
                <div
                  className={`p-5 rounded-[20px] border flex items-center justify-between gap-3 ${getConfidenceBadge(scanResult.confidence_score)}`}
                >
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1">
                      AI Confidence Score
                    </p>
                    <p className="text-lg sm:text-xl font-mono tabular-nums font-black tracking-tight">
                      {scanResult.confidence_score}%
                    </p>
                  </div>
                  {parseFloat(scanResult.confidence_score) < 60 && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase bg-rose-500/15 px-2.5 py-1.5 rounded-lg border border-rose-500/20">
                      <AlertCircle size={14} aria-hidden="true" />
                      <span>Low Accuracy</span>
                    </div>
                  )}
                </div>

                {/* Staged Data Preview */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[20px] shadow-xs min-w-0">
                    <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                      <Store size={16} aria-hidden="true" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Vendor Identity
                      </span>
                    </div>
                    <p
                      className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate uppercase"
                      title={parsedData.vendor_name || "Not Found"}
                    >
                      {parsedData.vendor_name || "Not Found"}
                    </p>
                  </div>

                  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[20px] shadow-xs min-w-0">
                    <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400">
                      <ReceiptText size={16} aria-hidden="true" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Receipt Ref
                      </span>
                    </div>
                    <p
                      className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate uppercase font-mono tabular-nums"
                      title={parsedData.receipt_number || "Not Found"}
                    >
                      {parsedData.receipt_number || "Not Found"}
                    </p>
                  </div>

                  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[20px] shadow-xs min-w-0">
                    <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400">
                      <Calendar size={16} aria-hidden="true" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Transaction Date
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white truncate">
                      {parsedData.receipt_date || "Not Found"}
                    </p>
                  </div>

                  <div className="p-5 bg-slate-900 dark:bg-black rounded-[20px] shadow-lg relative overflow-hidden border border-amber-500/30 min-w-0">
                    <div className="flex items-center gap-2 mb-2 text-amber-500 dark:text-overdrive-yellow relative z-10">
                      <Calculator size={16} aria-hidden="true" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Financial Total
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-white relative z-10 font-mono tabular-nums tracking-tight mt-1 truncate">
                      {parsedData.grand_total
                        ? `₱${formatCurrency(parsedData.grand_total)}`
                        : "Not Found"}
                    </p>
                    <div
                      aria-hidden="true"
                      className="absolute -right-4 -bottom-4 opacity-[0.07] pointer-events-none"
                    >
                      <ScanLine size={80} className="text-amber-500" />
                    </div>
                  </div>
                </div>

                {/* Line Items Preview Summary */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[20px] p-5 shadow-xs">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    Line Items Detected ({parsedData.items?.length || 0})
                  </h3>
                  {parsedData.items && parsedData.items.length > 0 ? (
                    <ul className="space-y-2.5">
                      {parsedData.items.slice(0, 3).map((item, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800"
                        >
                          <span className="truncate flex-1">
                            <span className="font-mono tabular-nums text-amber-600 dark:text-overdrive-yellow font-black mr-1.5">
                              {item.quantity}x
                            </span>
                            {item.description}
                          </span>
                          <span className="font-black whitespace-nowrap font-mono tabular-nums text-slate-900 dark:text-white shrink-0">
                            ₱{formatCurrency(item.total_price)}
                          </span>
                        </li>
                      ))}
                      {parsedData.items.length > 3 && (
                        <li className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-center pt-2">
                          + {parsedData.items.length - 3} Additional Lines
                        </li>
                      )}
                    </ul>
                  ) : (
                    <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                        No line items automatically extracted.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Action Button */}
          <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 shrink-0">
            <button
              type="button"
              onClick={handleProceed}
              disabled={status !== "SUCCESS"}
              className={`w-full py-4 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer ${
                status === "SUCCESS"
                  ? "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-900/60 dark:text-slate-600 cursor-not-allowed"
              }`}
            >
              <span>Proceed to Verification</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReceiptScanner;
