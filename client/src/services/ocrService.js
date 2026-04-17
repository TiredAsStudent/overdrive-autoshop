import api from "./api";

const ocrService = {
  getPendingQueue: async () => {
    try {
      const response = await api.get("/manager/ocr");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load OCR queue.",
      );
    }
  },

  getScanDetails: async (id) => {
    try {
      const response = await api.get(`/manager/ocr/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load scan details.",
      );
    }
  },

  approveScan: async (id, payload) => {
    try {
      const response = await api.post(`/manager/ocr/${id}/approve`, payload);
      // Notice we return the whole response to capture the 'inflationDetected' flag and message
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to approve receipt.",
      );
    }
  },

  rejectScan: async (id) => {
    try {
      const response = await api.post(`/manager/ocr/${id}/reject`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to reject receipt.",
      );
    }
  },
};

export default ocrService;
