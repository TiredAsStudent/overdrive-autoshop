import api from "../api";

export const salesReportService = {
  getSalesReport: async (page = 1, limit = 10, filters = {}) => {
    try {
      const response = await api.get("/manager/reports/sales", {
        params: {
          page,
          limit,
          search: filters.search || undefined,
          branch: filters.branch !== "all" ? filters.branch : undefined,
          payment_status:
            filters.payment_status !== "all"
              ? filters.payment_status
              : undefined,
          customer_id:
            filters.customer_id !== "all" ? filters.customer_id : undefined,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load Sales Report.";
      throw new Error(message);
    }
  },
};
