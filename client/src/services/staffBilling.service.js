import api from "./api";

const staffBillingService = {
  getSalesOrders: async () => {
    try {
      const response = await api.get("/staff/sales-orders");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load Sales Orders.",
      );
    }
  },

  getInvoices: async () => {
    try {
      const response = await api.get("/staff/invoices");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to load Invoices.",
      );
    }
  },

  cancelOrder: async (id) => {
    try {
      const response = await api.post(`/staff/sales-orders/${id}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to cancel order.",
      );
    }
  },

  finalizeInvoice: async (id, paymentData) => {
    try {
      const response = await api.post(
        `/staff/sales-orders/${id}/finalize`,
        paymentData,
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message || "Failed to finalize invoice.",
      );
    }
  },
};

export default staffBillingService;
