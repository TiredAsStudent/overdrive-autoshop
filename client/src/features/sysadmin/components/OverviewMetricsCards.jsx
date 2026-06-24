import React from "react";
import { Building2, Users, HardDrive, ShieldCheck } from "lucide-react";

const OverviewMetricsCards = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full">
      {/* Registered Branches Card */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-3 sm:gap-4 lg:gap-5 transition-all w-full overflow-hidden">
        <div className="p-3 lg:p-4 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
          <Building2 className="h-6 w-6 lg:h-8 lg:w-8 text-amber-600 dark:text-overdrive-yellow" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest truncate">
            Registered Branches
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5 sm:mt-1 truncate">
            {metrics.activeBranches}{" "}
            <span className="text-xs sm:text-sm font-bold text-slate-400">
              Active
            </span>
          </p>
        </div>
      </div>

      {/* Total User Accounts Card */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-3 sm:gap-4 lg:gap-5 transition-all w-full overflow-hidden">
        <div className="p-3 lg:p-4 bg-purple-50 dark:bg-purple-500/10 rounded-xl sm:rounded-2xl shrink-0">
          <Users className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest truncate">
            Total User Accounts
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5 sm:mt-1 truncate">
            {metrics.totalUsers}{" "}
            <span className="text-xs sm:text-sm font-bold text-slate-400">
              Accounts
            </span>
          </p>
        </div>
      </div>

      {/* Database Storage Card */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-3 sm:gap-4 lg:gap-5 transition-all w-full overflow-hidden">
        <div className="p-3 lg:p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl sm:rounded-2xl shrink-0">
          <HardDrive className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest truncate">
            Database Storage Size
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5 sm:mt-1 truncate">
            {metrics.databaseStorage}
          </p>
        </div>
      </div>

      {/* Backup System Status Card */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-3 sm:gap-4 lg:gap-5 transition-all w-full overflow-hidden">
        <div className="p-3 lg:p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl sm:rounded-2xl shrink-0">
          <ShieldCheck className="h-6 w-6 lg:h-8 lg:w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest truncate">
            Backup System Status
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5 sm:mt-1 truncate">
            {metrics.backupStatus}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OverviewMetricsCards;
