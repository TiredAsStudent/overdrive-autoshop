import React from "react";
import { HardDrive, History, ShieldCheck, ServerCrash } from "lucide-react";

const BackupMetricsCards = ({ totalVolume, successCount, lastExecution }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full">
      {/* Storage Volume Card */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4 sm:gap-5 transition-all w-full overflow-hidden">
        <div className="p-3 sm:p-3.5 lg:p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl sm:rounded-2xl shrink-0">
          <HardDrive className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest truncate">
            Network Storage Used
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5 sm:mt-1 truncate">
            {totalVolume}{" "}
            <span className="text-xs sm:text-sm font-bold text-slate-400">
              MB
            </span>
          </p>
        </div>
      </div>

      {/* Total Archives Card */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4 sm:gap-5 transition-all w-full overflow-hidden">
        <div className="p-3 sm:p-3.5 lg:p-4 bg-slate-50 dark:bg-white/5 rounded-xl sm:rounded-2xl shrink-0">
          <History className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-slate-600 dark:text-slate-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest truncate">
            Historical Archives
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5 sm:mt-1 truncate">
            {successCount}{" "}
            <span className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500">
              Successful
            </span>
          </p>
        </div>
      </div>

      {/* System Health Card */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4 sm:gap-5 transition-all w-full overflow-hidden sm:col-span-2 lg:col-span-1">
        <div
          className={`p-3 sm:p-3.5 lg:p-4 rounded-xl sm:rounded-2xl shrink-0 ${
            lastExecution === "HEALTHY"
              ? "bg-emerald-50 dark:bg-emerald-500/10"
              : lastExecution === "STANDBY"
                ? "bg-slate-50 dark:bg-white/5"
                : "bg-red-50 dark:bg-red-500/10"
          }`}
        >
          {lastExecution === "HEALTHY" ? (
            <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-emerald-600 dark:text-emerald-400" />
          ) : lastExecution === "STANDBY" ? (
            <History className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-slate-600 dark:text-slate-400" />
          ) : (
            <ServerCrash className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest truncate">
            Last Execution State
          </p>
          <p
            className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight mt-0.5 sm:mt-1 truncate ${
              lastExecution === "HEALTHY"
                ? "text-emerald-600 dark:text-emerald-400"
                : lastExecution === "STANDBY"
                  ? "text-slate-600 dark:text-slate-400"
                  : "text-red-600 dark:text-red-400"
            }`}
          >
            {lastExecution}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BackupMetricsCards;
