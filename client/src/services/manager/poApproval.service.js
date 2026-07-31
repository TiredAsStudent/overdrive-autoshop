import api from "../api";

export const poApprovalService = {
  getPendingApprovals: async (
    page = 1,
    limit = 10,
    search = "",
    vendorId = "all",
    branchId = "all",
  ) => {
    try {
      const response = await api.get(
        "/manager/approvals/purchase-orders/pending",
        {
          params: { page, limit, search, vendor: vendorId, branch: branchId },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load pending approvals.",
      );
    }
  },

  getApprovalHistory: async (
    page = 1,
    limit = 10,
    search = "",
    vendorId = "all",
    branchId = "all",
  ) => {
    try {
      const response = await api.get(
        "/manager/approvals/purchase-orders/history",
        {
          params: { page, limit, search, vendor: vendorId, branch: branchId },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load approval history.",
      );
    }
  },

  getPODetails: async (id) => {
    try {
      const response = await api.get(
        `/manager/approvals/purchase-orders/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load PO details.",
      );
    }
  },

  approvePO: async (id, remarks = "") => {
    try {
      const response = await api.patch(
        `/manager/approvals/purchase-orders/${id}/approve`,
        {
          remarks,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to approve Purchase Order.",
      );
    }
  },

  rejectPO: async (id, remarks) => {
    try {
      const response = await api.patch(
        `/manager/approvals/purchase-orders/${id}/reject`,
        {
          remarks,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to reject Purchase Order.",
      );
    }
  },
};
