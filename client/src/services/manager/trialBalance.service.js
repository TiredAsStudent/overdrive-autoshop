import api from "../api";

export const trialBalanceService = {
  getTrialBalance: async (filters = {}) => {
    try {
      const response = await api.get("/manager/accounting/trial-balance", {
        params: {
          search: filters.search || undefined,
          type: filters.type !== "all" ? filters.type : undefined,
          branch: filters.branch !== "all" ? filters.branch : undefined,
          start_date: filters.start_date || undefined,
          end_date: filters.end_date || undefined,
          hide_zero: filters.hide_zero ? "true" : "false",
        },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load Trial Balance.";
      throw new Error(message);
    }
  },
};
