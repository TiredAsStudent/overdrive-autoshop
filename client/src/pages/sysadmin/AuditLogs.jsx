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
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  Database,
  Loader2,
} from "lucide-react";

import { auditService } from "../../services/sysadmin/audit.service";
import { useDebounce } from "../../hooks/useDebounce";

import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";

const AuditLogs = () => {
  // State: Data
  const [logs, setLogs] = useState([]);
  const [severities, setSeverities] = useState([]); // Dynamic severities

  // State: Pagination Object
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  // State: UI & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500); // 500ms delay to prevent API spam
  const [severityFilter, setSeverityFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  // State: Data Delta Modal
  const [selectedDelta, setSelectedDelta] = useState(null);

  // Initial Setup: Fetch dynamic severities for the dropdown filter
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const severitiesRes = await auditService.getSeverities();
        setSeverities(severitiesRes.data || []);
      } catch (err) {
        console.error("Failed to load severities", err);
      }
    };
    loadFilters();
  }, []);

  // Reset to page 1 whenever a filter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [debouncedSearch, severityFilter]);

  // Fetch Logs based on filters and pagination
  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.currentPage,
        limit: 15,
        search: debouncedSearch || undefined,
        severity: severityFilter || undefined,
        // Branch filter is completely removed
      };

      const response = await auditService.getLogs(params);
      setLogs(response.data || []);

      // Update pagination state matching the universal response format
      if (response.pagination) {
        setPagination((prev) => ({
          ...prev,
          totalPages: response.pagination.totalPages,
          totalRecords: response.pagination.totalItems,
        }));
      }
    } catch (err) {
      setError(err.message);
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
    setError(null);
    try {
      await auditService.exportLogs({
        search: debouncedSearch || undefined,
        severity: severityFilter || undefined,
      });
    } catch (err) {
      setError(err.message);
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
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        {/* Header Title Section */}
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Universal Search Bar */}
          <div className="relative w-full sm:max-w-xs lg:w-64">
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
          <div className="relative w-full sm:w-auto min-w-[160px]">
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

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-3 shadow-sm text-sm text-red-600 font-bold">
          <AlertCircle size={18} className="shrink-0" />
          <p className="truncate">{error}</p>
        </div>
      )}

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
            <td className="px-4 sm:px-6 py-4 sm:py-6">
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
            <td className="px-4 sm:px-6 py-4 sm:py-6">
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
                <div className="flex items-start gap-2 mt-1">
                  <Terminal
                    size={14}
                    className="text-slate-400 shrink-0 mt-0.5"
                  />
                  <p
                    className="text-xs font-bold text-slate-700 dark:text-gray-300 leading-tight max-w-[250px] truncate"
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
                <div className="flex flex-col gap-1 bg-slate-50 dark:bg-black/20 px-3 py-2 rounded-lg border border-slate-100 dark:border-white/5 w-fit">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Database size={10} /> {log.target_resource}
                  </span>
                  {log.target_id && (
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">
                      REF ID: {log.target_id}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium italic pl-2">
                  Unlinked
                </span>
              )}
            </td>

            {/* Data Delta View Button */}
            <td className="px-4 sm:px-6 py-4 sm:py-6">
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
            <td className="px-4 sm:px-6 py-4 sm:py-6 text-right">
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-black/20 shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                    State Change Analysis
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 font-mono mt-1 uppercase tracking-widest">
                    LOG-{selectedDelta.id} | {selectedDelta.action}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDelta(null)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-slate-400 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-100 dark:bg-slate-800/50 custom-scrollbar">
                <div className="space-y-2 flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Previous State (old_values)
                  </p>
                  <div className="bg-white dark:bg-black p-4 rounded-2xl text-[10px] sm:text-xs font-mono text-slate-700 dark:text-emerald-400 shadow-inner border border-slate-200 dark:border-white/5 flex-1 min-h-[150px] max-h-[400px] overflow-x-auto custom-scrollbar">
                    <pre>
                      {selectedDelta.old_values
                        ? JSON.stringify(selectedDelta.old_values, null, 2)
                        : "/* No previous state */"}
                    </pre>
                  </div>
                </div>
                <div className="space-y-2 flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    New State (new_values)
                  </p>
                  <div className="bg-white dark:bg-black p-4 rounded-2xl text-[10px] sm:text-xs font-mono text-slate-700 dark:text-blue-400 shadow-inner border border-slate-200 dark:border-white/5 flex-1 min-h-[150px] max-h-[400px] overflow-x-auto custom-scrollbar">
                    <pre>
                      {selectedDelta.new_values
                        ? JSON.stringify(selectedDelta.new_values, null, 2)
                        : "/* No new state */"}
                    </pre>
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
