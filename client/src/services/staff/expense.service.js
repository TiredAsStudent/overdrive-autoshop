import api from "../api";

export const expenseService = {
  getExpenses: async (
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    category = "all",
    branchId = "all",
  ) => {
    try {
      const response = await api.get("/staff/expenses", {
        params: {
          page,
          limit,
          search,
          status,
          category,
          branch: branchId,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load expenses.",
      );
    }
  },

  getExpenseDetails: async (id) => {
    try {
      const response = await api.get(`/staff/expenses/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load expense details.",
      );
    }
  },

  createExpense: async (expenseData) => {
    try {
      const response = await api.post("/staff/expenses", expenseData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to record expense.",
      );
    }
  },

  updateExpense: async (id, expenseData) => {
    try {
      const response = await api.put(`/staff/expenses/${id}`, expenseData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update expense.",
      );
    }
  },

  updateStatus: async (id, status) => {
    try {
      const response = await api.patch(`/staff/expenses/${id}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to update expense status.",
      );
    }
  },
};
