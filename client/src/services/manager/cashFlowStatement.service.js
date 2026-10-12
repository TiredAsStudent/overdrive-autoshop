import api from "../api";

export const cashFlowStatementService = {
  getCashFlowStatement: async (filters = {}) => {
    try {
      const response = await api.get("/manager/reports/cash-flow", {
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
        "Failed to generate Cash Flow Statement.";
      throw new Error(message);
    }
  },
};
