import React, { useState, useEffect } from "react";
import {
  Database,
  DownloadCloud,
  Activity,
  Search,
  Loader2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";
import { backupService } from "../../services/sysadmin/backup.service";

import ConfirmModal from "../../components/shared/ConfirmModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import BackupMetricsCards from "../../features/sysadmin/components/BackupMetricsCards";

const DatabaseBackups = () => {
  const { showToast } = useApp();

  // --- STATE MANAGEMENT ---
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArchives, setTotalArchives] = useState(0);
  const ITEMS_PER_PAGE = 5;

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "info",
    onConfirm: () => {},
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  const loadBackupLogs = async () => {
    try {
      setLoading(true);
      const response = await backupService.getBackupLogs(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
      );

      setLogs(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalArchives(response.pagination?.totalItems || 0);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackupLogs();
  }, [currentPage, debouncedSearchQuery]);

  const totalVolume = logs
    .reduce((acc, log) => acc + parseFloat(log.file_size_mb || 0), 0)
    .toFixed(2);
  const lastExecution =
    logs.length > 0
      ? logs[0].status === "SUCCESS"
        ? "HEALTHY"
        : "CRITICAL"
      : "STANDBY";

  // --- HANDLERS ---
  const handleTriggerBackupClick = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Create Backup",
      message:
        "This will compile a complete point-in-time snapshot of the database architecture. The system may experience a slight drop in query speeds while compiling. Do you wish to proceed?",
      confirmText: "Create Backup",
      cancelText: "Cancel",
      variant: "warning",
      onConfirm: executeLiveBackup,
    });
  };

  const executeLiveBackup = async () => {
    setIsTriggering(true);
    try {
      await backupService.triggerBackup();
      showToast(
        "System database backup successfully compiled and securely stored.",
        "success",
      );
      await loadBackupLogs();
    } catch (error) {
      showToast(error.message, "error");
      await loadBackupLogs();
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* ACTION BAR / HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Database className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Database Backups
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              System recoverability logs & snapshots
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Debounced Search Input */}
          <div className="relative w-full sm:max-w-xs lg:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchQuery !== debouncedSearchQuery ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search filenames..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <button
            onClick={handleTriggerBackupClick}
            disabled={isTriggering || loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-sm shadow-amber-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTriggering ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Compiling...
              </>
            ) : (
              <>
                <DownloadCloud size={16} /> Trigger Backup
              </>
            )}
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <BackupMetricsCards
        totalVolume={totalVolume}
        successCount={totalArchives}
        lastExecution={lastExecution}
      />

      {/* DATATABLE LEDGER */}
      <div className="w-full overflow-hidden rounded-2xl sm:rounded-[32px] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-sm">
        <DataTable
          headers={[
            "Backup Identity",
            "Execution Profile",
            "Storage Size",
            "Status",
            "Operator",
            "Timestamp",
          ]}
          data={logs}
          loading={loading}
          emptyTitle={
            searchQuery
              ? "No matching backups found"
              : "No backup records found"
          }
          emptySubtitle={
            searchQuery
              ? "Try adjusting your search query."
              : "System snapshots will appear here once executed."
          }
          renderRow={(log) => (
            <tr
              key={log.id}
              className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/50 shrink-0">
                    <Database className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-overdrive-yellow" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[150px] sm:max-w-[200px] lg:max-w-xs font-mono">
                      {log.file_name}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                      ID: {log.id}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest border ${
                    log.backup_type === "AUTOMATED"
                      ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
                      : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                  }`}
                >
                  {log.backup_type}
                </span>
              </td>

              <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 whitespace-nowrap">
                <p className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300">
                  {log.file_size_mb}{" "}
                  <span className="text-[10px] text-slate-400">MB</span>
                </p>
              </td>

              <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 whitespace-nowrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${
                    log.status === "SUCCESS"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                      : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20"
                  }`}
                >
                  <Activity size={12} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  {log.status}
                </span>
              </td>

              <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 whitespace-nowrap">
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase truncate max-w-[100px] sm:max-w-none">
                  {log.operator_name || "System Automation"}
                </p>
              </td>

              <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 text-right whitespace-nowrap">
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </td>
            </tr>
          )}
        />
      </div>

      {/* PAGINATION */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* CONFIRM MODAL */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
      />
    </div>
  );
};

export default DatabaseBackups;
