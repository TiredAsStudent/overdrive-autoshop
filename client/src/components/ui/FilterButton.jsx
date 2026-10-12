import React from "react";
import { Filter } from "lucide-react";

const FilterButton = ({
  onClick,
  activeCount = 0,
  label = "Filters",
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] uppercase tracking-widest font-black text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${className}`}
    >
      <Filter size={14} /> {label}
      {activeCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-slate-900 shadow-sm">
          {activeCount}
        </span>
      )}
    </button>
  );
};

export default FilterButton;
