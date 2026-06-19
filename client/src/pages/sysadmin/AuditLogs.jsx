import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShieldAlert,
  Terminal,
  Globe,
  User,
  MapPin,
  Clock,
  Download,
  Eye,
  RefreshCw,
  X,
  Database,
  Loader2,
} from "lucide-react";

import { auditService } from "../../services/sysadmin/audit.service";
import { useDebounce } from "../../hooks/useDebounce";
import { useApp } from "../../context/AppContext";

import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";

const AuditLogs = () => {
  const { showToast } = useApp();

  // State: Data
  const [logs, setLogs] = useState([]);
  const [severities, setSeverities] = useState([]);

  // State: Pagination Object
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  // State: UI & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [severityFilter, setSeverityFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // State: Data Delta Modal
  const [selectedDelta, setSelectedDelta] = useState(null);

  // Initial Setup: Fetch dynamic severities for the dropdown filter
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const severitiesRes = await auditService.getSeverities();
        setSeverities(severitiesRes.data || []);
      } catch (err) {
        showToast("Failed to load severity filters", "error");
      }
    };
    loadFilters();
  }, [showToast]);

  // Reset to page 1 whenever a filter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [debouncedSearch, severityFilter]);

  // Fetch Logs based on filters and pagination
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: 15,
        search: debouncedSearch || undefined,
        severity: severityFilter || undefined,
      };

      const response = await auditService.getLogs(params);
      setLogs(response.data || []);

      if (response.pagination) {
        setPagination((prev) => ({
          ...prev,
          totalPages: response.pagination.totalPages,
          totalRecords: response.pagination.totalItems,
        }));
      }
    } catch (err) {
      showToast(err.message || "Failed to load audit logs", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when dependencies change
  useEffect(() => {
    fetchLogs();
  }, [pagination.currentPage, debouncedSearch, severityFilter]);

  // Handle CSV Export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await auditService.exportLogs({
        search: debouncedSearch || undefined,
        severity: severityFilter || undefined,
      });
      showToast("Audit logs exported successfully", "success");
    } catch (err) {
      showToast(err.message || "Failed to export logs", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper: Format PostgreSQL timestamp
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Helper: Severity Badge Colors
  const getSeverityStyles = (severity) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20";
      case "WARNING":
        return "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
      case "INFO":
      default:
        return "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full pb-10">
      {/* ACTION BAR */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        {/* Header Title Section */}
        <div className="flex items-center gap-3 sm:gap-4 w-full xl:w-auto min-w-0">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <ShieldAlert className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Audit Trail
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Track user actions and system changes
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto">
          {/* Universal Search Bar */}
          <div className="relative w-full sm:flex-1 xl:w-64 xl:flex-none min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchTerm !== debouncedSearch ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search action, user, or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Dynamic Server-Side Severities Dropdown */}
          <div className="relative w-full sm:flex-1 xl:w-auto xl:flex-none min-w-[160px]">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
            >
              <option value="">All Severities</option>
              {severities.map((sev) => (
                <option key={sev} value={sev}>
                  {sev === "INFO"
                    ? "🟢 Info"
                    : sev === "WARNING"
                      ? "🟡 Warning"
                      : sev === "CRITICAL"
                        ? "🔴 Critical"
                        : sev}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || logs.length === 0 || isLoading}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isExporting ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isExporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* UNIVERSAL DATATABLE COMPONENT */}
      <DataTable
        minWidth="min-w-[1100px]"
        headers={[
          "Timestamp",
          "User Identity",
          "Action & Severity",
          "Transaction Link",
          "Data Delta",
          "Network IP",
        ]}
        data={logs}
        loading={isLoading}
        emptyTitle="No activity logs found"
        emptySubtitle="Try adjusting your search criteria or changing your filters."
        renderRow={(log) => (
          <tr
            key={log.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            {/* Timestamp */}
            <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <Clock size={14} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {formatDate(log.timestamp)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                    LOG-ID: {log.id}
                  </p>
                </div>
              </div>
            </td>

            {/* User Identity */}
            <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors shrink-0">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase">
                    {log.user_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[8px] font-black uppercase rounded-sm">
                      {log.user_role}
                    </span>
                    <p className="text-[9px] text-slate-400 flex items-center gap-1 uppercase font-bold">
                      <MapPin size={8} /> {log.branch_context}
                    </p>
                  </div>
                </div>
              </div>
            </td>

            {/* Action & Severity */}
            <td className="px-4 sm:px-6 py-4 sm:py-6">
              <div className="flex flex-col items-start gap-1">
                <span
                  className={`px-2 py-0.5 border text-[8px] font-black uppercase rounded-sm ${getSeverityStyles(
                    log.severity,
                  )}`}
                >
                  {log.severity}
                </span>
                <div className="flex items-start gap-2 mt-1 w-full">
                  <Terminal
                    size={14}
                    className="text-slate-400 shrink-0 mt-0.5"
                  />
                  <p
                    className="text-xs font-bold text-slate-700 dark:text-gray-300 leading-tight max-w-[200px] sm:max-w-[250px] truncate"
                    title={log.action}
                  >
                    {log.action}
                  </p>
                </div>
              </div>
            </td>

            {/* Transaction Link */}
            <td className="px-4 sm:px-6 py-4 sm:py-6">
              {log.target_resource ? (
                <div className="flex flex-col gap-1 bg-slate-50 dark:bg-black/20 px-3 py-2 rounded-lg border border-slate-100 dark:border-white/5 w-fit max-w-[150px] sm:max-w-[200px]">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 truncate w-full">
                    <Database size={10} className="shrink-0" />
                    <span className="truncate" title={log.target_resource}>
                      {log.target_resource}
                    </span>
                  </span>
                  {log.target_id && (
                    <span
                      className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono truncate w-full"
                      title={log.target_id}
                    >
                      REF ID: {log.target_id}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium italic pl-2 whitespace-nowrap">
                  Unlinked
                </span>
              )}
            </td>

            {/* Data Delta View Button */}
            <td className="px-4 sm:px-6 py-4 sm:py-6 whitespace-nowrap">
              {log.old_values || log.new_values ? (
                <button
                  type="button"
                  onClick={() => setSelectedDelta(log)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <Eye size={12} /> View State
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium italic pl-2">
                  No Delta
                </span>
              )}
            </td>

            {/* Network IP */}
            <td className="px-4 sm:px-6 py-4 sm:py-6 text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-2 font-mono text-[10px] font-black text-slate-400 group-hover:text-emerald-500 transition-colors">
                <Globe size={12} /> {log.ip_address}
              </div>
            </td>
          </tr>
        )}
      />

      {/* UNIVERSAL PAGINATION COMPONENT */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) =>
          setPagination((prev) => ({ ...prev, currentPage: page }))
        }
      />

      {/* JSON STATE ANALYSIS MODAL */}
      <AnimatePresence>
        {selectedDelta && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDelta(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
            >
              <div className="px-4 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-start bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-amber-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
                    <Database size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                      State Change Analysis
                    </h3>
                    <p className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-slate-500 font-mono mt-1 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 truncate w-full">
                      <span className="shrink-0">LOG-{selectedDelta.id}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0"></span>
                      <span className="truncate" title={selectedDelta.action}>
                        {selectedDelta.action}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDelta(null)}
                  className="p-2 sm:p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer shrink-0 mt-1 sm:mt-0"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-800/50 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  {/* Old Values Block */}
                  <div className="space-y-2 sm:space-y-3 flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></div>
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">
                        Previous State (old_values)
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl text-[10px] sm:text-xs font-mono text-slate-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-white/5 flex-1 min-h-[150px] lg:min-h-[200px] max-h-[300px] lg:max-h-[500px] overflow-x-auto custom-scrollbar">
                      <pre>
                        {selectedDelta.old_values
                          ? JSON.stringify(selectedDelta.old_values, null, 2)
                          : "/* No previous state */"}
                      </pre>
                    </div>
                  </div>

                  {/* New Values Block */}
                  <div className="space-y-2 sm:space-y-3 flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></div>
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate">
                        New State (new_values)
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl text-[10px] sm:text-xs font-mono text-slate-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-white/5 flex-1 min-h-[150px] lg:min-h-[200px] max-h-[300px] lg:max-h-[500px] overflow-x-auto custom-scrollbar">
                      <pre>
                        {selectedDelta.new_values
                          ? JSON.stringify(selectedDelta.new_values, null, 2)
                          : "/* No new state */"}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditLogs;
