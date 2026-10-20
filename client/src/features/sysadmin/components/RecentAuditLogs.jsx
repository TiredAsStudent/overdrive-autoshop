import React from "react";
import { History, ShieldAlert, AlertTriangle, Activity } from "lucide-react";
import DataTable from "../../../components/shared/DataTable";
import StatusBadge from "../../../components/ui/StatusBadge";

const RecentAuditLogs = ({ logs = [], loading = false }) => {
  const getSeverityVariant = (severity) => {
    const normalized = severity?.toString().toUpperCase();
    if (normalized === "CRITICAL" || normalized === "ERROR") return "danger";
    if (normalized === "WARNING") return "warning";
    return "info";
  };

  const getSeverityIcon = (severity) => {
    const normalized = severity?.toString().toUpperCase();
    if (normalized === "CRITICAL" || normalized === "ERROR") return ShieldAlert;
    if (normalized === "WARNING") return AlertTriangle;
    return Activity;
  };

  return (
    <section
      aria-labelledby="recent-audit-logs-heading"
      className="flex flex-col w-full h-full overflow-hidden"
    >
      <div className="mb-3 flex items-center justify-between pl-1">
        <div className="flex items-center gap-2">
          <History
            size={16}
            aria-hidden="true"
            className="text-amber-600 dark:text-overdrive-yellow shrink-0"
          />
          <h2
            id="recent-audit-logs-heading"
            className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 truncate"
          >
            Recent Audit Logs
          </h2>
        </div>
      </div>

      <div className="w-full flex-1">
        <DataTable
          caption="Recent System Audit Logs"
          headers={[
            "Timestamp",
            "Severity",
            "Operator",
            "Action Performed",
            "Target Resource",
          ]}
          data={logs}
          loading={loading}
          minWidth="min-w-[720px]"
          emptyTitle="No recent audit logs"
          emptySubtitle="System activities will appear here once recorded."
          renderRow={(log, index) => (
            <tr
              key={log.id ?? index}
              className="table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              {/* Timestamp */}
              <td className="px-4 sm:px-6 lg:px-8 py-4 whitespace-nowrap">
                <span className="text-[11px] sm:text-xs font-mono tabular-nums font-medium text-slate-600 dark:text-slate-400">
                  {log.timestamp}
                </span>
              </td>

              {/* Severity */}
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <StatusBadge
                  label={log.severity || "INFO"}
                  variant={getSeverityVariant(log.severity)}
                  icon={getSeverityIcon(log.severity)}
                />
              </td>

              {/* Operator */}
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <p
                  className="text-xs font-bold text-slate-900 dark:text-white uppercase truncate max-w-[140px] sm:max-w-[200px]"
                  title={log.operator}
                >
                  {log.operator}
                </p>
              </td>

              {/* Action */}
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <p
                  className="text-[10px] sm:text-xs font-black text-amber-700 dark:text-overdrive-yellow tracking-widest uppercase truncate max-w-[160px] sm:max-w-[260px]"
                  title={log.action}
                >
                  {log.action}
                </p>
              </td>

              {/* Target Resource */}
              <td className="px-4 sm:px-6 lg:px-8 py-4 text-right whitespace-nowrap">
                <p
                  className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 font-mono tabular-nums truncate max-w-[160px] sm:max-w-[240px] ml-auto"
                  title={log.target}
                >
                  {log.target}
                </p>
              </td>
            </tr>
          )}
        />
      </div>
    </section>
  );
};

export default RecentAuditLogs;
