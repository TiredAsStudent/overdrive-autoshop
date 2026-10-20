import React from "react";
import { Search, Loader2, X } from "lucide-react";

const SearchBar = ({
  value = "",
  onChange,
  onClear,
  placeholder = "Search...",
  isSearching = false,
  disabled = false,
  className = "",
}) => {
  const hasValue = Boolean(value && String(value).length > 0);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: "" } });
    }
  };

  return (
    <div
      role="search"
      className={`relative w-full sm:max-w-[220px] flex-1 ${className}`}
    >
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        {isSearching ? (
          <Loader2
            size={15}
            aria-hidden="true"
            className="text-amber-500 animate-spin"
          />
        ) : (
          <Search
            size={15}
            aria-hidden="true"
            className="text-slate-400 dark:text-slate-500"
          />
        )}
      </div>

      <input
        type="text"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pl-9 ${
          hasValue ? "pr-8" : "pr-4"
        } py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 transition-all`}
      />

      {hasValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search query"
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
