import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { receiptService } from "../../services/staff/receipt.service";
import PageHeader from "../../components/shared/PageHeader";
import api from "../../services/api";

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const ReceiptScanner = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // States
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Processing States: IDLE, UPLOADING, PROCESSING, SUCCESS, ERROR
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

  // Reliable URL parser to prevent missing slashes and sanitize backslashes
  const getAttachmentUrl = (path) => {
    if (!path) return null;
    let baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace("/api/v1", "")
      : import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
        "http://localhost:5000";

    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const normalizedPath = cleanPath.replace(/\\/g, "/");

    return `${baseUrl}/${normalizedPath}`;
  };

  // --- Drag & Drop Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (status !== "IDLE" && status !== "ERROR") return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFileSelection(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
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
      showToast(response.message, "success");
    } catch (error) {
      setStatus("ERROR");
      showToast(error.message, "error");
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

    // Reset UI State
    setFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setStatus("IDLE");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProceed = () => {
    if (!scanResult) return;
    // Route to verification page, passing the scan ID
    navigate(`/staff/receipts/verification/${scanResult.id}`);
  };

  // --- UI Helpers ---
  const getConfidenceBadge = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 85)
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 shadow-sm shadow-emerald-500/10";
    if (numScore >= 60)
      return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 shadow-sm shadow-amber-500/10";
    return "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 shadow-sm shadow-rose-500/10";
  };

  const parsedData = scanResult?.extracted_data
    ? typeof scanResult.extracted_data === "string"
      ? JSON.parse(scanResult.extracted_data)
      : scanResult.extracted_data
    : null;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full max-w-[1600px] mx-auto">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Receipt Scanner"
        subtitle="Intelligent Document Processing (OCR)"
        icon={ScanLine}
      />

      {/* DUAL PANE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-[600px]">
        {/* LEFT PANE: DOCUMENT VIEWER / DROPZONE */}
        <div className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col overflow-hidden h-[60vh] lg:h-[750px]">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText size={16} className="text-amber-500" /> Source Document
            </h2>
            {file && (
              <button
                onClick={handleCancel}
                className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-700 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 cursor-pointer"
              >
                <Trash2 size={12} /> Discard File
              </button>
            )}
          </div>

          <div className="flex-1 relative p-4 sm:p-6 bg-slate-50/30 dark:bg-[#0B1120]">
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
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`group h-full w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all cursor-pointer ${
                      isDragging
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 scale-[0.99]"
                        : "border-slate-300 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500/50 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={handleFileSelect}
                    />
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 shadow-sm group-hover:scale-110 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-all duration-300">
                      <UploadCloud
                        size={36}
                        className="text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors"
                      />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2 transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      Upload Supplier Receipt
                    </h3>
                    <p className="text-xs font-medium text-slate-500 text-center max-w-[250px]">
                      Drag and drop your file here, or click to browse securely.
                    </p>
                    <div className="mt-8 flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600">
                        JPEG / PNG
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600">
                        PDF
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600">
                        MAX 10MB
                      </span>
                    </div>
                  </label>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full w-full flex items-center justify-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-inner"
                >
                  {/* File Metadata Overlay */}
                  <div className="absolute top-4 left-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-sm flex items-center gap-3">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
                      <FileDigit size={16} />
                    </div>
                    <div className="flex flex-col max-w-[150px] sm:max-w-[200px]">
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate">
                        {file.name}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  </div>

                  {scanResult?.file_path &&
                  scanResult.mime_type === "application/pdf" ? (
                    <iframe
                      src={getAttachmentUrl(scanResult.file_path)}
                      className="w-full h-full"
                      title="PDF Preview"
                    />
                  ) : file.type === "application/pdf" ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full"
                      title="PDF Preview"
                    />
                  ) : scanResult?.file_path ? (
                    <img
                      src={getAttachmentUrl(scanResult.file_path)}
                      alt="Receipt Preview"
                      className="max-w-full max-h-full object-contain p-4 transition-transform duration-500"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Receipt Preview"
                      className="max-w-full max-h-full object-contain p-4 transition-transform duration-500"
                    />
                  )}

                  {/* Processing Overlay inside Image */}
                  {status === "PROCESSING" && (
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md flex flex-col items-center justify-center z-30 text-white transition-all">
                      <Loader2
                        size={48}
                        className="animate-spin text-amber-500 mb-5 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                      />
                      <div className="h-1.5 w-40 bg-slate-800 rounded-full overflow-hidden mb-4 border border-slate-700 shadow-inner">
                        <motion.div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: 3,
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
        </div>

        {/* RIGHT PANE: EXTRACTION RESULTS */}
        <div className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col overflow-hidden h-[60vh] lg:h-[750px]">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <ScanLine size={16} className="text-blue-500" /> AI Diagnostic
              Results
            </h2>
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-800/30 relative">
            {status === "IDLE" && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-4">
                <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                  <ScanLine size={48} className="text-slate-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">
                  Awaiting Document
                </h3>
                <p className="text-[11px] font-medium text-slate-400 max-w-xs leading-relaxed">
                  Upload a physical or digital supplier receipt to automatically
                  extract vendor data, dates, and financial totals.
                </p>
              </div>
            )}

            {status === "PROCESSING" && (
              <div className="h-full flex flex-col items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 rounded-full border-[6px] border-amber-500 border-t-transparent animate-spin mb-8 shadow-lg shadow-amber-500/20"
                />
                <div className="space-y-5 w-full max-w-xs bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle
                      size={18}
                      className="text-emerald-500 shrink-0"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                      Document Accepted
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Loader2
                      size={18}
                      className="text-amber-500 animate-spin shrink-0"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      Parsing Unstructured Text
                    </span>
                  </div>
                  <div className="flex items-center gap-3 opacity-40">
                    <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Structuring Financial Data
                    </span>
                  </div>
                </div>
              </div>
            )}

            {status === "ERROR" && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="p-5 bg-rose-100 dark:bg-rose-500/20 rounded-full mb-5 shadow-inner">
                  <AlertCircle size={40} className="text-rose-500" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2">
                  Extraction Failed
                </h3>
                <p className="text-xs font-medium text-rose-500/80 max-w-xs leading-relaxed">
                  The document was unreadable or corrupted. Please discard the
                  file and try uploading a clearer image.
                </p>
              </div>
            )}

            {status === "SUCCESS" && parsedData && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                {/* Confidence Badge */}
                <div
                  className={`p-5 rounded-[20px] border flex items-center justify-between ${getConfidenceBadge(scanResult.confidence_score)}`}
                >
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1">
                      AI Confidence Score
                    </p>
                    <p className="text-lg font-black tracking-tight">
                      {scanResult.confidence_score}%
                    </p>
                  </div>
                  {parseFloat(scanResult.confidence_score) < 60 && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase bg-rose-500/20 px-2.5 py-1.5 rounded-lg border border-rose-500/20">
                      <AlertCircle size={14} /> Low Accuracy
                    </div>
                  )}
                </div>

                {/* Staged Data Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm transition-transform hover:-translate-y-1 duration-300">
                    <div className="flex items-center gap-2 mb-3 text-blue-500">
                      <Store size={16} />{" "}
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Vendor Identity
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase">
                      {parsedData.vendor_name || "Not Found"}
                    </p>
                  </div>

                  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm transition-transform hover:-translate-y-1 duration-300">
                    <div className="flex items-center gap-2 mb-3 text-indigo-500">
                      <ReceiptText size={16} />{" "}
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Receipt Ref
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase font-mono">
                      {parsedData.receipt_number || "Not Found"}
                    </p>
                  </div>

                  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm transition-transform hover:-translate-y-1 duration-300">
                    <div className="flex items-center gap-2 mb-3 text-emerald-500">
                      <Calendar size={16} />{" "}
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Transaction Date
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {parsedData.receipt_date || "Not Found"}
                    </p>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-slate-900 to-black dark:from-black dark:to-slate-900 rounded-2xl shadow-lg relative overflow-hidden ring-1 ring-amber-500/30 transition-transform hover:-translate-y-1 duration-300">
                    <div className="flex items-center gap-2 mb-2 text-amber-500 relative z-10">
                      <Calculator size={16} />{" "}
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        Financial Total
                      </span>
                    </div>
                    <p className="text-2xl font-black text-white relative z-10 font-mono tracking-tight mt-1">
                      {parsedData.grand_total
                        ? `₱${parseFloat(parsedData.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "Not Found"}
                    </p>
                    {/* Faded accent pattern */}
                    <div className="absolute -right-4 -bottom-4 opacity-[0.07] pointer-events-none">
                      <ScanLine size={80} className="text-amber-500" />
                    </div>
                  </div>
                </div>

                {/* Line Items Preview Summary */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    Line Items Detected ({parsedData.items?.length || 0})
                  </h3>
                  {parsedData.items && parsedData.items.length > 0 ? (
                    <ul className="space-y-2.5">
                      {parsedData.items.slice(0, 3).map((item, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800"
                        >
                          <span className="truncate pr-4 flex-1">
                            <span className="text-amber-600 dark:text-amber-500 font-black mr-1.5">
                              {item.quantity}x
                            </span>
                            {item.description}
                          </span>
                          <span className="font-black whitespace-nowrap font-mono">
                            ₱
                            {parseFloat(item.total_price || 0).toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2 },
                            )}
                          </span>
                        </li>
                      ))}
                      {parsedData.items.length > 3 && (
                        <li className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center pt-2">
                          + {parsedData.items.length - 3} Additional Lines
                        </li>
                      )}
                    </ul>
                  ) : (
                    <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        No line items automatically extracted.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Action Button */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800">
            <button
              onClick={handleProceed}
              disabled={status !== "SUCCESS"}
              className={`w-full py-4 font-black rounded-xl text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer ${
                status === "SUCCESS"
                  ? "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/30 active:scale-[0.98]"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
              }`}
            >
              Proceed to Verification <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptScanner;
