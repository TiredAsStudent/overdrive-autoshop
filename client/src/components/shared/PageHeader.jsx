import React from "react";

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  children,
  className = "",
}) => {
  return (
    <header
      className={`flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-xs ${className}`}
    >
      <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto min-w-0">
        {Icon && (
          <div
            aria-hidden="true"
            className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl sm:rounded-2xl shrink-0"
          >
            <Icon className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1
            className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate"
            title={typeof title === "string" ? title : undefined}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate"
              title={typeof subtitle === "string" ? subtitle : undefined}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 w-full lg:w-auto">
          {children}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
