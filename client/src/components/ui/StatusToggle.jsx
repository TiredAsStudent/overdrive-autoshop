import React from "react";

const StatusToggle = ({
  activeValue,
  onToggle,
  options = [
    { label: "Active", value: false },
    { label: "Archived", value: true },
  ],
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-1 bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto ${className}`}
    >
      {options.map((opt, index) => {
        const isActive = activeValue === opt.value;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
              isActive
                ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
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
