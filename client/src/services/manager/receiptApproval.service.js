import api from "../api";

export const receiptApprovalService = {
  getPendingApprovals: async (
    page = 1,
    limit = 10,
    search = "",
    branchId = "all",
  ) => {
    try {
      const response = await api.get("/manager/approvals/receipts/pending", {
        params: { page, limit, search, branch: branchId },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load pending receipt approvals.",
      );
    }
  },

  getApprovalHistory: async (
    page = 1,
    limit = 10,
    search = "",
    branchId = "all",
  ) => {
    try {
      const response = await api.get("/manager/approvals/receipts/history", {
        params: { page, limit, search, branch: branchId },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load receipt approval history.",
      );
    }
  },

  getReceiptDetails: async (id) => {
    try {
      const response = await api.get(`/manager/approvals/receipts/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load receipt details.",
      );
    }
  },

  approveReceipt: async (id, remarks = "") => {
    try {
      const response = await api.patch(
        `/manager/approvals/receipts/${id}/approve`,
        { remarks },
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to approve Receipt.",
      );
    }
  },

  rejectReceipt: async (id, remarks) => {
    try {
      const response = await api.patch(
        `/manager/approvals/receipts/${id}/reject`,
        { remarks },
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to reject Receipt.",
      );
    }
  },
};
