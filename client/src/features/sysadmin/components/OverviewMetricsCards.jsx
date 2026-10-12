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

const OverviewMetricsCards = ({ metrics }) => {
  const getBackupStatusVariant = (status) => {
    if (status === "HEALTHY") return "success";
    if (status === "SYNCING" || status === "STANDBY") return "warning";
    return "danger";
  };

  const getBackupStatusIcon = (status) => {
    if (status === "HEALTHY") return ShieldCheck;
    if (status === "SYNCING" || status === "STANDBY") return Clock;
    return ServerCrash;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full">
      <StatCard
        title="Registered Branches"
        value={metrics.activeBranches}
        icon={Building2}
        variant="warning"
      />
      <StatCard
        title="Total User Accounts"
        value={metrics.totalUsers}
        icon={Users}
        variant="default"
      />
      <StatCard
        title="Database Storage Size"
        value={metrics.databaseStorage}
        icon={HardDrive}
        variant="info"
      />
      <StatCard
        title="Backup System Status"
        value={metrics.backupStatus}
        icon={getBackupStatusIcon(metrics.backupStatus)}
        variant={getBackupStatusVariant(metrics.backupStatus)}
      />
    </div>
  );
};

export default OverviewMetricsCards;
