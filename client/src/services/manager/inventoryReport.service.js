import api from "../api";

export const inventoryReportService = {
  getInventoryReport: async (page = 1, limit = 10, filters = {}) => {
    try {
      const response = await api.get("/manager/reports/inventory", {
        params: {
          page,
          limit,
          search: filters.search || undefined,
          branch: filters.branch !== "all" ? filters.branch : undefined,
          category: filters.category !== "all" ? filters.category : undefined,
          stock_status:
            filters.stock_status !== "all" ? filters.stock_status : undefined,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load Inventory Report.";
      throw new Error(message);
    }
  },
};
