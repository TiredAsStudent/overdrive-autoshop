import React from "react";
import { HardDrive, History, ShieldCheck, ServerCrash } from "lucide-react";
import StatCard from "../../../components/ui/StatCard";

const BackupMetricsCards = ({
  totalVolume = "0.00",
  successCount = 0,
  lastExecution = "STANDBY",
}) => {
  const normalizedStatus = (lastExecution || "STANDBY")
    .toString()
    .toUpperCase();

  const getExecutionVariant = (status) => {
    if (status === "HEALTHY" || status === "SUCCESS") return "success";
    if (status === "STANDBY" || status === "SYNCING") return "default";
    return "danger";
  };

  const getExecutionIcon = (status) => {
    if (status === "HEALTHY" || status === "SUCCESS") return ShieldCheck;
    if (status === "STANDBY" || status === "SYNCING") return History;
    return ServerCrash;
  };

  const formattedVolume = String(totalVolume).toUpperCase().endsWith("MB")
    ? String(totalVolume)
    : `${totalVolume ?? "0.00"} MB`;

  return (
    <section
      aria-label="Database Backup Summary Metrics"
      className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 w-full"
    >
      <StatCard
        title="Network Storage Used"
        value={formattedVolume}
        icon={HardDrive}
        variant="info"
      />
      <StatCard
        title="Historical Archives"
        value={`${successCount ?? 0} Successful`}
        icon={History}
        variant="default"
      />
      <StatCard
        title="Last Execution State"
        value={normalizedStatus}
        icon={getExecutionIcon(normalizedStatus)}
        variant={getExecutionVariant(normalizedStatus)}
      />
    </section>
  );
};

export default BackupMetricsCards;
