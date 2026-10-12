import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm mt-4 animate-in fade-in duration-300 w-full">
      {/* PAGE RANGE COUNTER SNAPSHOT */}
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 shrink-0">
        Page{" "}
        <span className="text-slate-700 dark:text-slate-300 font-black">
          {currentPage}
        </span>{" "}
        of{" "}
        <span className="text-slate-700 dark:text-slate-300 font-black">
          {totalPages}
        </span>
      </div>

      {/* DIRECTIONAL PACK NAVIGATION CONTROLS */}
      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-black/20 p-1 rounded-xl border border-slate-200 dark:border-white/5 w-full sm:w-auto justify-between sm:justify-start">
        {/* PREVIOUS PAGE BUTTON */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          <ChevronLeft size={16} />
        </button>

        {/* DYNAMIC INDIVIDUAL NUMBER CAPSULES */}
        <div className="flex items-center gap-1 px-1">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-slate-400 dark:text-slate-500 flex items-center justify-center pointer-events-none"
                >
                  <MoreHorizontal size={14} />
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(page)}
                className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-amber-500 text-slate-900 shadow-sm shadow-amber-500/10 scale-105 font-black"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700/50"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* NEXT PAGE BUTTON */}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
