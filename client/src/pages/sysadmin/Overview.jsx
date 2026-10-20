import React, { useState, useEffect } from "react";
import { Activity, Building2, Sliders } from "lucide-react";

import { useApp } from "../../context/AppContext";
import { dashboardService } from "../../services/sysadmin/dashboard.service";

// Components
import PageHeader from "../../components/shared/PageHeader";
import DataTable from "../../components/shared/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import LiveClock from "../../components/ui/LiveClock";
import OverviewMetricsCards from "../../features/sysadmin/components/OverviewMetricsCards";
import BusinessSettingsWidget from "../../features/sysadmin/components/BusinessSettingsWidget";
import RecentAuditLogs from "../../features/sysadmin/components/RecentAuditLogs";

const INITIAL_DASHBOARD_DATA = {
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
};

const Overview = () => {
  const { showToast } = useApp();

  // --- COMPONENT STATES ---
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(INITIAL_DASHBOARD_DATA);

  // --- API DATA FETCHING ---
  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getOverview();
        if (isMounted && data) {
          setDashboardData({
            dashboardMetrics: {
              ...INITIAL_DASHBOARD_DATA.dashboardMetrics,
              ...(data.dashboardMetrics || {}),
            },
            businessSettings: {
              ...INITIAL_DASHBOARD_DATA.businessSettings,
              ...(data.businessSettings || {}),
            },
            branchRegistryList: Array.isArray(data.branchRegistryList)
              ? data.branchRegistryList
              : [],
            recentAuditLogs: Array.isArray(data.recentAuditLogs)
              ? data.recentAuditLogs
              : [],
          });
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        if (isMounted) {
          showToast(error.message || "Unable to load dashboard data.", "error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* 1. ACTION BAR (STANDARD PAGE HEADER) */}
      <PageHeader
        title="Overview"
        subtitle="Monitor system activity, users, and operations"
        icon={Activity}
      >
        <LiveClock />
      </PageHeader>

      {/* 2. DYNAMIC SUMMARY CARDS */}
      <OverviewMetricsCards metrics={dashboardData.dashboardMetrics} />

      {/* 3. SPLIT WORKSPACE PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full items-stretch">
        {/* Left Panel: Branch Registry Status */}
        <section
          aria-labelledby="branch-registry-heading"
          className="lg:col-span-2 flex flex-col w-full min-w-0"
        >
          <div className="mb-3 flex items-center gap-2 pl-1">
            <Building2
              size={16}
              aria-hidden="true"
              className="text-amber-600 dark:text-overdrive-yellow shrink-0"
            />
            <h2
              id="branch-registry-heading"
              className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 truncate"
            >
              Active Branch Registry (Top 5)
            </h2>
          </div>

          <div className="w-full flex-1 flex flex-col">
            <DataTable
              caption="Top 5 Active Branches Registry"
              headers={["Branch Details", "Branch Code", "Status"]}
              data={dashboardData.branchRegistryList}
              loading={loading}
              minWidth="min-w-[520px]"
              emptyTitle="No operational branches"
              emptySubtitle="Active branches will be listed here once registered."
              renderRow={(branch, index) => (
                <tr
                  key={branch.id ?? index}
                  className="table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
                >
                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div
                        aria-hidden="true"
                        className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-overdrive-yellow rounded-xl sm:rounded-2xl shrink-0"
                      >
                        <Building2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <div className="min-w-0 max-w-[160px] sm:max-w-[220px] lg:max-w-[280px]">
                        <p
                          className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic tracking-tight uppercase truncate"
                          title={branch.branch_name}
                        >
                          {branch.branch_name}
                        </p>
                        <p
                          className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5"
                          title={branch.address}
                        >
                          {branch.address}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 whitespace-nowrap">
                    <div className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20">
                      <span className="text-[10px] sm:text-xs font-mono tabular-nums font-black text-amber-700 dark:text-overdrive-yellow tracking-widest uppercase">
                        {branch.branch_code}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                    <StatusBadge
                      label={
                        branch.is_maintenance_mode ? "Locked" : "Operational"
                      }
                      variant={
                        branch.is_maintenance_mode ? "danger" : "success"
                      }
                    />
                  </td>
                </tr>
              )}
            />
          </div>
        </section>

        {/* Right Panel: Business Settings Widget */}
        <section
          aria-labelledby="business-settings-heading"
          className="lg:col-span-1 flex flex-col w-full min-w-0"
        >
          <div className="mb-3 flex items-center gap-2 pl-1">
            <Sliders
              size={16}
              aria-hidden="true"
              className="text-amber-600 dark:text-overdrive-yellow shrink-0"
            />
            <h2
              id="business-settings-heading"
              className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 truncate"
            >
              System Configuration
            </h2>
          </div>

          <div className="w-full flex-1 flex flex-col">
            <BusinessSettingsWidget
              settings={dashboardData.businessSettings}
              loading={loading}
            />
          </div>
        </section>
      </div>

      {/* 4. DYNAMIC AUDIT LOGS SUMMARY */}
      <RecentAuditLogs logs={dashboardData.recentAuditLogs} loading={loading} />
    </div>
  );
};

export default Overview;
