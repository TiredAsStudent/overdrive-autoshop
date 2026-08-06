import React from "react";

const PageHeader = ({ title, subtitle, icon: Icon, children }) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
        {Icon && (
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Icon className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
