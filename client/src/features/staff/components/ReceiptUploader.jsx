import React, { useState } from "react";
import { Camera, Upload, Cpu, Edit3 } from "lucide-react";

export const ReceiptUploader = ({ onUpload }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [method, setMethod] = useState("ai"); // 'ai' | 'manual'

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (method === "ai") {
          simulateProcessing(reader.result);
        } else {
          onUpload(reader.result, "manual");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateProcessing = (imgData) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onUpload(imgData, "ai");
    }, 2500);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      {/* Dual-Method Selection */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMethod("ai")}
          className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === "ai" ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" : "border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"}`}
        >
          <Cpu size={24} />
          <div className="text-center">
            <p className="font-black uppercase tracking-widest text-xs">
              OCR Engine
            </p>
            <p className="text-[10px] font-bold opacity-70 mt-1">
              Applies Binarization Filter
            </p>
          </div>
        </button>
        <button
          onClick={() => setMethod("manual")}
          className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === "manual" ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" : "border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"}`}
        >
          <Edit3 size={24} />
          <div className="text-center">
            <p className="font-black uppercase tracking-widest text-xs">
              Manual Fallback
            </p>
            <p className="text-[10px] font-bold opacity-70 mt-1">
              For handwritten/torn receipts
            </p>
          </div>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[32px] p-12 text-center space-y-6 relative overflow-hidden transition-colors shadow-sm">
        {isProcessing && (
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
                Grayscale Conversion & Thresholding Active...
              </p>
            </div>
          </div>
        )}

        <div
          className={`h-24 w-24 rounded-3xl flex items-center justify-center mx-auto transition-colors ${method === "ai" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}
        >
          <Camera size={48} />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Capture Physical Evidence
          </h3>
          <p className="text-sm font-bold text-slate-500 px-8">
            High-resolution photo required for Manager's audit trail, regardless
            of entry method.
          </p>
        </div>

        <label
          className={`w-full py-5 text-white font-black uppercase tracking-widest text-xs rounded-xl cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xl ${method === "ai" ? "bg-slate-900 dark:bg-white dark:text-slate-900" : "bg-blue-600 dark:bg-blue-500"}`}
        >
          <Upload size={18} /> Select Image / Open Camera
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFile}
          />
        </label>
      </div>
    </div>
  );
};
