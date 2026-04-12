import React, { useState } from 'react';
import { AlertTriangle, Send, FileText, ClipboardList } from 'lucide-react';

const AdjustmentForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    partId: '',
    qtyChange: -1,
    reason: 'Spillage',
    notes: ''
  });

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Report Loss / Damage</h3>
          <p className="text-xs text-slate-500">All adjustments require Admin approval.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Affected Part</label>
          <select className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:border-red-500 appearance-none">
            <option>Select Part...</option>
            <option>Fully Synthetic Oil (1L)</option>
            <option>Genuine Oil Filter</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Qty Change</label>
            <input type="number" placeholder="-1" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-red-500 outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Reason Code</label>
            <select className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none appearance-none">
              <option>Spillage</option>
              <option>Damaged during install</option>
              <option>Expired</option>
              <option>Incorrect Entry</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Mandatory Explanation</label>
          <textarea 
            rows="3"
            placeholder="Describe exactly what happened..."
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-amber-500 resize-none"
          ></textarea>
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-all">
            Cancel
          </button>
          <button onClick={onSubmit} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-red-500/20">
            <Send size={16} /> Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentForm;