import api from "../api";

export const staffDashboardService = {
  getOverviewData: async (filters = {}) => {
    try {
      const response = await api.get("/staff/dashboard/overview", {
        params: {
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load Staff Dashboard Overview.";
      throw new Error(message);
    }
  },
};
