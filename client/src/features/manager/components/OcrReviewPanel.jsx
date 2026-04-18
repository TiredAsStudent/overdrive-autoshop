import React from 'react';
import { Check, X } from 'lucide-react';

const OcrReviewPanel = ({ imageUrl, extractedData, onApprove, onReject }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 p-4 shadow-sm transition-colors duration-300">
      
      {/* Left: Image Viewer */}
      <div className="bg-slate-100 dark:bg-black/40 rounded-lg p-2 flex items-center justify-center min-h-[400px] border border-slate-200 dark:border-white/5">
        {imageUrl ? (
          <img src={imageUrl} alt="Receipt" className="max-h-full object-contain rounded" />
        ) : (
          <span className="text-slate-400 dark:text-gray-600">Receipt Image Preview</span>
        )}
      </div>

      {/* Right: Extracted Data & Edits */}
      <div className="flex flex-col">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Verify Extracted Data</h3>
        
        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendor Name</label>
            <input type="text" defaultValue={extractedData?.vendor || 'N/A'} className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-md text-slate-900 dark:text-white outline-none focus:border-amber-400" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Amount (₱)</label>
              <input type="text" defaultValue={extractedData?.total || '0.00'} className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-md text-slate-900 dark:text-white outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
              <input type="date" defaultValue={extractedData?.date || ''} className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-md text-slate-900 dark:text-white outline-none focus:border-amber-400" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
          <button onClick={onReject} className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 font-bold rounded-lg transition-colors">
            <X size={18} /> Reject
          </button>
          <button onClick={onApprove} className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors shadow-sm">
            <Check size={18} /> Approve & Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default OcrReviewPanel;