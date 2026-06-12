import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * A highly reusable, stateless pagination navigation bar component.
 * Tailored with explicit dark-mode overrides matching the system design token specs.
 *
 * @param {Number} currentPage - The current active page index (1-based)
 * @param {Number} totalPages - The total count of calculated pages available
 * @param {Function} onPageChange - Abstract state modification callback handler
 */
const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  // Prevent rendering entirely if there is only one page or no data
  if (totalPages <= 1) return null;

  // Generate an array of page numbers to render (e.g., [1, 2, 3])
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm mt-4 animate-in fade-in duration-300">
      {/* PAGE RANGE COUNTER SNAPSHOT */}
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
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
      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-black/20 p-1 rounded-xl border border-slate-200 dark:border-white/5">
        {/* PREVIOUS PAGE BUTTON */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>

        {/* DYNAMIC INDIVIDUAL NUMBER CAPSULES */}
        {pageNumbers.map((page) => {
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-slate-900 shadow-sm shadow-amber-500/10 scale-105 font-black"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700/50"
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* NEXT PAGE BUTTON */}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
