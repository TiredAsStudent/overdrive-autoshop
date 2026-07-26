import api from "../api";

export const receiptService = {
  uploadAndScan: async (file) => {
    try {
      const formData = new FormData();
      formData.append("receipt", file);

      // Must override Content-Type for file uploads
      const response = await api.post("/staff/receipts/scan", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.details ||
          error.response?.data?.error?.message ||
          "Failed to scan document.",
      );
    }
  },

  getScanDetails: async (id) => {
    try {
      const response = await api.get(`/staff/receipts/scan/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load scan details.",
      );
    }
  },

  cancelScan: async (id) => {
    try {
      const response = await api.patch(`/staff/receipts/scan/${id}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to cancel scan.",
      );
    }
  },
};
