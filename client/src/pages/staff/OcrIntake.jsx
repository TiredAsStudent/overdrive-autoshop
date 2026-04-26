import React, { useState, useEffect } from "react";
import staffOcrService from "../../services/staffOcr.service";
import { useAuth } from "../../context/AuthContext";
import {
  Camera,
  Upload,
  Cpu,
  Edit3,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { OcrReviewer } from "../../features/staff/components/OcrReviewer";

const OcrIntake = () => {
  const { user } = useAuth(); // Pull real user for branch data
  const [step, setStep] = useState("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [method, setMethod] = useState("ai");

  const [categories, setCategories] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [vatRate, setVatRate] = useState(12);

  // --- INITIALIZATION & SESSION PERSISTENCE ---
  useEffect(() => {
    // 1. Check for abandoned session on refresh
    const savedSession = sessionStorage.getItem("ocrSession");
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      setAiAnalysis(parsed.aiAnalysis);
      setMethod(parsed.method);
      setStep("review");
    }

    const loadData = async () => {
      try {
        const [catData, settingsData] = await Promise.all([
          staffOcrService.getAccountCategories(),
          staffOcrService.getSystemSettings(),
        ]);
        setCategories(catData);
        setVatRate(parseFloat(settingsData.vat_percentage) || 12);
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    loadData();

    // 2. Fetch Accounting Categories
    const fetchCategories = async () => {
      try {
        const data = await staffOcrService.getAccountCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, []);

  // --- HANDLERS ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Fixed: Added image/jfif to the allowed MIME types
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/jfif",
      "image/png",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (method === "ai") {
        // Full OCR Engine processing
        const result = await staffOcrService.analyzeReceipt(file);
        setAiAnalysis(result);
        sessionStorage.setItem(
          "ocrSession",
          JSON.stringify({ aiAnalysis: result, method }),
        );
      } else {
        // Manual Fallback: Just preview the local blob
        const localUrl = URL.createObjectURL(file);
        setAiAnalysis({
          images: { original: localUrl },
          aiSuccess: false,
          extractedData: {},
        });
      }
      setStep("review");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    // Ghost file cleanup if a real image path exists
    if (
      aiAnalysis?.images?.original &&
      !aiAnalysis.images.original.startsWith("blob")
    ) {
      await staffOcrService.cancelUpload(aiAnalysis.images.original);
    }

    sessionStorage.removeItem("ocrSession");
    setAiAnalysis(null);
    setError("");
    setStep("upload");
  };

  const handleSubmit = async (finalData) => {
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...finalData,
        total_amount: parseFloat(finalData.total_amount || 0),
        tax_amount: parseFloat(finalData.tax_amount || 0),
        account_category_id: parseInt(finalData.account_category_id),
        originalImage: aiAnalysis.images.original,
        fileHash: aiAnalysis.fileHash,
        aiData: aiAnalysis.extractedData, // Critical for Research Metric Logging!
        items: finalData.items.map((item) => ({
          ...item,
          quantity: parseFloat(item.quantity || 1),
          unit_cost: parseFloat(item.unit_cost || 0),
          total_price: parseFloat(item.total_price || 0),
        })),
      };

      await staffOcrService.submitReceipt(payload);

      sessionStorage.removeItem("ocrSession");
      setSuccessMsg("Receipt successfully submitted for Manager Approval!");
      setStep("upload");
      setAiAnalysis(null);
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER UPLOAD VIEW ---
  if (step === "upload") {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 animate-in fade-in duration-500 space-y-6">
        {/* NEW HEADER - Copied from Check-In Tab */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/5 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-black italic text-slate-900 dark:text-white uppercase tracking-tight">
              Receipt Digitization Hub
            </h1>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-200 text-sm font-bold shadow-sm">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-2 border border-emerald-200 text-sm font-bold shadow-sm">
            <CheckCircle size={20} /> {successMsg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setMethod("ai")}
            className={`flex-1 p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-3 shadow-sm ${
              method === "ai"
                ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                : "border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            <Cpu size={28} />
            <div className="text-center">
              <p className="font-black uppercase tracking-widest text-sm">
                OCR Engine
              </p>
              <p className="text-[10px] font-bold opacity-70 mt-1">
                Applies Binarization Filter
              </p>
            </div>
          </button>

          <button
            onClick={() => setMethod("manual")}
            className={`flex-1 p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-3 shadow-sm ${
              method === "manual"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                : "border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
            }`}
          >
            <Edit3 size={28} />
            <div className="text-center">
              <p className="font-black uppercase tracking-widest text-sm">
                Manual Fallback
              </p>
              <p className="text-[10px] font-bold opacity-70 mt-1">
                For handwritten/torn receipts
              </p>
            </div>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[40px] p-8 sm:p-12 text-center space-y-6 relative overflow-hidden transition-colors shadow-lg">
          {loading && (
            <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-500/30 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                <Cpu
                  size={24}
                  className="absolute inset-0 m-auto text-amber-500 animate-pulse"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  Executing Pre-Processing
                </p>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  Grayscale Conversion & Extraction Active...
                </p>
              </div>
            </div>
          )}

          <div
            className={`h-24 w-24 rounded-[32px] flex items-center justify-center mx-auto transition-colors shadow-inner border border-white/50 dark:border-transparent ${
              method === "ai"
                ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
            }`}
          >
            <Camera size={40} />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Capture Physical Evidence
            </h3>
          </div>

          <label
            className={`w-full py-5 text-white font-black uppercase tracking-widest text-xs rounded-2xl cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 ${
              method === "ai"
                ? "bg-slate-900 dark:bg-white dark:text-slate-900"
                : "bg-blue-600 dark:bg-blue-500"
            }`}
          >
            <Upload size={18} /> Select Image
            <input
              type="file"
              className="hidden"
              accept="image/jpeg, image/png, image/webp, image/jfif"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </label>
        </div>
      </div>
    );
  }

  // --- RENDER REVIEW VIEW ---
  return (
    <div className="max-w-[1600px] mx-auto px-4">
      <OcrReviewer
        image={aiAnalysis?.images?.processed || aiAnalysis?.images?.original}
        method={method}
        user={user}
        aiAnalysis={aiAnalysis}
        categories={categories}
        vatRate={vatRate}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default OcrIntake;
