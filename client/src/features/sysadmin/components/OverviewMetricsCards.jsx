import React from "react";
import {
  Building2,
  Users,
  HardDrive,
  ShieldCheck,
  ServerCrash,
  Clock,
} from "lucide-react";
import StatCard from "../../../components/ui/StatCard";

const OverviewMetricsCards = ({ metrics = {} }) => {
  const normalizedBackupStatus = (metrics.backupStatus || "SYNCING")
    .toString()
    .toUpperCase();

  const getBackupStatusVariant = (status) => {
    if (status === "HEALTHY") return "success";
    if (status === "SYNCING" || status === "STANDBY" || status === "WARNING")
      return "warning";
    return "danger";
  };

  const getBackupStatusIcon = (status) => {
    if (status === "HEALTHY") return ShieldCheck;
    if (status === "SYNCING" || status === "STANDBY" || status === "WARNING")
      return Clock;
    return ServerCrash;
  };

  return (
    <section
      aria-label="System Overview Metrics"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 w-full"
    >
      <StatCard
        title="Registered Branches"
        value={metrics.activeBranches ?? "0 / 0"}
        icon={Building2}
        variant="warning"
      />
      <StatCard
        title="Total User Accounts"
        value={metrics.totalUsers ?? "0"}
        icon={Users}
        variant="default"
      />
      <StatCard
        title="Database Storage Size"
        value={metrics.databaseStorage ?? "0.00 MB"}
        icon={HardDrive}
        variant="info"
      />
      <StatCard
        title="Backup System Status"
        value={normalizedBackupStatus}
        icon={getBackupStatusIcon(normalizedBackupStatus)}
        variant={getBackupStatusVariant(normalizedBackupStatus)}
      />
    </section>
  );
};

export default OverviewMetricsCards;
