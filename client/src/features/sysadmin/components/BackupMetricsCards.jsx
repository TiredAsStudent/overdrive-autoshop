import React from "react";
import { HardDrive, History, ShieldCheck, ServerCrash } from "lucide-react";
import StatCard from "../../../components/ui/StatCard";

const BackupMetricsCards = ({ totalVolume, successCount, lastExecution }) => {
  const getExecutionVariant = (status) => {
    if (status === "HEALTHY") return "success";
    if (status === "STANDBY") return "default";
    return "danger";
  };

  const getExecutionIcon = (status) => {
    if (status === "HEALTHY") return ShieldCheck;
    if (status === "STANDBY") return History;
    return ServerCrash;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full">
      <StatCard
        title="Network Storage Used"
        value={`${totalVolume} MB`}
        icon={HardDrive}
        variant="info"
      />
      <StatCard
        title="Historical Archives"
        value={`${successCount} Successful`}
        icon={History}
        variant="default"
      />
      <StatCard
        title="Last Execution State"
        value={lastExecution}
        icon={getExecutionIcon(lastExecution)}
        variant={getExecutionVariant(lastExecution)}
      />
    </div>
  );
};

export default BackupMetricsCards;
