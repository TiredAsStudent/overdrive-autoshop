import api from "../api";

export const expenseService = {
  getActiveCategories: async () => {
    try {
      const response = await api.get("/staff/expenses/active-categories");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load expense categories.",
      );
    }
  },

  getExpenses: async (
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    expenseAccountId = "all",
    branchId = "all",
  ) => {
    try {
      const response = await api.get("/staff/expenses", {
        params: {
          page,
          limit,
          search,
          status,
          expense_account_id: expenseAccountId,
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

  createExpense: async (expenseData, attachmentFile = null) => {
    try {
      const formData = new FormData();

      Object.keys(expenseData).forEach((key) => {
        if (expenseData[key] !== null && expenseData[key] !== undefined) {
          formData.append(key, expenseData[key]);
        }
      });

      if (attachmentFile) {
        formData.append("attachment", attachmentFile);
      }

      const response = await api.post("/staff/expenses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to record expense.",
      );
    }
  },

  updateExpense: async (id, expenseData, attachmentFile = null) => {
    try {
      const formData = new FormData();

      Object.keys(expenseData).forEach((key) => {
        if (expenseData[key] !== null && expenseData[key] !== undefined) {
          formData.append(key, expenseData[key]);
        }
      });

      if (attachmentFile) {
        formData.append("attachment", attachmentFile);
      }

      const response = await api.put(`/staff/expenses/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
