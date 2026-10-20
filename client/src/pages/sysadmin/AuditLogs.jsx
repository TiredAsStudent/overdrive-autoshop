import React, { useState, useEffect, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  Terminal,
  Globe,
  User,
  MapPin,
  Clock,
  Download,
  Eye,
  X,
  Database,
  ChevronDown,
} from "lucide-react";

import { auditService } from "../../services/sysadmin/audit.service";
import { branchService } from "../../services/sysadmin/branch.service";
import { useDebounce } from "../../hooks/useDebounce";
import { useApp } from "../../context/AppContext";

// Universal UI Components
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import ActionButton from "../../components/ui/ActionButton";
import FilterButton from "../../components/ui/FilterButton";
import FilterModal from "../../components/shared/FilterModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import StatusBadge from "../../components/ui/StatusBadge";

const ITEMS_PER_PAGE = 15;

const AuditLogs = () => {
  const { showToast } = useApp();

  // Accessible IDs for Filter Controls & Delta Modal
  const branchSelectId = useId();
  const severitySelectId = useId();
  const startDateInputId = useId();
  const endDateInputId = useId();
  const deltaModalTitleId = useId();

  // State: Data
  const [logs, setLogs] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [branches, setBranches] = useState([]);

  // State: Pagination Object
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  // State: UI & Primary Controls
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // State: Advanced Filters
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // State: Data Delta Modal
  const [selectedDelta, setSelectedDelta] = useState(null);

  // Calculate active advanced filters for the badge
  const isDateRangeValid =
    Boolean(startDate && endDate) && startDate <= endDate;
  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) +
    (severityFilter !== "" ? 1 : 0) +
    (isDateRangeValid ? 1 : 0);

  // Close State Change Analysis modal on Escape key
  useEffect(() => {
    if (!selectedDelta) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedDelta(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedDelta]);

  // Initial Setup: Fetch dynamic severities and branches
  useEffect(() => {
    let isMounted = true;
    const loadSystemData = async () => {
      try {
        const [severitiesRes, branchesRes] = await Promise.all([
          auditService.getSeverities(),
          branchService.getAllBranches(1, 100, "", "active"),
        ]);
        if (isMounted) {
          setSeverities(severitiesRes.data || []);
          setBranches(branchesRes.data || []);
        }
      } catch (err) {
        console.error("Filter Load Error:", err);
        if (isMounted) {
          showToast("Failed to load system filters", "error");
        }
      }
    };
    loadSystemData();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const resetPageToFirst = () => {
    setPagination((prev) =>
      prev.currentPage === 1 ? prev : { ...prev, currentPage: 1 },
    );
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    resetPageToFirst();
  };

  const handleBranchFilterChange = (e) => {
    setBranchFilter(e.target.value);
    resetPageToFirst();
  };

  const handleSeverityFilterChange = (e) => {
    setSeverityFilter(e.target.value);
    resetPageToFirst();
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    resetPageToFirst();
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    resetPageToFirst();
  };

  // Fetch Logs based on filters and pagination
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        severity: severityFilter || undefined,
        branchId: branchFilter !== "all" ? branchFilter : undefined,
        startDate: isDateRangeValid ? `${startDate} 00:00:00` : undefined,
        endDate: isDateRangeValid ? `${endDate} 23:59:59.999` : undefined,
      };

      const response = await auditService.getLogs(params);
      const fetchedLogs = response.data || [];
      const fetchedTotalPages = response.pagination?.totalPages || 1;

      if (
        fetchedLogs.length === 0 &&
        pagination.currentPage > fetchedTotalPages
      ) {
        setPagination((prev) => ({
          ...prev,
          currentPage: Math.max(1, fetchedTotalPages),
        }));
        return;
      }

      setLogs(fetchedLogs);

      if (response.pagination) {
        setPagination((prev) => ({
          ...prev,
          totalPages: response.pagination.totalPages || 1,
          totalRecords: response.pagination.totalItems || 0,
        }));
      }
    } catch (err) {
      showToast(err.message || "Failed to load audit logs", "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.currentPage,
    debouncedSearch,
    severityFilter,
    branchFilter,
    startDate,
    endDate,
    isDateRangeValid,
    showToast,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle CSV Export mapping the same parameters
  const handleExport = async () => {
    if (isExporting || logs.length === 0 || isLoading) return;
    setIsExporting(true);
    try {
      await auditService.exportLogs({
        search: debouncedSearch || undefined,
        severity: severityFilter || undefined,
        branchId: branchFilter !== "all" ? branchFilter : undefined,
        startDate: isDateRangeValid ? `${startDate} 00:00:00` : undefined,
        endDate: isDateRangeValid ? `${endDate} 23:59:59.999` : undefined,
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

  // Helper: Map severity to standardized StatusBadge variant and icon
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

  const resetAdvancedFilters = () => {
    setBranchFilter("all");
    setSeverityFilter("");
    setStartDate("");
    setEndDate("");
    resetPageToFirst();
    setIsFilterModalOpen(false);
  };

  const hasPartialDates = Boolean(
    (startDate && !endDate) || (!startDate && endDate),
  );
  const hasInvertedDates = Boolean(startDate && endDate && startDate > endDate);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative w-full pb-10">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Audit Trail"
        subtitle="Track user actions and system changes"
        icon={ShieldAlert}
      >
        {/* Universal Search Bar */}
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search action, user, or IP..."
          isSearching={searchTerm !== debouncedSearch}
        />

        {/* Universal Filter Button */}
        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        {/* Universal Export Button */}
        <ActionButton
          onClick={handleExport}
          label={isExporting ? "Exporting..." : "Export CSV"}
          icon={Download}
          loading={isExporting}
          disabled={isExporting || logs.length === 0 || isLoading}
        />
      </PageHeader>

      {/* UNIVERSAL DATATABLE COMPONENT */}
      <DataTable
        caption="System Audit Trail Records"
        minWidth="min-w-[1050px]"
        headers={[
          "Timestamp",
          "Operator",
          "Action & Severity",
          "Target Resource",
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
            className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
          >
            {/* Timestamp */}
            <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <Clock
                  size={14}
                  aria-hidden="true"
                  className="text-slate-400 dark:text-slate-500 shrink-0"
                />
                <div>
                  <p className="text-xs font-mono tabular-nums font-black text-slate-900 dark:text-white">
                    {formatDate(log.timestamp)}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                    LOG-ID: {log.id}
                  </p>
                </div>
              </div>
            </td>

            {/* Operator */}
            <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="h-9 w-9 bg-slate-100 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-overdrive-yellow transition-colors shrink-0"
                >
                  <User size={16} />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-xs font-black text-slate-900 dark:text-white uppercase truncate max-w-[180px]"
                    title={log.user_name}
                  >
                    {log.user_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[9px] font-black uppercase tracking-wider rounded-md border border-slate-200/60 dark:border-white/5">
                      {log.user_role}
                    </span>
                    <span
                      className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase font-bold truncate max-w-[140px]"
                      title={log.branch_context}
                    >
                      {log.branch_context === "Enterprise Global" ? (
                        <Globe
                          size={11}
                          aria-hidden="true"
                          className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                        />
                      ) : (
                        <MapPin
                          size={11}
                          aria-hidden="true"
                          className="text-blue-500 dark:text-blue-400 shrink-0"
                        />
                      )}
                      <span className="truncate">{log.branch_context}</span>
                    </span>
                  </div>
                </div>
              </div>
            </td>

            {/* Action & Severity */}
            <td className="px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex flex-col items-start gap-1.5">
                <StatusBadge
                  label={log.severity || "INFO"}
                  variant={getSeverityVariant(log.severity)}
                  icon={getSeverityIcon(log.severity)}
                />
                <div className="flex items-start gap-2 w-full">
                  <Terminal
                    size={14}
                    aria-hidden="true"
                    className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5"
                  />
                  <p
                    className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight max-w-[200px] sm:max-w-[260px] truncate"
                    title={log.action}
                  >
                    {log.action}
                  </p>
                </div>
              </div>
            </td>

            {/* Target Resource */}
            <td className="px-4 sm:px-6 py-4 sm:py-5">
              {log.target_resource ? (
                <div className="flex flex-col gap-1 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-white/5 w-fit max-w-[160px] sm:max-w-[210px]">
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 truncate w-full">
                    <Database
                      size={11}
                      aria-hidden="true"
                      className="shrink-0"
                    />
                    <span className="truncate" title={log.target_resource}>
                      {log.target_resource}
                    </span>
                  </span>
                  {log.target_id && (
                    <span
                      className="text-[11px] font-black text-slate-800 dark:text-slate-200 font-mono tabular-nums truncate w-full"
                      title={String(log.target_id)}
                    >
                      REF ID: {log.target_id}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic pl-2 whitespace-nowrap">
                  Unlinked
                </span>
              )}
            </td>

            {/* Data Delta View Button */}
            <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
              {log.old_values || log.new_values ? (
                <button
                  type="button"
                  onClick={() => setSelectedDelta(log)}
                  aria-label={`View state changes for log ID ${log.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-amber-500/15 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-overdrive-yellow border border-slate-200/80 dark:border-white/10 hover:border-amber-300 dark:hover:border-amber-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                >
                  <Eye size={13} aria-hidden="true" />
                  <span>View State</span>
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic pl-2">
                  No Delta
                </span>
              )}
            </td>

            {/* Network IP */}
            <td className="px-4 sm:px-6 py-4 sm:py-5 text-right whitespace-nowrap">
              <div className="inline-flex items-center justify-end gap-1.5 font-mono tabular-nums text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                <Globe size={12} aria-hidden="true" />
                <span>{log.ip_address || "N/A"}</span>
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

      {/* UNIVERSAL FILTER MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetAdvancedFilters}
        title="Advanced Audit Filters"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={branchSelectId} className="form-label">
                Branch Location
              </label>
              <div className="relative">
                <select
                  id={branchSelectId}
                  value={branchFilter}
                  onChange={handleBranchFilterChange}
                  className="form-select appearance-none pr-9 cursor-pointer"
                >
                  <option value="all">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  aria-hidden="true"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor={severitySelectId} className="form-label">
                Severity Level
              </label>
              <div className="relative">
                <select
                  id={severitySelectId}
                  value={severityFilter}
                  onChange={handleSeverityFilterChange}
                  className="form-select appearance-none pr-9 cursor-pointer"
                >
                  <option value="">All Severities</option>
                  {severities.map((sev) => (
                    <option key={sev} value={sev}>
                      {sev.charAt(0) + sev.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  aria-hidden="true"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={startDateInputId} className="form-label">
                Start Date
              </label>
              <input
                id={startDateInputId}
                type="date"
                max={endDate || undefined}
                value={startDate}
                onChange={handleStartDateChange}
                className="form-input font-mono tabular-nums cursor-pointer"
              />
            </div>

            <div>
              <label htmlFor={endDateInputId} className="form-label">
                End Date
              </label>
              <input
                id={endDateInputId}
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={handleEndDateChange}
                className="form-input font-mono tabular-nums cursor-pointer"
              />
            </div>
          </div>

          {hasPartialDates && (
            <p
              role="status"
              className="text-[10px] text-amber-600 dark:text-overdrive-yellow font-bold tracking-wider uppercase text-center pt-1"
            >
              Note: Both dates must be selected to filter by date range.
            </p>
          )}

          {hasInvertedDates && (
            <p
              role="alert"
              className="text-[10px] text-red-600 dark:text-red-400 font-bold tracking-wider uppercase text-center pt-1"
            >
              Start Date cannot be later than End Date.
            </p>
          )}
        </div>
      </FilterModal>

      {/* JSON STATE ANALYSIS MODAL */}
      <AnimatePresence>
        {selectedDelta && (
          <div
            onClick={() => setSelectedDelta(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={deltaModalTitleId}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-4">
                  <div
                    aria-hidden="true"
                    className="h-10 w-10 sm:h-12 sm:w-12 bg-amber-500/10 border border-amber-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-600 dark:text-overdrive-yellow shrink-0"
                  >
                    <Database size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2
                      id={deltaModalTitleId}
                      className="text-base sm:text-lg lg:text-xl font-black italic text-slate-900 dark:text-white uppercase tracking-tight truncate"
                    >
                      State Change Analysis
                    </h2>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5 uppercase tracking-widest flex items-center gap-2 truncate w-full">
                      <span className="shrink-0">LOG-{selectedDelta.id}</span>
                      <span
                        aria-hidden="true"
                        className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0"
                      />
                      <span className="truncate" title={selectedDelta.action}>
                        {selectedDelta.action}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDelta(null)}
                  aria-label="Close state change analysis modal"
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 lg:p-8 overflow-y-auto flex-1 bg-slate-50/70 dark:bg-slate-900/40 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  {/* Old Values Block */}
                  <section className="space-y-2.5 flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"
                      />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 truncate">
                        Previous State (old_values)
                      </h3>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl text-[11px] sm:text-xs font-mono text-emerald-800 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-white/10 flex-1 min-h-[160px] lg:min-h-[220px] max-h-[340px] lg:max-h-[460px] overflow-auto custom-scrollbar">
                      <pre className="whitespace-pre-wrap break-words leading-relaxed">
                        {selectedDelta.old_values
                          ? JSON.stringify(selectedDelta.old_values, null, 2)
                          : "/* No previous state */"}
                      </pre>
                    </div>
                  </section>

                  {/* New Values Block */}
                  <section className="space-y-2.5 flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full bg-blue-500 shrink-0"
                      />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 truncate">
                        New State (new_values)
                      </h3>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl text-[11px] sm:text-xs font-mono text-blue-800 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-white/10 flex-1 min-h-[160px] lg:min-h-[220px] max-h-[340px] lg:max-h-[460px] overflow-auto custom-scrollbar">
                      <pre className="whitespace-pre-wrap break-words leading-relaxed">
                        {selectedDelta.new_values
                          ? JSON.stringify(selectedDelta.new_values, null, 2)
                          : "/* No new state */"}
                      </pre>
                    </div>
                  </section>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedDelta(null)}
                  className="w-full sm:w-auto px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer"
                >
                  Close Analysis
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditLogs;
