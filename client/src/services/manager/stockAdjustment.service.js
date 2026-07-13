import api from "../api";

export const stockAdjustmentService = {
  getRequests: async (
    page = 1,
    limit = 10,
    search = "",
    status = "PENDING",
  ) => {
    try {
      const response = await api.get("/manager/adjustments", {
        params: { page, limit, search, status },
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to load adjustment requests.";
      throw new Error(message);
    }
  },

  approveRequest: async (id, managerRemarks) => {
    try {
      const response = await api.patch(`/manager/adjustments/${id}/approve`, {
        manager_remarks: managerRemarks,
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to approve adjustment.";
      throw new Error(message);
    }
  },

  rejectRequest: async (id, managerRemarks) => {
    try {
      const response = await api.patch(`/manager/adjustments/${id}/reject`, {
        manager_remarks: managerRemarks,
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to reject adjustment.";
      throw new Error(message);
    }
  },
};
