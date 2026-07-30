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

  verifyAndPostExpense: async (id, verificationData) => {
    try {
      const response = await api.post(
        `/staff/receipts/scan/${id}/verify`,
        verificationData,
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to verify receipt.",
      );
    }
  },

  getReceiptHistory: async (
    page = 1,
    limit = 10,
    search = "",
    vendorId = "all",
    startDate = "",
    endDate = "",
  ) => {
    try {
      const response = await api.get("/staff/receipts/history", {
        params: {
          page,
          limit,
          search,
          vendor_id: vendorId,
          start_date: startDate,
          end_date: endDate,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load receipt history.",
      );
    }
  },

  getHistoryDetails: async (id) => {
    try {
      const response = await api.get(`/staff/receipts/history/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to load history details.",
      );
    }
  },
};
