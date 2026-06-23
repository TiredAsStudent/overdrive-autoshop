import api from "../api";

export const backupService = {
  // Fetch paginated and filtered backup logs
  getBackupLogs: async (page = 1, limit = 5, search = "") => {
    try {
      const response = await api.get("/sysadmin/backups", {
        params: {
          page,
          limit,
          search,
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load system backup logs.";
      throw new Error(message);
    }
  },

  // Trigger a manual database snapshot
  triggerBackup: async () => {
    try {
      const response = await api.post("/sysadmin/backups/trigger");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to compile database backup.";
      throw new Error(message);
    }
  },
};
