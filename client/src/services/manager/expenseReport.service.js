import api from "../api";

export const expenseReportService = {
  getExpenseReport: async (page = 1, limit = 10, filters = {}) => {
    try {
      const response = await api.get("/manager/reports/expenses", {
        params: {
          page,
          limit,
          search: filters.search || undefined,
          branch: filters.branch !== "all" ? filters.branch : undefined,
          category_id:
            filters.category_id !== "all" ? filters.category_id : undefined,
          vendor_id:
            filters.vendor_id !== "all" ? filters.vendor_id : undefined,
          source_module:
            filters.source_module !== "all" ? filters.source_module : undefined,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load Expense Report.";
      throw new Error(message);
    }
  },
};
