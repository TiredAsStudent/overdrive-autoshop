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
    <nav
      aria-label="Pagination"
      className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-[24px] border border-slate-200 dark:border-white/10 shadow-xs mt-4 w-full"
    >
      {/* PAGE RANGE COUNTER SNAPSHOT */}
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 shrink-0 font-mono tabular-nums">
        Page{" "}
        <span className="text-slate-900 dark:text-white font-black">
          {currentPage}
        </span>{" "}
        of{" "}
        <span className="text-slate-900 dark:text-white font-black">
          {totalPages}
        </span>
      </div>

      {/* DIRECTIONAL PACK NAVIGATION CONTROLS */}
      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-black/20 p-1 rounded-xl border border-slate-200 dark:border-white/5 w-full sm:w-auto justify-between sm:justify-start overflow-x-auto custom-scrollbar">
        {/* PREVIOUS PAGE BUTTON */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Go to previous page"
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        {/* DYNAMIC INDIVIDUAL NUMBER CAPSULES */}
        <div className="flex items-center gap-1 px-1">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  aria-hidden="true"
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
                aria-label={`Go to page ${page}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onPageChange(page)}
                className={`px-3 sm:px-3.5 py-1.5 text-[10px] font-black font-mono tabular-nums uppercase tracking-widest rounded-lg transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-amber-500 text-slate-900 shadow-xs shadow-amber-500/20 font-black"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/50"
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
          aria-label="Go to next page"
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
