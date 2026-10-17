import React from "react";

const StatusToggle = ({
  activeValue,
  onToggle,
  options = [
    { label: "Active", value: false },
    { label: "Archived", value: true },
  ],
  ariaLabel = "Filter records by status",
  className = "",
}) => {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex items-center gap-1 bg-slate-100/80 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto overflow-x-auto custom-scrollbar ${className}`}
    >
      {options.map((opt, index) => {
        const isActive = activeValue === opt.value;
        return (
          <button
            key={opt.value ?? index}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(opt.value)}
            className={`flex-1 sm:flex-none px-3.5 sm:px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer whitespace-nowrap text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isActive
                ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-overdrive-yellow shadow-xs border border-slate-200/60 dark:border-white/10"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default StatusToggle;
