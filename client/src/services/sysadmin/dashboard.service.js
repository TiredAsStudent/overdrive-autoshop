import api from "../api";

export const dashboardService = {
  // Fetch the unified dashboard overview payload
  getOverview: async () => {
    try {
      const response = await api.get("/sysadmin/dashboard/overview");

      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.details ||
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load dashboard overview data.";
      throw new Error(message);
    }
  },
};
