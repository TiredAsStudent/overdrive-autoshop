import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  ShieldAlert,
  Terminal,
  Globe,
  User,
  MapPin,
  Clock,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import auditLogService from "../../services/auditLog.service";

const AdminActivityLogs = () => {
  // State: Data
  const [logs, setLogs] = useState([]);
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Debounce Search (Wait 500ms after user stops typing to update filter)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 2. Fetch Data whenever Page or Debounced Search changes
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await auditLogService.getLogs({
          page: pagination.currentPage,
          limit: 15, // Load 15 logs per page
          search: debouncedSearch,
        });
        setLogs(data.logs);
        setPagination(data.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [pagination.currentPage, debouncedSearch]);

  // 3. Pagination Handlers
  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  // Helper to format PostgreSQL timestamp into a readable date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* AUDIT STATUS HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
            Enterprise Audit Trail
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Permanent, read-only record of all system-wide operations.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <ShieldAlert className="text-emerald-500" size={16} />
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
            Tamper-Proof Integrity Active
          </span>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-2xl flex items-center gap-3 font-bold text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* LOG CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="relative flex-1 w-full lg:max-w-xl">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search logs by User, Action, or Resource..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl outline-none focus:border-amber-500 text-xs font-bold font-mono transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-500 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
            <Filter size={16} /> Filter
          </button>
          <button className="flex-1 lg:flex-none px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg">
            <Download size={16} /> Export Logs
          </button>
        </div>
      </div>

      {/* ACTIVITY TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/40 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-8 py-5">Timestamp & ID</th>
                <th className="px-8 py-5">User & Context</th>
                <th className="px-8 py-5">System Action</th>
                <th className="px-8 py-5 text-right">Network IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5 font-mono">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-8 py-12 text-center text-slate-500 font-bold animate-pulse"
                  >
                    Decrypting Audit Trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-8 py-12 text-center text-slate-500 font-bold"
                  >
                    No activity logs found matching your search.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Clock size={14} className="text-slate-400" />
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">
                            {formatDate(log.timestamp)}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            LOG-{log.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase">
                            {log.user_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase rounded-sm">
                              {log.user_role}
                            </span>
                            <p className="text-[9px] text-slate-400 flex items-center gap-1 uppercase font-bold">
                              <MapPin size={8} /> {log.branch_context}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-start gap-2">
                        <Terminal
                          size={14}
                          className="text-blue-500 shrink-0 mt-0.5"
                        />
                        <p className="text-xs font-bold text-slate-600 dark:text-gray-300 leading-relaxed max-w-sm">
                          {log.action}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-400 group-hover:text-amber-500 transition-colors">
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
        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing Page {pagination.currentPage} of{" "}
            {pagination.totalPages || 1}
            <span className="ml-2 font-normal lowercase opacity-70">
              ({pagination.totalRecords} total records)
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={!pagination.hasPrevPage || isLoading}
              className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextPage}
              disabled={!pagination.hasNextPage || isLoading}
              className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* SECURITY DISCLOSURE */}
      <div className="p-8 bg-slate-900 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute left-0 top-0 p-8 opacity-5">
          <History size={150} />
        </div>
        <div className="flex items-start gap-4 z-10">
          <div className="p-4 bg-amber-500 rounded-2xl text-slate-900">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-black uppercase text-sm tracking-[0.2em] text-amber-500 italic">
              Accountability Declaration
            </h4>
            <p className="text-[11px] text-slate-400 max-w-2xl mt-2 leading-relaxed font-medium italic">
              "This log represents the immutable history of the Overdrive Auto
              Shop Enterprise. Every action performed by staff or administrators
              is cryptographically hashed and recorded. To maintain the highest
              level of trust, these records cannot be altered or purged."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Lock = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default AdminActivityLogs;
