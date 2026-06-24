import React, { useState, useEffect } from "react";
import {
  Activity,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Clock,
} from "lucide-react";

import { useApp } from "../../context/AppContext";
import { dashboardService } from "../../services/sysadmin/dashboard.service";

// Components
import DataTable from "../../components/shared/DataTable";
import OverviewMetricsCards from "../../features/sysadmin/components/OverviewMetricsCards";
import BusinessSettingsWidget from "../../features/sysadmin/components/BusinessSettingsWidget";
import RecentAuditLogs from "../../features/sysadmin/components/RecentAuditLogs";

const Overview = () => {
  const { showToast } = useApp();

  // --- COMPONENT STATES ---
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    dashboardMetrics: {
      activeBranches: "0 / 0",
      totalUsers: "0",
      databaseStorage: "0.00 MB",
      backupStatus: "SYNCING",
    },
    businessSettings: {
      companyName: "Syncing...",
      vatRate: "0.00%",
      partsMarkup: "0.00%",
    },
    branchRegistryList: [],
    recentAuditLogs: [],
  });

  // --- CLOCK INTERVAL ---
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- API DATA FETCHING ---
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getOverview();
        setDashboardData(data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        showToast(error.message || "Unable to load dashboard data.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [showToast]);

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
              Monitor system activity, users, and operations
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

      {/* 2. DYNAMIC SUMMARY CARDS */}
      <OverviewMetricsCards metrics={dashboardData.dashboardMetrics} />

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
              Active Branch Registry (Top 5)
            </h2>
          </div>

          <div className="w-full flex-1">
            <DataTable
              headers={["Branch Details", "Branch Code", "Status"]}
              data={dashboardData.branchRegistryList}
              loading={loading}
              minWidth="min-w-[500px]"
              emptyTitle="No operational branches"
              emptySubtitle="Active branches will be listed here once registered."
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
        <div className="lg:col-span-1 w-full pt-0 lg:pt-[32px] h-full overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm z-10 rounded-[32px] flex items-center justify-center"></div>
          )}
          <BusinessSettingsWidget settings={dashboardData.businessSettings} />
        </div>
      </div>

      {/* 4. DYNAMIC AUDIT LOGS SUMMARY */}
      <RecentAuditLogs logs={dashboardData.recentAuditLogs} loading={loading} />
    </div>
  );
};

export default Overview;
