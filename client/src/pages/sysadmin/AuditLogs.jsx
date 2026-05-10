import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Search,
  ShieldAlert,
  Terminal,
  Globe,
  User,
  MapPin,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  Lock,
  Database,
} from "lucide-react";
import { auditService } from "../../services/sysadmin/audit.service";
import { branchService } from "../../services/sysadmin/branch.service";

const AuditLogs = () => {
  // State: Data
  const [logs, setLogs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // State: UI & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  // State: Data Delta Modal
  const [selectedDelta, setSelectedDelta] = useState(null);

  // Initial Setup: Fetch active branches for the dropdown
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await branchService.getAllBranches();
        const activeBranches = (res.data || []).filter(
          (b) => b.is_active === true,
        );
        setBranches(activeBranches);
      } catch (err) {
        console.error("Failed to load branches for filter", err);
      }
    };
    loadBranches();
  }, []);

  // Debounce Search (Wait 500ms after user stops typing)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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
        branchId: branchFilter || undefined,
      };

      const response = await auditService.getLogs(params);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when dependencies change
  useEffect(() => {
    fetchLogs();
  }, [pagination.currentPage, debouncedSearch, severityFilter, branchFilter]);

  // Handle CSV Export
  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      await auditService.exportLogs({
        search: debouncedSearch || undefined,
        severity: severityFilter || undefined,
        branchId: branchFilter || undefined,
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
    switch (severity) {
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
    <div className="space-y-6 animate-in fade-in duration-700 w-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <ShieldAlert
              className="text-amber-600 dark:text-overdrive-yellow"
              size={24}
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Security Audit Logs
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 flex items-center gap-1">
              <Lock size={12} /> Immutable ledger of system actions and
              financial triggers.
            </p>
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-2xl flex items-center gap-3 font-bold text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="relative flex-1 w-full xl:max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search action or user..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-amber-500 text-xs font-bold font-mono transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPagination((p) => ({ ...p, currentPage: 1 }));
            }}
            className="px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-amber-500 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 appearance-none min-w-[150px] cursor-pointer"
          >
            <option value="">All Severities</option>
            <option value="INFO">🟢 Info</option>
            <option value="WARNING">🟡 Warning</option>
            <option value="CRITICAL">🔴 Critical</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setPagination((p) => ({ ...p, currentPage: 1 }));
            }}
            className="px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-amber-500 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 appearance-none min-w-[180px] cursor-pointer"
          >
            <option value="">All Branches / Global</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExport}
            disabled={isExporting || logs.length === 0 || isLoading}
            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
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

      {/* ACTIVITY TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl flex flex-col">
        <div className="overflow-x-auto">
          {/* Increased min-width to 1100px to accommodate the new Transaction Link column */}
          <table className="w-full text-left min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/40 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-5">Timestamp</th>
                <th className="px-6 py-5">User Identity</th>
                <th className="px-6 py-5">Action & Severity</th>
                <th className="px-6 py-5">Transaction Link</th>
                <th className="px-6 py-5">Data Delta</th>
                <th className="px-6 py-5 text-right">Network IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5 font-mono">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-8 py-12 text-center text-slate-500 font-bold animate-pulse"
                  >
                    Decrypting Audit Trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-8 py-12 text-center text-slate-500 font-bold"
                  >
                    No activity logs found matching your parameters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <Clock size={14} className="text-slate-400" />
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">
                            {formatDate(log.timestamp)}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            LOG-ID: {log.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
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
                    <td className="px-6 py-6">
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

                    {/* TRANSACTION LINKAGE COLUMN */}
                    <td className="px-6 py-6">
                      {log.target_resource ? (
                        <div className="flex flex-col gap-1 bg-slate-50 dark:bg-black/20 px-3 py-2 rounded-lg border border-slate-100 dark:border-white/5 w-fit">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Database size={10} /> {log.target_resource}
                          </span>
                          {log.target_id && (
                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">
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

                    <td className="px-6 py-6">
                      {log.old_values || log.new_values ? (
                        <button
                          onClick={() => setSelectedDelta(log)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                          <Eye size={12} /> View State
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium italic pl-2">
                          No Delta
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-400 group-hover:text-emerald-500 transition-colors">
                        <Globe size={12} /> {log.ip_address}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-left">
            Page {pagination.currentPage} of {pagination.totalPages || 1}
            <span className="ml-2 font-normal lowercase opacity-70">
              ({pagination.totalRecords} records)
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setPagination((p) => ({ ...p, currentPage: p.currentPage - 1 }))
              }
              disabled={!pagination.hasPrevPage || isLoading}
              className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 disabled:opacity-30 transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() =>
                setPagination((p) => ({ ...p, currentPage: p.currentPage + 1 }))
              }
              disabled={!pagination.hasNextPage || isLoading}
              className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 disabled:opacity-30 transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* DATA DELTA MODAL */}
      <AnimatePresence>
        {selectedDelta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDelta(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden z-10 border border-slate-200 dark:border-white/10 flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-black/20">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">
                    State Change Analysis
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 font-mono mt-1">
                    LOG-{selectedDelta.id} | {selectedDelta.action}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDelta(null)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-slate-400 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-100 dark:bg-slate-800/50">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Previous State (old_values)
                  </p>
                  <div className="bg-white dark:bg-black p-4 rounded-2xl text-[10px] sm:text-xs font-mono text-slate-700 dark:text-emerald-400 overflow-x-auto border border-slate-200 dark:border-white/5 shadow-inner min-h-[150px] max-h-[400px]">
                    <pre>
                      {selectedDelta.old_values
                        ? JSON.stringify(selectedDelta.old_values, null, 2)
                        : "/* No previous state */"}
                    </pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    New State (new_values)
                  </p>
                  <div className="bg-white dark:bg-black p-4 rounded-2xl text-[10px] sm:text-xs font-mono text-slate-700 dark:text-blue-400 overflow-x-auto border border-slate-200 dark:border-white/5 shadow-inner min-h-[150px] max-h-[400px]">
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
