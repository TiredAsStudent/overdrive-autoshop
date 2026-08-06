import React from "react";
import { Search, Loader2 } from "lucide-react";

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  isSearching = false,
  className = "",
}) => {
  return (
    <div className={`relative w-full sm:max-w-[200px] flex-1 ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {isSearching ? (
          <Loader2 size={16} className="text-amber-500 animate-spin" />
        ) : (
          <Search size={16} className="text-slate-400" />
        )}
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
      />
    </div>
  );
};

export default SearchBar;
