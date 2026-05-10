import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Camera,
  Loader2,
  FileText,
  AlertTriangle,
  Save,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle,
  Calculator,
} from "lucide-react";
import { staffExpenseService } from "../../services/staff/expense.service";

// Helper for highlighting low confidence AI fields
const getConfidenceBorder = (score) => {
  if (!score) return "border-slate-200 dark:border-white/10";
  if (score < 0.7) return "border-red-400 ring-1 ring-red-400";
  if (score < 0.85) return "border-amber-400 ring-1 ring-amber-400";
  return "border-emerald-400 dark:border-emerald-500/50";
};

const ReceiptScanning = () => {
  const [step, setStep] = useState("upload");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);

  const [suppliers, setSuppliers] = useState([]);
  const [vatRate, setVatRate] = useState(12); // Dynamic VAT State

  const [formData, setFormData] = useState({
    supplier_id: "",
    transaction_date: new Date().toISOString().split("T")[0],
    total_amount: "",
    vat_amount: "",
    base_amount: "",
    apply_standard_vat: false,
    confidence_score: 1.0,
    receipt_image_url: "",
  });

  // Load suppliers and dynamic VAT on mount
  useEffect(() => {
    const initData = async () => {
      const [supRes, vatRes] = await Promise.all([
        staffExpenseService.getSuppliers(),
        staffExpenseService.getSystemVat(),
      ]);
      setSuppliers(supRes.data || []);
      setVatRate(parseFloat(vatRes) || 12);
    };
    initData();
  }, []);

  // --- Dynamic VAT Calculation Effect ---
  useEffect(() => {
    const total = parseFloat(formData.total_amount) || 0;
    const decimalVat = vatRate / 100;

    if (formData.apply_standard_vat && total > 0) {
      const calculatedVat = (total / (1 + decimalVat)) * decimalVat;
      const calculatedBase = total - calculatedVat;
      setFormData((prev) => ({
        ...prev,
        vat_amount: calculatedVat.toFixed(2),
        base_amount: calculatedBase.toFixed(2),
      }));
    } else if (!formData.apply_standard_vat && total > 0) {
      const userVat = parseFloat(formData.vat_amount) || 0;
      setFormData((prev) => ({
        ...prev,
        base_amount: Math.max(0, total - userVat).toFixed(2),
      }));
    }
  }, [
    formData.total_amount,
    formData.apply_standard_vat,
    formData.vat_amount,
    vatRate,
  ]);

  // --- Handlers ---
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 8 * 1024 * 1024) {
      return alert(
        "File size exceeds 8MB limit. Please upload a smaller image.",
      );
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setSuccessMessage("");
    setStep("processing");

    try {
      const res = await staffExpenseService.scanReceipt(selectedFile);
      const { image_url, extracted_data } = res.data;

      setScanResult({ image_url, extracted_data });

      if (extracted_data) {
        const matchedSupplier = suppliers.find((s) =>
          s.supplier_name
            .toLowerCase()
            .includes(extracted_data.vendor_name?.toLowerCase()),
        );

        setFormData({
          supplier_id: matchedSupplier ? matchedSupplier.id : "",
          transaction_date:
            extracted_data.transaction_date ||
            new Date().toISOString().split("T")[0],
          total_amount: extracted_data.total_amount || "",
          vat_amount: extracted_data.vat_amount || "",
          base_amount: "", // Handled by useEffect
          apply_standard_vat: false,
          confidence_score: extracted_data.confidence_score || 1.0,
          receipt_image_url: image_url,
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          receipt_image_url: image_url,
          confidence_score: 1.0,
        }));
      }
    } catch (error) {
      alert("AI Processing Failed: " + error.message);
    } finally {
      setStep("verify");
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.receipt_image_url) return alert("Receipt image is missing.");
    if (parseFloat(formData.total_amount) <= 0)
      return alert("Total amount must be greater than zero.");

    setIsSubmitting(true);
    try {
      await staffExpenseService.submitExpense({
        ...formData,
        supplier_id: formData.supplier_id
          ? parseInt(formData.supplier_id, 10)
          : null,
        total_amount: parseFloat(formData.total_amount) || 0,
        vat_amount: parseFloat(formData.vat_amount) || 0,
      });

      setSuccessMessage("Expense successfully submitted to Manager Queue!");

      setTimeout(() => {
        resetScanner();
      }, 2500);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const resetScanner = () => {
    setStep("upload");
    setFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setSuccessMessage("");
    setFormData({
      supplier_id: "",
      transaction_date: new Date().toISOString().split("T")[0],
      total_amount: "",
      vat_amount: "",
      base_amount: "",
      apply_standard_vat: false,
      confidence_score: 1.0,
      receipt_image_url: "",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
            <Camera
              className="text-indigo-600 dark:text-indigo-400"
              size={28}
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
              Receipt Scanner
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              AI-Powered Expense Entry & Payroll Logging
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm"
        >
          <CheckCircle size={20} /> {successMessage}
        </motion.div>
      )}

      {/* STAGE 1: UPLOAD ZONE */}
      {step === "upload" && !successMessage && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-8 shadow-sm transition-all hover:shadow-md">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          <div
            onClick={triggerFileInput}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-12 sm:p-24 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all group"
          >
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UploadCloud
                size={32}
                className="text-slate-400 group-hover:text-indigo-500 transition-colors"
              />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
              Snap or Upload Receipt
            </h3>
            <p className="text-sm font-medium text-slate-500 max-w-md">
              Ensure lighting is good and all numbers are visible. Gemini AI
              will automatically extract the data.
            </p>
            <button className="mt-8 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-colors">
              Open Camera / Gallery
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: PROCESSING OVERLAY */}
      {step === "processing" && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-12 flex flex-col items-center justify-center text-center h-[50vh] shadow-sm">
          <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-500/20 animate-pulse"></div>
            <Loader2
              size={40}
              className="text-indigo-600 dark:text-indigo-400 animate-spin relative z-10"
            />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
            Gemini AI is analyzing...
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Extracting vendor details, dates, and applying tax logic.
          </p>
        </div>
      )}

      {/* STAGE 3: SPLIT-SCREEN VERIFICATION */}
      {step === "verify" && !successMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[800px] lg:max-h-[80vh]"
        >
          {/* Left Pane: Evidence Viewer */}
          <div className="w-full lg:w-1/2 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-xl relative flex flex-col min-h-[400px]">
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
              <ImageIcon size={14} className="text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                Evidence Viewer
              </span>
            </div>

            <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
              <img
                src={previewUrl}
                alt="Uploaded Receipt"
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            </div>

            <div className="p-4 bg-black/40 backdrop-blur-md flex justify-center border-t border-white/10">
              <button
                type="button"
                onClick={resetScanner}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <RefreshCw size={14} /> Discard & Rescan
              </button>
            </div>
          </div>

          {/* Right Pane: Data Verification Form */}
          <div className="w-full lg:w-1/2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-xl flex flex-col h-full overflow-hidden">
            <div className="mb-6 pb-6 border-b border-slate-100 dark:border-white/5 shrink-0">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
                <FileText className="text-indigo-500" size={24} />
                Verify Extracted Data
              </h2>
              {formData.confidence_score < 0.85 && (
                <div className="mt-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3.5 rounded-xl flex items-start gap-3">
                  <AlertTriangle
                    className="text-amber-500 shrink-0 mt-0.5"
                    size={18}
                  />
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                    <strong>AI Verification Required:</strong> Some fields were
                    unreadable. Please check the highlighted inputs manually
                    before submitting.
                  </p>
                </div>
              )}
            </div>

            <form
              id="submissionForm"
              onSubmit={handleSubmit}
              className="space-y-5 flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar"
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Supplier / Vendor Match
                  </label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleFormChange}
                    className={`w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${getConfidenceBorder(formData.confidence_score)}`}
                  >
                    <option value="">
                      -- Manual Entry / Payroll Logging --
                    </option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.supplier_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    name="transaction_date"
                    required
                    value={formData.transaction_date}
                    onChange={handleFormChange}
                    className={`w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl px-4 py-3 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${getConfidenceBorder(formData.confidence_score)}`}
                  />
                </div>
              </div>

              {/* Financial Block */}
              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10 pb-2">
                  Financial Extraction
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-2">
                      Total Amount Paid (₱)
                    </label>
                    <input
                      type="number"
                      name="total_amount"
                      required
                      step="0.01"
                      min="0.01"
                      value={formData.total_amount}
                      onChange={handleFormChange}
                      placeholder="0.00"
                      className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-4 py-4 text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm ${getConfidenceBorder(formData.confidence_score)}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500 mb-2">
                      Input VAT ({vatRate}%) Optional
                    </label>
                    <input
                      type="number"
                      name="vat_amount"
                      step="0.01"
                      min="0"
                      value={formData.vat_amount}
                      onChange={handleFormChange}
                      disabled={formData.apply_standard_vat}
                      placeholder="0.00"
                      className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-sm font-mono text-blue-600 dark:text-blue-400 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all ${getConfidenceBorder(formData.confidence_score)}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Base Amount (₱)
                    </label>
                    <div className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-sm font-mono text-slate-500 flex items-center min-h-[38px]">
                      {formData.base_amount || "0.00"}
                    </div>
                  </div>
                </div>

                {/* Dynamic Automation Toggle */}
                <label className="flex items-center gap-3 cursor-pointer pt-3 mt-3 border-t border-slate-200 dark:border-white/10">
                  <input
                    type="checkbox"
                    name="apply_standard_vat"
                    checked={formData.apply_standard_vat}
                    onChange={handleFormChange}
                    className="w-5 h-5 accent-indigo-500 rounded bg-slate-100 border-slate-300"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calculator size={14} className="text-indigo-500" /> Apply{" "}
                      {vatRate}% Auto-VAT
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                      Check if VAT is inclusive but unreadable on receipt.
                    </p>
                  </div>
                </label>
              </div>
            </form>

            {/* Footer Action */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 shrink-0">
              <button
                type="submit"
                form="submissionForm"
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Send to Manager Queue
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ReceiptScanning;
