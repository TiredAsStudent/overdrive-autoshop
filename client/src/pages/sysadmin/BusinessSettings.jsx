import React from "react";
import { Settings2 } from "lucide-react";

const BusinessSettings = () => {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Settings2
            className="text-amber-600 dark:text-overdrive-yellow"
            size={24}
          />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Business Settings
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-gray-400">
            Configure global VAT, standard markups, and enterprise policies.
          </p>
        </div>
      </div>

      <div className="w-full h-64 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-white/5">
        <p className="text-slate-400 font-medium uppercase tracking-widest">
          [ Global Business Logic Config ]
        </p>
      </div>
    </div>
  );
};

export default BusinessSettings;
