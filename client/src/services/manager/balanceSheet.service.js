import api from "../api";

export const balanceSheetService = {
  getBalanceSheet: async (filters = {}) => {
    try {
      const response = await api.get("/manager/reports/balance-sheet", {
        params: {
          as_of_date: filters.as_of_date,
          branch: filters.branch !== "all" ? filters.branch : undefined,
          hide_zero: filters.hide_zero ? "true" : "false",
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to generate Balance Sheet.";
      throw new Error(message);
    }
  },
};
