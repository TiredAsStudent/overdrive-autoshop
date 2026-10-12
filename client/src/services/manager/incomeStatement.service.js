import api from "../api";

export const incomeStatementService = {
  getIncomeStatement: async (filters = {}) => {
    try {
      const response = await api.get("/manager/reports/income-statement", {
        params: {
          start_date: filters.start_date,
          end_date: filters.end_date,
          branch: filters.branch !== "all" ? filters.branch : undefined,
          hide_zero: filters.hide_zero ? "true" : "false",
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to generate Income Statement.";
      throw new Error(message);
    }
  },
};
