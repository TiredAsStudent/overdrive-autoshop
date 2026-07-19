import api from "../api";

export const estimateService = {
  getEstimates: async (
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    branch = "all",
  ) => {
    try {
      const response = await api.get("/staff/estimates", {
        params: { page, limit, search, status, branch },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load estimates.",
      );
    }
  },
  getEstimateDetails: async (id) => {
    try {
      const response = await api.get(`/staff/estimates/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to fetch estimate details.",
      );
    }
  },
  createEstimate: async (estimateData) => {
    try {
      const response = await api.post("/staff/estimates", estimateData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to create estimate.",
      );
    }
  },
  updateEstimate: async (id, estimateData) => {
    try {
      const response = await api.put(`/staff/estimates/${id}`, estimateData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to update estimate.",
      );
    }
  },
  updateStatus: async (id, status) => {
    try {
      const response = await api.patch(`/staff/estimates/${id}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to update estimate status.",
      );
    }
  },
};
