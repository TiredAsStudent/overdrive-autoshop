import api from "./api";

const managerOcrService = {
  /**
   * Fetch the list of pending receipt scans across the enterprise
   */
  getPendingQueue: async () => {
    try {
      const response = await api.get("/manager/ocr");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch pending scans.",
      );
    }
  },

  /**
   * Fetch full details of a specific scan (Image, AI Data, Items)
   */
  getScanDetails: async (id) => {
    try {
      const response = await api.get(`/manager/ocr/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch scan details.",
      );
    }
  },

  /**
   * ACTION: Approve and trigger the Atomic Transaction (Ledger + Inventory + Balance)
   */
  approveScan: async (id, payload) => {
    try {
      const response = await api.post(`/manager/ocr/${id}/approve`, payload);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error?.details) {
        const zodErrors = error.response.data.error.details
          .map((d) => d.message)
          .join(", ");
        throw new Error(`Validation Error: ${zodErrors}`);
      }
      throw new Error(
        error.response?.data?.error?.message || "Approval failed.",
      );
    }
  },

  /**
   * ACTION: Reject with a mandatory feedback note for the Maker
   */
  rejectScan: async (id, reason) => {
    try {
      const response = await api.post(`/manager/ocr/${id}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Rejection failed.");
    }
  },
};

export default managerOcrService;
