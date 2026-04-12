import React, { useState } from 'react';
import { Camera, Upload, ShieldCheck, AlertCircle } from 'lucide-react';

const ReceiptUploader = ({ onUpload }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        simulateProcessing(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateProcessing = (imgData) => {
    setIsProcessing(true);
    // Mimicking the "Grease-Proof" Pre-processing delay
    setTimeout(() => {
      setIsProcessing(false);
      onUpload(imgData);
    }, 2000);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center space-y-6 relative overflow-hidden transition-colors">
        
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black uppercase tracking-tighter text-slate-900 dark:text-white">Applying Grease-Proof Filters...</p>
            <p className="text-xs text-slate-500">Sharpening text & reducing noise</p>
          </div>
        )}

        <div className="h-20 w-20 bg-amber-50 dark:bg-overdrive-yellow/10 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-overdrive-yellow">
          <Camera size={40} />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Capture Receipt</h3>
          <p className="text-sm text-slate-500 px-8">Standard AI scan for printed receipts or Manual Stock-In for handwritten entries.</p>
        </div>

        <div className="flex flex-col gap-3">
          <label className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <Upload size={18} /> Take Photo / Upload
            <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
          </label>
          <button className="text-sm font-bold text-slate-400 hover:text-amber-500 transition-colors">
            Switch to Manual Stock-In
          </button>
        </div>
      </div>
      
      <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/5 rounded-xl border border-blue-100 dark:border-blue-500/10">
        <ShieldCheck className="text-blue-500 shrink-0" size={18} />
        <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
          <strong>Security Note:</strong> All uploads are branch-locked and time-stamped. Physical receipts must be kept until the Admin approves the submission.
        </p>
      </div>
    </div>
  );
};

export default ReceiptUploader;