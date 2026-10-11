import React, { useState, useEffect } from "react";
import { Database, DownloadCloud, Activity, Loader2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";
import { backupService } from "../../services/sysadmin/backup.service";

// Universal UI Components
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import ActionButton from "../../components/ui/ActionButton";
import StatusBadge from "../../components/ui/StatusBadge";
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
  const ITEMS_PER_PAGE = 5;

  const [metrics, setMetrics] = useState({
    totalVolume: "0.00",
    successCount: 0,
    lastExecution: "STANDBY",
  });

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

      if (response.metrics) {
        setMetrics({
          totalVolume: response.metrics.totalVolume,
          successCount: response.metrics.successCount,
          lastExecution:
            response.metrics.lastExecution === "SUCCESS"
              ? "HEALTHY"
              : response.metrics.lastExecution === "FAILED"
                ? "CRITICAL"
                : "STANDBY",
        });
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackupLogs();
  }, [currentPage, debouncedSearchQuery]);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Database Backups"
        subtitle="System recoverability logs & snapshots"
        icon={Database}
      >
        {/* Universal Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search filenames..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        {/* Universal Action Button */}
        <ActionButton
          onClick={handleTriggerBackupClick}
          label={isTriggering ? "Compiling..." : "Create Backup"}
          icon={
            isTriggering
              ? (props) => (
                  <Loader2
                    {...props}
                    className={`animate-spin ${props.className || ""}`}
                  />
                )
              : DownloadCloud
          }
          className={
            isTriggering || loading
              ? "opacity-50 cursor-not-allowed pointer-events-none"
              : ""
          }
        />
      </PageHeader>

      {/* METRICS CARDS */}
      <BackupMetricsCards
        totalVolume={metrics.totalVolume}
        successCount={metrics.successCount}
        lastExecution={metrics.lastExecution}
      />

      {/* UNIVERSAL DATATABLE */}
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
          searchQuery ? "No matching backups found" : "No backup records found"
        }
        emptySubtitle={
          searchQuery
            ? "Try adjusting your search criteria."
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
              <StatusBadge
                label={log.backup_type}
                variant={log.backup_type === "AUTOMATED" ? "info" : "warning"}
              />
            </td>

            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 whitespace-nowrap">
              <p className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300">
                {log.file_size_mb}{" "}
                <span className="text-[10px] text-slate-400">MB</span>
              </p>
            </td>

            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 whitespace-nowrap">
              <StatusBadge
                label={log.status}
                variant={log.status === "SUCCESS" ? "success" : "danger"}
                icon={Activity}
              />
            </td>

            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 whitespace-nowrap">
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase truncate max-w-[100px] sm:max-w-none">
                {log.operator_name || "System Automation"}
              </p>
            </td>

            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 text-right whitespace-nowrap">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                {formatDate(log.created_at)}
              </p>
            </td>
          </tr>
        )}
      />

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
