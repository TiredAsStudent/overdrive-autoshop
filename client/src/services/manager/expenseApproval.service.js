import api from "../api";

export const expenseApprovalService = {
  getPendingApprovals: async (
    page = 1,
    limit = 10,
    search = "",
    category = "all",
    branchId = "all",
  ) => {
    try {
      const response = await api.get("/manager/approvals/expenses/pending", {
        params: { page, limit, search, category, branch: branchId },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load pending expense approvals.",
      );
    }
  },

  getApprovalHistory: async (
    page = 1,
    limit = 10,
    search = "",
    category = "all",
    branchId = "all",
  ) => {
    try {
      const response = await api.get("/manager/approvals/expenses/history", {
        params: { page, limit, search, category, branch: branchId },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load expense approval history.",
      );
    }
  },

  getExpenseDetails: async (id) => {
    try {
      const response = await api.get(`/manager/approvals/expenses/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load expense details.",
      );
    }
  },

  approveExpense: async (id, remarks = "") => {
    try {
      const response = await api.patch(
        `/manager/approvals/expenses/${id}/approve`,
        { remarks },
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to approve Expense.",
      );
    }
  },

  rejectExpense: async (id, remarks) => {
    try {
      const response = await api.patch(
        `/manager/approvals/expenses/${id}/reject`,
        { remarks },
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to reject Expense.",
      );
    }
  },
};
