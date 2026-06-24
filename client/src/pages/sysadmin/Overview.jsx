import React, { useState, useEffect } from "react";
import {
  Activity,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Clock,
} from "lucide-react";

// Components
import DataTable from "../../components/shared/DataTable";
import OverviewMetricsCards from "../../features/sysadmin/components/OverviewMetricsCards";
import BusinessSettingsWidget from "../../features/sysadmin/components/BusinessSettingsWidget";
import RecentAuditLogs from "../../features/sysadmin/components/RecentAuditLogs";

const Overview = () => {
  // Simple User-Friendly Clock State
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- STANDARD MOCK DATA ---
  const dashboardMetrics = {
    activeBranches: "2 / 2",
    totalUsers: "14",
    databaseStorage: "42.8 MB",
    backupStatus: "SECURE",
  };

  const businessSettings = {
    companyName: "Overdrive Auto Shop",
    vatRate: "12.00%",
    partsMarkup: "20.00%",
  };

  // Content mapped EXACTLY to Branches.jsx details
  const branchRegistryList = [
    {
      id: 1,
      branch_name: "Biñan Main Branch",
      branch_code: "BIN",
      address: "Magsaysay Rd, Biñan, Laguna",
      is_active: true,
      is_maintenance_mode: false,
    },
    {
      id: 2,
      branch_name: "Cabuyao Hub",
      branch_code: "CAB",
      address: "Pulo-Diezmo Rd, Cabuyao, Laguna",
      is_active: true,
      is_maintenance_mode: true,
    },
  ];

  // Content mapped to standard Audit Trail structure
  const recentAuditLogs = [
    {
      id: 1042,
      timestamp: "06/24/2026, 3:32:11 PM",
      operator: "System Admin",
      action: "UPDATED_BRANCH_STATUS",
      target: "CABUYAO HUB (ID: 2)",
      severity: "CRITICAL",
    },
    {
      id: 1041,
      timestamp: "06/24/2026, 2:15:02 PM",
      operator: "System Admin",
      action: "REVOKED_USER_SESSION",
      target: "STAFF_ACCOUNT (ID: 14)",
      severity: "WARNING",
    },
    {
      id: 1039,
      timestamp: "06/24/2026, 12:00:04 AM",
      operator: "System Automation",
      action: "GENERATED_DATABASE_BACKUP",
      target: "BACKUP_FILE (ID: 88)",
      severity: "INFO",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full max-w-[100vw] overflow-hidden px-2 sm:px-0">
      {/* 1. ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm w-full">
        {/* Header Title Section */}
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Activity className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Overview
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Monitor system activity, users, and operations.
            </p>
          </div>
        </div>

        {/* Clock Display */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/20 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto text-slate-700 dark:text-slate-300 font-mono text-xs sm:text-sm font-bold justify-center sm:justify-start">
          <Clock size={16} className="text-amber-500" />
          <span>
            {time.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            | {time.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* 2. FRIENDLY SUMMARY CARDS */}
      <OverviewMetricsCards metrics={dashboardMetrics} />

      {/* 3. SPLIT WORKSPACE PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full items-start">
        {/* Left Component: Branch Registry Status */}
        <div className="lg:col-span-2 flex flex-col w-full h-full overflow-hidden">
          <div className="mb-3 flex items-center gap-2 pl-2">
            <Building2
              size={16}
              className="text-amber-600 dark:text-overdrive-yellow shrink-0"
            />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 truncate">
              Branch Registry Status
            </h2>
          </div>

          <div className="w-full flex-1">
            <DataTable
              headers={["Branch Details", "Branch Code", "Status"]}
              data={branchRegistryList}
              loading={false}
              minWidth="min-w-[500px]"
              renderRow={(branch) => (
                <tr
                  key={branch.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors border-b border-slate-100 dark:border-white/5 last:border-0"
                >
                  {/* Branch Details */}
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl sm:rounded-2xl shrink-0">
                        <Building2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <div className="min-w-0 max-w-[140px] sm:max-w-[200px] lg:max-w-[250px]">
                        <p className="text-[10px] sm:text-xs lg:text-sm font-black text-slate-900 dark:text-white italic tracking-tight uppercase truncate">
                          {branch.branch_name}
                        </p>
                        <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {branch.address}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Branch Code */}
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <div className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20">
                      <span className="text-[9px] sm:text-[10px] lg:text-xs font-black text-amber-700 dark:text-amber-400 tracking-[0.2em] uppercase">
                        {branch.branch_code}
                      </span>
                    </div>
                  </td>

                  {/* Status Badges */}
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                    {branch.is_maintenance_mode ? (
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                        <ShieldAlert
                          size={10}
                          className="sm:w-[12px] sm:h-[12px] lg:w-[14px] lg:h-[14px]"
                        />{" "}
                        Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                        <ShieldCheck
                          size={10}
                          className="sm:w-[12px] sm:h-[12px] lg:w-[14px] lg:h-[14px]"
                        />{" "}
                        Operational
                      </span>
                    )}
                  </td>
                </tr>
              )}
            />
          </div>
        </div>

        {/* Right Component: Business Settings Widget */}
        <div className="lg:col-span-1 w-full pt-0 lg:pt-[32px] h-full overflow-hidden">
          <BusinessSettingsWidget settings={businessSettings} />
        </div>
      </div>

      {/* 4. ALIGNED AUDIT LOGS SUMMARY */}
      <RecentAuditLogs logs={recentAuditLogs} />
    </div>
  );
};

export default Overview;
