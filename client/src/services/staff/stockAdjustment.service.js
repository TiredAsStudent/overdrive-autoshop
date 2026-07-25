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

  createRequest: async (adjustmentData) => {
    try {
      const payload = {
        item_id: parseInt(adjustmentData.item_id, 10),
        physical_count: parseInt(adjustmentData.physical_count, 10),
        reason: adjustmentData.reason,
        staff_remarks: adjustmentData.staff_remarks,
      };

      const response = await api.post("/staff/stock-adjustments", payload);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to submit adjustment request.",
      );
    }
  },
};
