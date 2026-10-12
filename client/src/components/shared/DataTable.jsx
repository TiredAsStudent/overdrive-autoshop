import React from "react";
import { Loader2, Search } from "lucide-react";

const DataTable = ({
  headers = [],
  data = [],
  loading = false,
  renderRow,
  minWidth = "min-w-[800px]",
  emptyTitle = "No matching records found",
  emptySubtitle = "Try adjusting your search criteria or register a new record.",
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm relative min-h-[300px] flex flex-col w-full">
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
      <div className="overflow-x-auto custom-scrollbar w-full flex-1 touch-pan-x">
        <table
          className={`w-full text-left whitespace-nowrap min-w-[700px] sm:${minWidth}`}
        >
          <thead>
            <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={`px-4 sm:px-8 py-4 sm:py-5 ${index === headers.length - 1 ? "text-right" : ""}`}
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
                <td
                  colSpan={headers.length}
                  className="px-4 sm:px-8 py-12 sm:py-16 text-center"
                >
                  <div className="inline-flex flex-col items-center justify-center text-slate-400 w-full max-w-[250px] sm:max-w-none mx-auto">
                    <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-3">
                      <Search
                        size={28}
                        className="opacity-40 sm:w-8 sm:h-8 w-6 h-6"
                      />
                    </div>
                    <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-normal">
                      {emptyTitle}
                    </p>
                    <p className="text-[10px] sm:text-xs font-medium mt-1.5 opacity-70 whitespace-normal">
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
