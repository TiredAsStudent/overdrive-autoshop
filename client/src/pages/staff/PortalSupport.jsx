import React from "react";

const PortalSupport = () => {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Portal Support
          </h1>
        </div>
      </div>

      <div className="w-full h-64 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-white/5">
        <p className="text-slate-400 font-medium uppercase tracking-widest">
          [ Portal Support Content ]
        </p>
      </div>
    </div>
  );
};

export default PortalSupport;
