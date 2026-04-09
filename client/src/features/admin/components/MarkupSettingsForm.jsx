import React from 'react';
import { Save } from 'lucide-react';

const MarkupSettingsForm = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
      <h3 className="font-bold text-slate-900 dark:text-white mb-1">Global Pricing Variables</h3>
      <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">These rules apply automatically to all incoming OCR inventory.</p>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Default Parts Markup (%)</label>
          <input type="number" defaultValue={25} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400/20" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">VAT Rate (%)</label>
          <input type="number" defaultValue={12} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400/20" />
        </div>
        
        <button className="w-full mt-4 py-2.5 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 dark:bg-overdrive-yellow dark:hover:bg-yellow-500 text-slate-900 font-bold rounded-lg transition-colors shadow-sm">
          <Save size={18} /> Save Settings
        </button>
      </div>
    </div>
  );
};

export default MarkupSettingsForm;