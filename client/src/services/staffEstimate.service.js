import api from "./api";

const staffEstimateService = {
  getEstimates: async () => {
    try {
      const response = await api.get("/staff/estimates");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load estimates.",
      );
    }
  },

  getEstimateDetails: async (id) => {
    try {
      const response = await api.get(`/staff/estimates/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load estimate details.",
      );
    }
  },

  createEstimate: async (payload) => {
    try {
      const response = await api.post("/staff/estimates", payload);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error?.details
        ? error.response.data.error.details.map((d) => d.message).join(", ")
        : error.response?.data?.error?.message || "Failed to create estimate.";
      throw new Error(message);
    }
  },

  updateStatus: async (id, status) => {
    try {
      const response = await api.patch(`/staff/estimates/${id}/status`, {
        status,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to update estimate status.",
      );
    }
  },

  convertEstimate: async (id) => {
    try {
      const response = await api.post(`/staff/estimates/${id}/convert`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to convert estimate to Sales Order.",
      );
    }
  },
};

export default staffEstimateService;
