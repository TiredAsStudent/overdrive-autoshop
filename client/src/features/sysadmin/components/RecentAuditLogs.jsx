import React from "react";
import { History, ShieldAlert, Activity } from "lucide-react";
import DataTable from "../../../components/shared/DataTable";

const RecentAuditLogs = ({ logs }) => {
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
            "Transaction Link",
          ]}
          data={logs}
          loading={false}
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
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest border ${
                    log.severity === "CRITICAL"
                      ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                      : log.severity === "WARNING"
                        ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                        : "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                  }`}
                >
                  {log.severity === "CRITICAL" ? (
                    <ShieldAlert size={10} />
                  ) : (
                    <Activity size={10} />
                  )}
                  {log.severity}
                </span>
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

              {/* Transaction Link */}
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
