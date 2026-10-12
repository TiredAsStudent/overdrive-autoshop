import React from "react";
import { History, ShieldAlert, Activity } from "lucide-react";
import DataTable from "../../../components/shared/DataTable";
import StatusBadge from "../../../components/ui/StatusBadge";

const RecentAuditLogs = ({ logs, loading }) => {
  const getSeverityVariant = (severity) => {
    if (severity === "CRITICAL") return "danger";
    if (severity === "WARNING") return "warning";
    return "info";
  };

  const getSeverityIcon = (severity) => {
    if (severity === "CRITICAL") return ShieldAlert;
    return Activity;
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <div className="mb-3 flex items-center justify-between pl-2">
        <div className="flex items-center gap-2">
          <History size={16} className="text-amber-500 shrink-0" />
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 truncate">
            Recent Audit Logs
          </h2>
        </div>
      </div>

      <div className="w-full flex-1">
        <DataTable
          headers={[
            "Timestamp",
            "Severity",
            "Operator",
            "Action Performed",
            "Target Resource",
          ]}
          data={logs}
          loading={loading}
          minWidth="min-w-[700px]"
          emptyTitle="No recent audit logs"
          emptySubtitle="System activities will appear here once recorded."
          renderRow={(log) => (
            <tr
              key={log.id}
              className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              {/* Timestamp */}
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                  {log.timestamp}
                </p>
              </td>

              {/* Severity */}
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <StatusBadge
                  label={log.severity}
                  variant={getSeverityVariant(log.severity)}
                  icon={getSeverityIcon(log.severity)}
                />
              </td>

              {/* Operator */}
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <p className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white uppercase truncate max-w-[120px] sm:max-w-[200px]">
                  {log.operator}
                </p>
              </td>

              {/* Action */}
              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                <p className="text-[9px] sm:text-[10px] font-black text-amber-600 dark:text-overdrive-yellow tracking-widest uppercase truncate max-w-[150px] sm:max-w-[250px]">
                  {log.action}
                </p>
              </td>

              {/* Target Resource */}
              <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-400 font-mono truncate max-w-[150px] sm:max-w-none ml-auto">
                  {log.target}
                </p>
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
};

export default RecentAuditLogs;
