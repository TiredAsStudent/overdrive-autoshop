import React from "react";
import { HardDrive, History, ShieldCheck, ServerCrash } from "lucide-react";

const BackupMetricsCards = ({ totalVolume, successCount, lastExecution }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
      {/* Storage Volume Card (Matched Padding and Radius to Users.jsx) */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4 sm:gap-5 transition-all">
        <div className="p-3.5 sm:p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl shrink-0">
          <HardDrive className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest truncate">
            Network Storage Used
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 truncate">
            {totalVolume}{" "}
            <span className="text-sm font-bold text-slate-400">MB</span>
          </p>
        </div>
      </div>

      {/* Total Archives Card */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4 sm:gap-5 transition-all">
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-white/5 rounded-2xl shrink-0">
          <History className="h-7 w-7 sm:h-8 sm:w-8 text-slate-600 dark:text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest truncate">
            Historical Archives
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 truncate">
            {successCount}{" "}
            <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
              Successful
            </span>
          </p>
        </div>
      </div>

      {/* System Health Card */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4 sm:gap-5 transition-all">
        <div
          className={`p-3.5 sm:p-4 rounded-2xl shrink-0 ${
            lastExecution === "HEALTHY"
              ? "bg-emerald-50 dark:bg-emerald-500/10"
              : "bg-red-50 dark:bg-red-500/10"
          }`}
        >
          {lastExecution === "HEALTHY" ? (
            <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ServerCrash className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest truncate">
            Last Execution State
          </p>
          <p
            className={`text-2xl sm:text-3xl font-black tracking-tight mt-1 truncate ${
              lastExecution === "HEALTHY"
                ? "text-emerald-600 dark:text-emerald-400"
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
