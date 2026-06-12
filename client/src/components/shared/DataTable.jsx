import React from "react";
import { Loader2, Search } from "lucide-react";

/**
 * A highly scalable, responsive, and reusable datatable component.
 *
 * @param {Array} headers - Column names (e.g., ["Details", "Code", "Status"])
 * @param {Array} data - The array of records to iterate through
 * @param {Boolean} loading - Toggles the blurred synchronization backdrop
 * @param {Function} renderRow - Callback function specifying the JSX structure of each row's columns
 * @param {String} emptyTitle - Text displayed when no records match filter criteria
 * @param {String} emptySubtitle - Guidance text displayed during an empty state
 */
const DataTable = ({
  headers = [],
  data = [],
  loading = false,
  renderRow,
  emptyTitle = "No matching records found",
  emptySubtitle = "Try adjusting your search criteria or register a new record.",
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm relative min-h-[300px]">
      {/* GLOBAL LOADING BUFFER OVERLAY */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Syncing System Data...
          </span>
        </div>
      )}

      {/* RESPONSIVE HORIZONTAL OVERFLOW SCROLL */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left whitespace-nowrap min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={`px-6 sm:px-8 py-5 ${index === headers.length - 1 ? "text-right" : ""}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {/* RENDER ACTIVE DATA ROWS */}
            {data.length > 0 &&
              data.map((item, index) => renderRow(item, index))}

            {/* UNIFIED EMPTY STATE ENGINE */}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={headers.length} className="px-8 py-16 text-center">
                  <div className="inline-flex flex-col items-center justify-center text-slate-400">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-3">
                      <Search size={32} className="opacity-40" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {emptyTitle}
                    </p>
                    <p className="text-xs font-medium mt-1.5 opacity-70">
                      {emptySubtitle}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
