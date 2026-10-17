import React from "react";
import { Sliders, Loader2 } from "lucide-react";

const BusinessSettingsWidget = ({ settings = {}, loading = false }) => {
  const companyName = settings.companyName || "Overdrive Auto Shop";
  const vatRate = settings.vatRate || "0.00%";
  const partsMarkup = settings.partsMarkup || "0.00%";

  return (
    <div
      aria-busy={loading}
      className="relative bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col h-full min-h-[300px] w-full"
    >
      {/* Internal Loading Overlay */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xs z-10 flex flex-col items-center justify-center"
        >
          <Loader2
            aria-hidden="true"
            className="h-8 w-8 text-amber-500 animate-spin mb-3"
          />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
            Syncing Configuration...
          </span>
        </div>
      )}

      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/5 flex items-center gap-2.5 shrink-0">
        <div
          aria-hidden="true"
          className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-overdrive-yellow shrink-0"
        >
          <Sliders size={16} />
        </div>
        <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white italic truncate">
          Business Settings Overview
        </h3>
      </div>

      {/* Metrics List */}
      <dl className="p-4 sm:p-6 flex-1 flex flex-col justify-center space-y-3 sm:space-y-4">
        {/* Company Name */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden gap-3">
          <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 shrink-0">
            Company Name:
          </dt>
          <dd
            className="text-xs font-black uppercase italic text-slate-900 dark:text-white truncate text-right min-w-0"
            title={companyName}
          >
            {companyName}
          </dd>
        </div>

        {/* VAT Rate */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden gap-3">
          <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 shrink-0">
            Standard VAT Rate:
          </dt>
          <dd
            className="text-xs font-mono tabular-nums font-black text-amber-700 dark:text-overdrive-yellow truncate text-right min-w-0"
            title={String(vatRate)}
          >
            {vatRate}
          </dd>
        </div>

        {/* Catalog Markup */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden gap-3">
          <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 shrink-0">
            Catalog Parts Markup:
          </dt>
          <dd
            className="text-xs font-mono tabular-nums font-black text-blue-700 dark:text-blue-400 truncate text-right min-w-0"
            title={String(partsMarkup)}
          >
            {partsMarkup}
          </dd>
        </div>
      </dl>

      {/* Footer */}
      <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900/30 text-center text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-t border-slate-100 dark:border-white/5 truncate shrink-0">
        Current Active System Configuration
      </div>
    </div>
  );
};

export default BusinessSettingsWidget;
