import React, { useState } from "react";
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Cpu as RamIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  Users,
  AlertCircle,
} from "lucide-react";

// ==========================================
// 🛑 MOCK DATA: FRONTEND-FIRST PROTOTYPING
// Simulates the JSON schema from the backend.
// ==========================================
const mockHealthData = {
  services: {
    apiGateway: { status: "HEALTHY", latency_ms: 15 },
    database: { status: "HEALTHY", latency_ms: 4 },
    fileStorage: { status: "HEALTHY", latency_ms: 45 },
  },
  resources: {
    cpuOverhead: 14,
    ramBuffer: { used_gb: 1.8, total_gb: 4.0, percentage: 45 },
    diskSpace: { used_gb: 42.1, total_gb: 250.0, percentage: 17 },
  },
  metrics: {
    activeSessionsCount: 8,
    databaseQueriesPerSec: 22,
    systemUptimeText: "12 Days, 6 Hours",
    failureRateOverhead: 0.0,
  },
};

const SystemHealth = () => {
  // State: Data & UI Controls
  const [healthData, setHealthData] = useState(mockHealthData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fake Refresh Handler (Simulates an API call)
  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate a 1.5-second network delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  // Helper: Status Indicator Badge Styles
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "HEALTHY":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
          icon: <CheckCircle2 size={14} className="shrink-0 animate-pulse" />,
          label: "Healthy",
        };
      case "DEGRADED":
        return {
          bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400",
          icon: <AlertTriangle size={14} className="shrink-0 animate-bounce" />,
          label: "Degraded",
        };
      case "OFFLINE":
      default:
        return {
          bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400",
          icon: <XCircle size={14} className="shrink-0" />,
          label: "Offline",
        };
    }
  };

  // Helper: Dynamic Progress Bar Color Logic
  const getProgressBarColor = (percentage) => {
    if (percentage >= 85) return "bg-rose-500 shadow-sm shadow-rose-500/30"; // Critical
    if (percentage >= 70) return "bg-amber-500 shadow-sm shadow-amber-500/30"; // Warning
    return "bg-emerald-500 shadow-sm shadow-emerald-500/30"; // Healthy/Optimal
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full pb-10">
      {/* 1. ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        {/* Header Title Section */}
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Activity className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              System Health
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Monitor server infrastructure and network status
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end w-full lg:w-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm shadow-amber-500/20 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw
              size={14}
              className={`${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Status"}
          </button>
        </div>
      </div>

      {/* 2. KPI PERFORMANCE COUNTERS GRID (Enlarged) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
        {/* KPI: System Uptime */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl sm:rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
          <div className="p-3.5 bg-blue-500/10 rounded-2xl text-blue-500 shrink-0">
            <Server size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              System Uptime
            </p>
            <p className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-1.5 truncate">
              {healthData.metrics.systemUptimeText}
            </p>
          </div>
        </div>

        {/* KPI: Database Queries */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl sm:rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
          <div className="p-3.5 bg-purple-500/10 rounded-2xl text-purple-500 shrink-0">
            <Zap size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Database Queries
            </p>
            <p className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-1.5 truncate">
              {healthData.metrics.databaseQueriesPerSec} / sec
            </p>
          </div>
        </div>

        {/* KPI: Active Sessions */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl sm:rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
          <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-500 shrink-0">
            <Users size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Active Sessions
            </p>
            <p className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-1.5 truncate">
              {healthData.metrics.activeSessionsCount} Accounts
            </p>
          </div>
        </div>

        {/* KPI: Error Rate */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl sm:rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
          <div className="p-3.5 bg-rose-500/10 rounded-2xl text-rose-500 shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Error Rate
            </p>
            <p className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-1.5 truncate">
              {(healthData.metrics.failureRateOverhead * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* 3. HARDWARE & BACKBONE DIAGNOSTICS SPLIT */}
      {/* Removed items-start so children automatically stretch to equal heights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* LEFT COLUMN: HARDWARE RESOURCES */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm lg:col-span-7 flex flex-col h-full w-full">
          <div className="mb-8">
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 dark:text-white tracking-tight italic flex items-center gap-2">
              <Cpu className="text-amber-500" size={18} />
              Hardware Resources
            </h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              Live server capacity limits
            </p>
          </div>

          <div className="space-y-8 flex-1">
            {/* CPU Usage */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                <span className="text-slate-600 dark:text-slate-300">
                  CPU Usage
                </span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {healthData.resources.cpuOverhead}%
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden border border-slate-200/20 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${getProgressBarColor(healthData.resources.cpuOverhead)}`}
                  style={{ width: `${healthData.resources.cpuOverhead}%` }}
                />
              </div>
            </div>

            {/* Memory (RAM) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                <span className="text-slate-600 dark:text-slate-300">
                  Memory (RAM)
                </span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {healthData.resources.ramBuffer.used_gb} /{" "}
                  {healthData.resources.ramBuffer.total_gb} GB (
                  {healthData.resources.ramBuffer.percentage}%)
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden border border-slate-200/20 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${getProgressBarColor(healthData.resources.ramBuffer.percentage)}`}
                  style={{
                    width: `${healthData.resources.ramBuffer.percentage}%`,
                  }}
                />
              </div>
            </div>

            {/* Storage Space */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                <span className="text-slate-600 dark:text-slate-300">
                  Storage Space
                </span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {healthData.resources.diskSpace.used_gb} /{" "}
                  {healthData.resources.diskSpace.total_gb} GB (
                  {healthData.resources.diskSpace.percentage}%)
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden border border-slate-200/20 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${getProgressBarColor(healthData.resources.diskSpace.percentage)}`}
                  style={{
                    width: `${healthData.resources.diskSpace.percentage}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SYSTEM SERVICES */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm lg:col-span-5 flex flex-col h-full w-full">
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 dark:text-white tracking-tight italic flex items-center gap-2">
              <Activity className="text-amber-500" size={18} />
              System Services
            </h2>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
              Live network connection status
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5 flex flex-col justify-around flex-1">
            {/* API Gateway */}
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 shrink-0">
                  <Server size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-white uppercase">
                    API Gateway
                  </p>
                  <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                    Ping: {healthData.services.apiGateway.latency_ms}ms
                  </p>
                </div>
              </div>
              {(() => {
                const styles = getStatusBadge(
                  healthData.services.apiGateway.status,
                );
                return (
                  <span
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 ${styles.bg}`}
                  >
                    {styles.icon} {styles.label}
                  </span>
                );
              })()}
            </div>

            {/* Database System */}
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 shrink-0">
                  <Database size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-white uppercase">
                    Database System
                  </p>
                  <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                    Pool Link: {healthData.services.database.latency_ms}ms
                  </p>
                </div>
              </div>
              {(() => {
                const styles = getStatusBadge(
                  healthData.services.database.status,
                );
                return (
                  <span
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 ${styles.bg}`}
                  >
                    {styles.icon} {styles.label}
                  </span>
                );
              })()}
            </div>

            {/* File Storage */}
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 shrink-0">
                  <HardDrive size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-white uppercase">
                    File Storage
                  </p>
                  <p className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                    Write Speed: {healthData.services.fileStorage.latency_ms}ms
                  </p>
                </div>
              </div>
              {(() => {
                const styles = getStatusBadge(
                  healthData.services.fileStorage.status,
                );
                return (
                  <span
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 ${styles.bg}`}
                  >
                    {styles.icon} {styles.label}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
