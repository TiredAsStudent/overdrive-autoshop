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
  X,
  ArrowRight,
  Store,
  Calendar,
  Receipt as ReceiptIcon,
  Calculator,
  Trash2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { receiptService } from "../../services/staff/receipt.service";

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
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    if (numScore >= 60)
      return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20";
  };

  const parsedData = scanResult?.extracted_data
    ? typeof scanResult.extracted_data === "string"
      ? JSON.parse(scanResult.extracted_data)
      : scanResult.extracted_data
    : null;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full max-w-[1600px] mx-auto">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <ScanLine className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Receipt Scanner
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Intelligent Document Processing (OCR)
            </p>
          </div>
        </div>
      </div>

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
                className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={12} /> Discard
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
                    className={`h-full w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all cursor-pointer ${
                      isDragging
                        ? "border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 scale-[0.99]"
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
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 shadow-sm">
                      <UploadCloud
                        size={32}
                        className="text-slate-400 dark:text-slate-500"
                      />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
                      Upload Supplier Receipt
                    </h3>
                    <p className="text-xs font-medium text-slate-500 text-center max-w-[250px]">
                      Drag and drop your file here, or click to browse.
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                        JPEG / PNG
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                        PDF
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
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
                  {file.type === "application/pdf" ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full"
                      title="PDF Preview"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Receipt Preview"
                      className="max-w-full max-h-full object-contain p-2"
                    />
                  )}

                  {/* Processing Overlay inside Image */}
                  {status === "PROCESSING" && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-white">
                      <Loader2
                        size={40}
                        className="animate-spin text-amber-500 mb-4"
                      />
                      <div className="h-1 w-32 bg-slate-700 rounded-full overflow-hidden mb-3">
                        <motion.div
                          className="h-full bg-amber-500"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2.5, repeat: Infinity }}
                        />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        Executing AI Extraction Engine...
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

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-800/30">
            {status === "IDLE" && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-4">
                <ScanLine size={48} className="text-slate-400 mb-4" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">
                  Awaiting Document
                </h3>
                <p className="text-xs font-medium text-slate-400 max-w-xs leading-relaxed">
                  Upload a physical or digital supplier receipt to automatically
                  extract vendor data and financial totals.
                </p>
              </div>
            )}

            {status === "PROCESSING" && (
              <div className="h-full flex flex-col items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mb-6"
                />
                <div className="space-y-4 w-full max-w-xs">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Document Accepted
                    </span>
                  </div>
                  <div className="flex items-center gap-3 opacity-70">
                    <Loader2
                      size={16}
                      className="text-amber-500 animate-spin"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Parsing Unstructured Text
                    </span>
                  </div>
                  <div className="flex items-center gap-3 opacity-30">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Structuring Financial Data
                    </span>
                  </div>
                </div>
              </div>
            )}

            {status === "ERROR" && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="p-4 bg-red-100 dark:bg-red-500/20 rounded-full mb-4">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-2">
                  Extraction Failed
                </h3>
                <p className="text-xs font-medium text-red-500/80 max-w-xs">
                  The document was unreadable or corrupted. Please discard and
                  try a clearer image.
                </p>
              </div>
            )}

            {status === "SUCCESS" && parsedData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Confidence Badge */}
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${getConfidenceBadge(scanResult.confidence_score)}`}
                >
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">
                      AI Confidence Score
                    </p>
                    <p className="text-sm font-black tracking-widest">
                      {scanResult.confidence_score}%
                    </p>
                  </div>
                  {parseFloat(scanResult.confidence_score) < 60 && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase bg-red-500/20 px-2 py-1 rounded">
                      <AlertCircle size={12} /> Low Accuracy
                    </div>
                  )}
                </div>

                {/* Staged Data Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-blue-500">
                      <Store size={14} />{" "}
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Vendor Identity
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {parsedData.vendor_name || "Not Found"}
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-indigo-500">
                      <ReceiptIcon size={14} />{" "}
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Receipt Ref
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {parsedData.receipt_number || "Not Found"}
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-emerald-500">
                      <Calendar size={14} />{" "}
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Transaction Date
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {parsedData.receipt_date || "Not Found"}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 dark:bg-black border border-slate-800 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-2 text-amber-500">
                      <Calculator size={14} />{" "}
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        Financial Total
                      </span>
                    </div>
                    <p className="text-lg font-black text-white">
                      {parsedData.grand_total
                        ? `₱${parseFloat(parsedData.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "Not Found"}
                    </p>
                    {/* Faded accent pattern */}
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <Calculator size={64} className="text-amber-500" />
                    </div>
                  </div>
                </div>

                {/* Line Items Preview Summary */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                    Line Items Detected
                  </h3>
                  {parsedData.items && parsedData.items.length > 0 ? (
                    <ul className="space-y-2">
                      {parsedData.items.slice(0, 3).map((item, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          <span className="truncate pr-4">
                            {item.quantity}x {item.description}
                          </span>
                          <span className="font-bold whitespace-nowrap">
                            ₱
                            {parseFloat(item.total_price || 0).toLocaleString()}
                          </span>
                        </li>
                      ))}
                      {parsedData.items.length > 3 && (
                        <li className="text-[10px] text-slate-400 italic pt-1">
                          ...and {parsedData.items.length - 3} more items.
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No line items were clearly extracted.
                    </p>
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
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 disabled:shadow-none flex justify-center items-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
            >
              Proceed to Verification <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptScanner;
