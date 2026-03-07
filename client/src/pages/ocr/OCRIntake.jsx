import { useState, useRef } from "react";
import {
  UploadCloud,
  CheckCircle,
  RefreshCw,
  FileText,
  Tag,
  DollarSign,
  Building,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const OCRIntake = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Holds the data returned by the AI Brain
  const [extractedData, setExtractedData] = useState(null);

  // Form state for staff verification
  const [formData, setFormData] = useState({
    vendor_name: "",
    unit_cost: "",
    suggested_markup_price: "",
    chart_of_account: "",
  });

  const fileInputRef = useRef(null);

  // --- 1. DRAG AND DROP HANDLERS ---
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      handleFileSelection(droppedFile);
    } else {
      toast.error("Please upload a valid image file (JPG, PNG).");
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) handleFileSelection(selectedFile);
  };

  const handleFileSelection = (selectedFile) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setExtractedData(null); // Reset previous scans
  };

  // --- 2. UPLOAD TO AI BRAIN ---
  const handleScan = async () => {
    if (!file) return;

    setIsScanning(true);
    const toastId = toast.loading("AI is reading the receipt...");

    const uploadData = new FormData();
    uploadData.append("receipt", file); // Must match backend upload.single("receipt")

    try {
      // Axios handles the multipart/form-data headers automatically when using FormData
      const response = await api.post("/ocr/scan", uploadData);

      const { vendor_name, unit_cost, suggested_markup_price } =
        response.data.extractedData;

      setExtractedData(response.data.extractedData);

      // Pre-fill the verification form with AI data
      setFormData({
        vendor_name: vendor_name,
        unit_cost: unit_cost || 0,
        suggested_markup_price: suggested_markup_price || 0,
        chart_of_account: "", // Staff must select this manually
      });

      toast.success("Scan complete! Please verify the data.", { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || "OCR Scanning failed.", {
        id: toastId,
      });
    } finally {
      setIsScanning(false);
    }
  };

  // --- 3. FINAL VERIFICATION & SAVE ---
  const handleVerifyChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConfirmSave = async (e) => {
    e.preventDefault();

    if (!formData.chart_of_account) {
      toast.error("Please select a Chart of Accounts category.");
      return;
    }

    const toastId = toast.loading("Saving to accounting...");

    // In a full 100% build, this would hit an /api/accounting or /api/inventory route.
    // For the 30% mark, we simulate the successful data lock-in.
    setTimeout(() => {
      toast.success("Receipt verified and saved to ledger!", { id: toastId });
      handleReset();
    }, 1000);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Sleek Header */}
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-4 mb-6">
        <div className="bg-yellow-100 p-2.5 rounded-xl">
          <FileText className="text-yellow-600" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase text-zinc-900 tracking-tight">
            OCR Intake
          </h1>
        </div>
      </div>

      {/* STAGE 1: Drag and Drop Upload */}
      {!extractedData && (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 md:p-12 transition-all">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all ${
              file
                ? "border-yellow-400 bg-yellow-50/50"
                : "border-zinc-300 hover:border-zinc-400 bg-zinc-50"
            }`}
          >
            {previewUrl ? (
              <div className="space-y-6 flex flex-col items-center">
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  className="h-48 md:h-64 object-contain rounded-lg shadow-md border border-zinc-200"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-bold text-zinc-600 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    Remove File
                  </button>
                  <button
                    onClick={handleScan}
                    disabled={isScanning}
                    className="px-6 py-2 text-sm font-bold text-zinc-900 bg-yellow-400 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm"
                  >
                    {isScanning ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <UploadCloud size={18} />
                    )}
                    {isScanning ? "Scanning via AI..." : "Process Receipt"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white p-4 rounded-full shadow-sm border border-zinc-100 mb-4">
                  <UploadCloud className="text-zinc-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-zinc-800">
                  Upload Shop Receipt
                </h3>
                <p className="text-sm text-zinc-500 mb-6 mt-1 max-w-sm">
                  Drag and drop a clear image of the supplier receipt, or click
                  to browse your files.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-6 py-2.5 text-sm font-bold text-zinc-900 bg-yellow-400 rounded-lg hover:bg-yellow-500 transition-colors shadow-sm"
                >
                  Browse Files
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* STAGE 2: Side-by-Side Verification UI */}
      {extractedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Image Viewer */}
          <div className="bg-zinc-900 rounded-2xl p-4 lg:p-6 shadow-lg border border-zinc-800 flex flex-col h-125 lg:h-150 sticky top-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Source Document
              </span>
              <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                Pre-Processed by Sharp
              </span>
            </div>
            <div className="flex-1 bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center border border-zinc-800">
              <img
                src={previewUrl}
                alt="Receipt Preview"
                className="max-w-full max-h-full object-contain p-2"
              />
            </div>
          </div>

          {/* Right Column: Verification Form */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-200">
            <div className="flex items-start gap-3 mb-6 pb-4 border-b border-zinc-100">
              <CheckCircle
                className="text-yellow-500 shrink-0 mt-0.5"
                size={24}
              />
              <div>
                <h2 className="text-lg font-black text-zinc-900 tracking-tight">
                  Verify Extracted Data
                </h2>
                <p className="text-sm text-zinc-500 font-medium leading-snug">
                  Please review the extracted values and assign an accounting
                  category before saving.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmSave} className="space-y-5">
              {/* Vendor Name */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 mb-1.5 uppercase">
                  <Building size={14} /> Supplier / Vendor Name
                </label>
                <input
                  type="text"
                  name="vendor_name"
                  required
                  value={formData.vendor_name}
                  onChange={handleVerifyChange}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 text-sm focus:ring-1 focus:ring-yellow-500 bg-zinc-50 focus:bg-white"
                />
                <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> Correct any spelling mistakes.
                </p>
              </div>

              {/* Cost & Markup (Side by Side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 mb-1.5 uppercase">
                    <DollarSign size={14} /> Supplier Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-zinc-500 font-medium text-sm">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      name="unit_cost"
                      required
                      value={formData.unit_cost}
                      onChange={(e) => {
                        const newCost = e.target.value;
                        const autoMarkup =
                          newCost > 0 ? (newCost * 1.25).toFixed(2) : 0;
                        setFormData({
                          ...formData,
                          unit_cost: newCost,
                          suggested_markup_price: autoMarkup,
                        });
                      }}
                      className="w-full rounded-md border border-zinc-300 pl-8 pr-3 py-2 text-zinc-900 text-sm focus:ring-1 focus:ring-yellow-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-yellow-600 mb-1.5 uppercase">
                    <Tag size={14} /> Suggested Price (+25%)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-zinc-500 font-medium text-sm">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      name="suggested_markup_price"
                      required
                      value={formData.suggested_markup_price}
                      onChange={handleVerifyChange}
                      className="w-full rounded-md border border-yellow-300 pl-8 pr-3 py-2 text-zinc-900 text-sm focus:ring-1 focus:ring-yellow-500 bg-yellow-50/30 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Chart of Accounts */}
              <div className="pt-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 mb-1.5 uppercase">
                  <FileText size={14} /> Chart of Accounts
                </label>
                <select
                  name="chart_of_account"
                  required
                  value={formData.chart_of_account}
                  onChange={handleVerifyChange}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 text-sm focus:ring-1 focus:ring-yellow-500 bg-white"
                >
                  <option value="" disabled>
                    Select Accounting Category...
                  </option>
                  <option value="COGS">Cost of Goods Sold (Auto Parts)</option>
                  <option value="SUPPLIES">
                    Shop Supplies (Grease, Rags, Tools)
                  </option>
                  <option value="UTILITIES">
                    Utilities (Electricity, Water)
                  </option>
                  <option value="MAINTENANCE">Equipment Maintenance</option>
                  <option value="MISC">Miscellaneous Expenses</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-1/3 py-2.5 rounded-md text-sm font-bold text-zinc-600 bg-white border border-zinc-300 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-md text-sm font-bold text-zinc-900 bg-yellow-400 hover:bg-yellow-500 shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  Confirm & Save to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRIntake;
