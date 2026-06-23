import api from "../api";

export const healthService = {
  // Fetch real-time hardware telemetry and network heartbeat
  getHealthMetrics: async () => {
    try {
      const response = await api.get("/sysadmin/health");

      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to communicate with system monitoring services.";
      throw new Error(message);
    }
  },
};
