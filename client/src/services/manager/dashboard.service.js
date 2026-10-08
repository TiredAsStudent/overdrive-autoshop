import api from "../api";

export const managerDashboardService = {
  getOverviewData: async (filters = {}) => {
    try {
      const response = await api.get("/manager/dashboard/overview", {
        params: {
          branch: filters.branch !== "all" ? filters.branch : undefined,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load Executive Dashboard Overview.";
      throw new Error(message);
    }
  },
};
