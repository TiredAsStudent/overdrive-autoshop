import api from "../api";

export const stockAdjustmentService = {
  getRequests: async (page = 1, limit = 10, search = "", status = "all") => {
    try {
      const response = await api.get("/staff/stock-adjustments", {
        params: { page, limit, search, status },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load adjustment requests.",
      );
    }
  },

  createRequest: async (adjustmentData, evidenceFile) => {
    try {
      const formData = new FormData();
      formData.append("item_id", adjustmentData.item_id);
      formData.append("physical_count", adjustmentData.physical_count);
      formData.append("reason", adjustmentData.reason);
      formData.append("staff_remarks", adjustmentData.staff_remarks);

      if (evidenceFile) {
        formData.append("evidence", evidenceFile);
      }

      const response = await api.post("/staff/stock-adjustments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to submit adjustment request.",
      );
    }
  },
};
