import React from "react";
import { Sliders } from "lucide-react";

const BusinessSettingsWidget = ({ settings }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-full w-full">
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
        <Sliders
          size={18}
          className="text-amber-600 dark:text-overdrive-yellow shrink-0"
        />
        <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white italic truncate">
          Business Settings Overview
        </h2>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center space-y-3 sm:space-y-4">
        {/* Company Name */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden gap-2">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 shrink-0">
            Company Name:
          </span>
          <span className="text-[10px] sm:text-xs font-black uppercase italic text-slate-900 dark:text-white truncate text-right min-w-0">
            {settings.companyName}
          </span>
        </div>

        {/* VAT Rate */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden gap-2">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 shrink-0">
            Standard VAT Rate:
          </span>
          <span className="text-[10px] sm:text-xs font-mono font-black text-amber-600 dark:text-overdrive-yellow truncate text-right min-w-0">
            {settings.vatRate}
          </span>
        </div>

        {/* Catalog Markup */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden gap-2">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 shrink-0">
            Catalog Parts Markup:
          </span>
          <span className="text-[10px] sm:text-xs font-mono font-black text-blue-500 dark:text-blue-400 truncate text-right min-w-0">
            {settings.partsMarkup}
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/30 text-center text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 dark:border-white/5 truncate">
        Current Active System Configuration
      </div>
    </div>
  );
};

export default BusinessSettingsWidget;
