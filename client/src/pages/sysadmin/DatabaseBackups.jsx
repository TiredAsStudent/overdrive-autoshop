import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  DownloadCloud,
  Activity,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
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

const ITEMS_PER_PAGE = 5;

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

  const [metrics, setMetrics] = useState({
    totalVolume: "0.00",
    successCount: 0,
    lastExecution: "STANDBY",
  });

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "info",
    onConfirm: () => {},
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const loadBackupLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await backupService.getBackupLogs(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
      );

      const fetchedLogs = response.data || [];
      const fetchedTotalPages = response.pagination?.totalPages || 1;

      if (fetchedLogs.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setLogs(fetchedLogs);
      setTotalPages(fetchedTotalPages);

      if (response.metrics) {
        const rawLastExec = response.metrics.lastExecution
          ?.toString()
          .toUpperCase();
        setMetrics({
          totalVolume: response.metrics.totalVolume ?? "0.00",
          successCount: response.metrics.successCount ?? 0,
          lastExecution:
            rawLastExec === "SUCCESS" || rawLastExec === "HEALTHY"
              ? "HEALTHY"
              : rawLastExec === "FAILED" || rawLastExec === "CRITICAL"
                ? "CRITICAL"
                : "STANDBY",
        });
      }
    } catch (error) {
      showToast(
        error.message || "Unable to load database backup logs.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, showToast]);

  useEffect(() => {
    loadBackupLogs();
  }, [loadBackupLogs]);

  // --- HANDLERS ---
  const executeLiveBackup = async () => {
    setIsTriggering(true);
    try {
      await backupService.triggerBackup();
      showToast(
        "System database backup successfully compiled and securely stored.",
        "success",
      );
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        await loadBackupLogs();
      }
    } catch (error) {
      showToast(error.message || "Failed to compile database backup.", "error");
      await loadBackupLogs();
    } finally {
      setIsTriggering(false);
    }
  };

  const handleTriggerBackupClick = () => {
    if (isTriggering || loading) return;
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Database Backups"
        subtitle="System recoverability logs & snapshots"
        icon={Database}
      >
        {/* Universal Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search filenames..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        {/* Universal Action Button */}
        <ActionButton
          onClick={handleTriggerBackupClick}
          label={isTriggering ? "Compiling..." : "Create Backup"}
          icon={DownloadCloud}
          loading={isTriggering}
          disabled={isTriggering || loading}
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
        caption="Database Backup Records"
        minWidth="min-w-[820px]"
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
        renderRow={(log) => {
          const normalizedType = log.backup_type?.toString().toUpperCase();
          const normalizedStatus = log.status?.toString().toUpperCase();
          const isSuccess = normalizedStatus === "SUCCESS";
          const operatorLabel = log.operator_name || "System Automation";

          return (
            <tr
              key={log.id}
              className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              {/* Backup Identity */}
              <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex items-center gap-3 sm:gap-3.5">
                  <div
                    aria-hidden="true"
                    className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-overdrive-yellow shrink-0"
                  >
                    <Database className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[160px] sm:max-w-[240px] lg:max-w-xs font-mono tabular-nums"
                      title={log.file_name}
                    >
                      {log.file_name}
                    </p>
                    <p className="text-[10px] font-mono tabular-nums font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">
                      ID: {log.id}
                    </p>
                  </div>
                </div>
              </td>

              {/* Execution Profile */}
              <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 whitespace-nowrap">
                <StatusBadge
                  label={log.backup_type || "MANUAL"}
                  variant={normalizedType === "AUTOMATED" ? "info" : "warning"}
                  icon={Activity}
                />
              </td>

              {/* Storage Size */}
              <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p className="text-xs sm:text-sm font-mono tabular-nums font-black text-slate-800 dark:text-slate-200">
                  {log.file_size_mb ?? "0.00"}{" "}
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    MB
                  </span>
                </p>
              </td>

              {/* Status */}
              <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 whitespace-nowrap">
                <StatusBadge
                  label={log.status || "UNKNOWN"}
                  variant={isSuccess ? "success" : "danger"}
                  icon={isSuccess ? ShieldCheck : AlertCircle}
                />
              </td>

              {/* Operator */}
              <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase truncate max-w-[130px] sm:max-w-[200px]"
                  title={operatorLabel}
                >
                  {operatorLabel}
                </p>
              </td>

              {/* Timestamp */}
              <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <p className="text-[11px] sm:text-xs font-mono tabular-nums font-medium text-slate-600 dark:text-slate-400">
                  {formatDate(log.created_at)}
                </p>
              </td>
            </tr>
          );
        }}
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
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        variant={confirmConfig.variant}
      />
    </div>
  );
};

export default DatabaseBackups;
