import React from "react";
import { Filter } from "lucide-react";

const FilterButton = ({
  onClick,
  activeCount = 0,
  label = "Filters",
  disabled = false,
  className = "",
}) => {
  const hasActiveFilters = activeCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={hasActiveFilters ? `${label} (${activeCount} active)` : label}
      className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 disabled:pointer-events-none ${
        hasActiveFilters
          ? "bg-amber-50/80 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-overdrive-yellow"
          : "bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
      } ${className}`}
    >
      <Filter
        size={14}
        aria-hidden="true"
        className={
          hasActiveFilters ? "text-amber-600 dark:text-overdrive-yellow" : ""
        }
      />
      <span>{label}</span>
      {hasActiveFilters && (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-slate-900 shadow-sm"
        >
          {activeCount}
        </span>
      )}
    </button>
  );
};

export default FilterButton;
